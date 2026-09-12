import { useEffect, useState, type FormEvent } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/lib/i18n";
import {
  API_URL,
  authHeaders,
  clearStoredToken,
  getStoredToken,
} from "@/lib/api";

type Status = "idle" | "loading";
type BillingTier = "student" | "prof";
type BillingCycle = "monthly" | "yearly";

// Return type of useLanguage().t -- not exported from lib/i18n, so
// inferred this way rather than duplicating its shape here.
type LanguageStrings = ReturnType<typeof useLanguage>["t"];

type BillingStatusApiResponse = {
  tier: string;
  status: string;
  has_stripe_customer: boolean;
};

function tierDisplayName(tier: string, t: LanguageStrings): string {
  switch (tier) {
    case "student":
      return t.auth.profile.billing.tierStudent;
    case "prof":
      return t.auth.profile.billing.tierProf;
    case "lab":
      return t.auth.profile.billing.tierLab;
    default:
      return t.auth.profile.billing.tierFree;
  }
}

function statusDisplayName(status: string, t: LanguageStrings): string | null {
  switch (status) {
    case "active":
      return t.auth.profile.billing.statusActive;
    case "canceled":
      return t.auth.profile.billing.statusCanceled;
    case "past_due":
      return t.auth.profile.billing.statusPastDue;
    default:
      // "none" (no billing account yet) has nothing meaningful to show
      // next to the tier name.
      return null;
  }
}

const inputClass =
  "w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-300";

// One Student/Prof subscribe card: a monthly/yearly toggle plus a
// "Subscribe" button. A top-level component (not defined inside
// Profile()) so its own cycle toggle state survives re-renders of the
// parent instead of remounting every time.
function TierCheckoutCard({
  tier,
  name,
  monthlyPrice,
  yearlyPrice,
  disabled,
  onSubscribe,
  t,
}: {
  tier: BillingTier;
  name: string;
  monthlyPrice: string;
  yearlyPrice: string;
  // True while a checkout request is in flight, or while the mandatory
  // withdrawal-right consent checkbox hasn't been checked yet (see
  // Profile()) — either way, subscribing isn't allowed right now.
  disabled: boolean;
  onSubscribe: (tier: BillingTier, cycle: BillingCycle) => void;
  t: LanguageStrings;
}) {
  const [cycle, setCycle] = useState<BillingCycle>("monthly");

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-gray-900">{name}</span>
        <div className="inline-flex rounded-lg border border-gray-300 bg-white p-0.5 text-xs font-semibold">
          {(["monthly", "yearly"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setCycle(option)}
              aria-pressed={cycle === option}
              className={`rounded-md px-2.5 py-1 transition duration-150 active:scale-95 ${
                cycle === option
                  ? "bg-violet-600 text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {option === "monthly" ? t.auth.profile.billing.monthly : t.auth.profile.billing.yearly}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-2 text-sm text-gray-600">
        {cycle === "monthly" ? monthlyPrice : yearlyPrice}
      </p>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onSubscribe(tier, cycle)}
        className="mt-3 w-full rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition duration-150 hover:bg-violet-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100"
      >
        {t.auth.profile.billing.subscribe}
      </button>
    </div>
  );
}

export default function Profile() {
  const { t } = useLanguage();
  const router = useRouter();

  // Auth guard: same pattern as pages/solve.tsx — null until we've
  // checked localStorage (avoids flashing the form before a redirect).
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const stored = getStoredToken();
    if (!stored) {
      router.replace("/login");
      return;
    }
    // Reading localStorage must stay client-only (no `window` during SSR),
    // so the token can't be a lazy useState initializer without risking a
    // hydration mismatch — syncing it from that external store on mount is
    // the correct pattern here despite the lint rule below.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setToken(stored);
  }, [router]);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // --- Billing ---
  const [billingLoading, setBillingLoading] = useState(true);
  const [billingTier, setBillingTier] = useState("free");
  const [billingStatus, setBillingStatus] = useState("none");
  const [hasStripeCustomer, setHasStripeCustomer] = useState(false);
  const [billingActionLoading, setBillingActionLoading] = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [checkoutNotice, setCheckoutNotice] = useState<"success" | "cancel" | null>(null);
  // Required before Stripe Checkout can be opened for Student/Prof: an
  // unchecked-by-default, explicit waiver of the 14-day withdrawal right
  // (Code de la consommation, art. L221-28 13°) -- access is granted
  // immediately on payment, so the right is only lost if the user
  // expressly asks for immediate performance and expressly waives it.
  const [withdrawalConsent, setWithdrawalConsent] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    async function loadBillingStatus() {
      try {
        const response = await fetch(`${API_URL}/api/billing/status`, {
          headers: authHeaders(token as string),
        });
        if (response.status === 401) {
          clearStoredToken();
          router.replace("/login");
          return;
        }
        if (!response.ok) return;
        const body = (await response.json()) as BillingStatusApiResponse;
        if (cancelled) return;
        setBillingTier(body.tier);
        setBillingStatus(body.status);
        setHasStripeCustomer(body.has_stripe_customer);
      } catch (err) {
        console.error("[profile] échec du chargement du statut de facturation :", err);
      } finally {
        if (!cancelled) setBillingLoading(false);
      }
    }

    loadBillingStatus();
    return () => {
      cancelled = true;
    };
  }, [token, router]);

  // Return from Stripe Checkout: pick up ?checkout=success|cancel, show
  // a message, then strip the query param so a page refresh doesn't
  // re-show it.
  useEffect(() => {
    if (!router.isReady) return;
    const checkout = router.query.checkout;
    if (checkout === "success" || checkout === "cancel") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCheckoutNotice(checkout);
      router.replace("/profile", undefined, { shallow: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, router.query.checkout]);

  async function handleSubscribe(tier: BillingTier, cycle: BillingCycle) {
    // The "Subscribe" buttons are already disabled until this is
    // checked -- this guard is just the non-bypassable backstop.
    if (!token || !withdrawalConsent) return;
    setBillingError(null);
    setBillingActionLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/billing/checkout`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ tier, cycle }),
      });
      if (response.status === 401) {
        clearStoredToken();
        router.replace("/login");
        return;
      }
      if (!response.ok) {
        setBillingError(t.auth.profile.genericError);
        setBillingActionLoading(false);
        return;
      }
      const body = (await response.json()) as { checkout_url: string };
      window.location.href = body.checkout_url;
    } catch (err) {
      console.error("[profile] échec de la création de la session de paiement :", err);
      setBillingError(t.auth.profile.genericError);
      setBillingActionLoading(false);
    }
  }

  async function handleManageSubscription() {
    if (!token) return;
    setBillingError(null);
    setBillingActionLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/billing/portal`, {
        method: "POST",
        headers: authHeaders(token),
      });
      if (response.status === 401) {
        clearStoredToken();
        router.replace("/login");
        return;
      }
      if (!response.ok) {
        setBillingError(t.auth.profile.genericError);
        setBillingActionLoading(false);
        return;
      }
      const body = (await response.json()) as { portal_url: string };
      window.location.href = body.portal_url;
    } catch (err) {
      console.error("[profile] échec de l'ouverture du portail de facturation :", err);
      setBillingError(t.auth.profile.genericError);
      setBillingActionLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;

    setError(null);
    setSuccess(false);

    if (newPassword.length < 8) {
      setError(t.auth.profile.passwordTooShort);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t.auth.profile.passwordsDontMatch);
      return;
    }

    setStatus("loading");

    try {
      const response = await fetch(`${API_URL}/api/user/password`, {
        method: "PATCH",
        headers: authHeaders(token),
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      if (response.status === 200) {
        setSuccess(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setStatus("idle");
        return;
      }

      if (response.status === 401) {
        // Could be a wrong current password OR an expired/invalid token —
        // the API's 401 doesn't distinguish the two. A typo shouldn't force
        // a re-login, so we show a message and let the user retry rather
        // than clearing the token here.
        setError(t.auth.profile.invalidCurrentPassword);
      } else {
        setError(t.auth.profile.genericError);
      }
      setStatus("idle");
    } catch (err) {
      console.error("[profile] échec du changement de mot de passe :", err);
      setError(t.auth.profile.genericError);
      setStatus("idle");
    }
  }

  if (!token) {
    return null;
  }

  return (
    <>
      <Head>
        <title>{t.auth.profile.heading} — Calcile</title>
      </Head>

      <div className="fixed right-4 top-4 z-50">
        <LanguageSwitcher />
      </div>

      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6 py-24">
        <div className="w-full max-w-sm">
          <h1 className="text-center text-2xl font-bold text-gray-900">
            {t.auth.profile.heading}
          </h1>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label
                htmlFor="profile-current-password"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                {t.auth.profile.currentPasswordLabel}
              </label>
              <input
                id="profile-current-password"
                type="password"
                required
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                placeholder={t.auth.profile.currentPasswordPlaceholder}
                className={inputClass}
              />
            </div>
            <div>
              <label
                htmlFor="profile-new-password"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                {t.auth.profile.newPasswordLabel}
              </label>
              <input
                id="profile-new-password"
                type="password"
                required
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder={t.auth.profile.newPasswordPlaceholder}
                className={inputClass}
              />
            </div>
            <div>
              <label
                htmlFor="profile-confirm-password"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                {t.auth.profile.confirmPasswordLabel}
              </label>
              <input
                id="profile-confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder={t.auth.profile.confirmPasswordPlaceholder}
                className={inputClass}
              />
            </div>

            {error && (
              <p className="text-sm font-medium text-red-600">{error}</p>
            )}
            {success && (
              <p className="text-sm font-medium text-green-600">
                {t.auth.profile.success}
              </p>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full rounded-lg bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition duration-150 hover:bg-violet-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100"
            >
              {status === "loading"
                ? t.auth.profile.submitLoading
                : t.auth.profile.submit}
            </button>
          </form>

          <section className="mt-10 border-t border-gray-200 pt-8">
            <h2 className="text-center text-lg font-bold text-gray-900">
              {t.auth.profile.billing.heading}
            </h2>

            {checkoutNotice === "success" && (
              <p className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-center text-sm font-medium text-green-700">
                {t.auth.profile.billing.checkoutSuccessNotice}
              </p>
            )}
            {checkoutNotice === "cancel" && (
              <p className="mt-4 rounded-lg bg-gray-100 px-3 py-2 text-center text-sm font-medium text-gray-600">
                {t.auth.profile.billing.checkoutCancelNotice}
              </p>
            )}

            {!billingLoading && (
              <>
                <p className="mt-4 text-center text-sm text-gray-600">
                  {t.auth.profile.billing.currentTierPrefix}{" "}
                  <span className="font-semibold text-gray-900">
                    {tierDisplayName(billingTier, t)}
                  </span>
                  {statusDisplayName(billingStatus, t) && (
                    <span className="text-gray-500">
                      {" "}
                      ({statusDisplayName(billingStatus, t)})
                    </span>
                  )}
                </p>

                {billingError && (
                  <p className="mt-3 text-center text-sm font-medium text-red-600">
                    {billingError}
                  </p>
                )}

                {billingTier === "free" && (
                  <div className="mt-4 space-y-3">
                    {/* Required before either "Subscribe" button below can
                        be used: an explicit, unchecked-by-default waiver
                        of the 14-day withdrawal right (Code de la
                        consommation, art. L221-28 13°) -- access starts
                        immediately on payment, so the right is only lost
                        if the user expressly asks for that and expressly
                        waives it. */}
                    <div className="flex items-start gap-2 rounded-lg bg-gray-50 p-3">
                      <input
                        id="withdrawal-consent"
                        type="checkbox"
                        checked={withdrawalConsent}
                        onChange={(event) => setWithdrawalConsent(event.target.checked)}
                        className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-violet-600 focus:ring-violet-300"
                      />
                      <label
                        htmlFor="withdrawal-consent"
                        className="text-xs leading-relaxed text-gray-600"
                      >
                        {t.auth.profile.billing.withdrawalConsentLabel}{" "}
                        <Link
                          href="/terms"
                          className="font-semibold text-violet-700 hover:underline"
                        >
                          {t.auth.profile.billing.withdrawalConsentTermsLink}
                        </Link>
                      </label>
                    </div>

                    <TierCheckoutCard
                      tier="student"
                      name={t.auth.profile.billing.studentName}
                      monthlyPrice={t.auth.profile.billing.studentMonthlyPrice}
                      yearlyPrice={t.auth.profile.billing.studentYearlyPrice}
                      disabled={billingActionLoading || !withdrawalConsent}
                      onSubscribe={handleSubscribe}
                      t={t}
                    />
                    <TierCheckoutCard
                      tier="prof"
                      name={t.auth.profile.billing.profName}
                      monthlyPrice={t.auth.profile.billing.profMonthlyPrice}
                      yearlyPrice={t.auth.profile.billing.profYearlyPrice}
                      disabled={billingActionLoading || !withdrawalConsent}
                      onSubscribe={handleSubscribe}
                      t={t}
                    />
                    <div className="rounded-lg border border-gray-200 p-4 text-center">
                      <p className="text-sm font-semibold text-gray-900">
                        {t.auth.profile.billing.labName}
                      </p>
                      <p className="mt-1 text-sm text-gray-600">
                        {t.auth.profile.billing.labPrice}
                      </p>
                      <a
                        href="mailto:contact@calcile.fr"
                        className="mt-3 inline-block text-sm font-semibold text-violet-700 hover:underline"
                      >
                        {t.auth.profile.billing.labContact}
                      </a>
                    </div>
                  </div>
                )}

                {hasStripeCustomer && (
                  <button
                    type="button"
                    disabled={billingActionLoading}
                    onClick={handleManageSubscription}
                    className="mt-4 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm transition duration-150 hover:border-gray-400 hover:bg-gray-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100"
                  >
                    {t.auth.profile.billing.managePortal}
                  </button>
                )}
              </>
            )}
          </section>

          <p className="mt-6 text-center text-sm text-gray-600">
            <Link
              href="/solve"
              className="font-semibold text-violet-700 hover:underline"
            >
              {t.auth.profile.backToSolve}
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}
