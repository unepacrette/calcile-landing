import { useState, type FormEvent } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/lib/i18n";
import { API_URL } from "@/lib/api";

type Status = "idle" | "loading";

const inputClass =
  "w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-300";

// Stage 1: no ?token= in the URL -- ask for the account email and request
// a reset link (always a generic outcome, see api.routes.password_reset_request).
function RequestForm() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setStatus("loading");

    try {
      const response = await fetch(`${API_URL}/api/password-reset/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      // Deliberately the same UI outcome regardless of response body
      // content: the backend already never reveals whether the account
      // exists, and showing anything but a fixed, generic success message
      // here (on any 2xx) would leak that distinction right back at the UI
      // layer.
      if (response.ok) {
        setSuccess(true);
      } else {
        setError(t.auth.genericError);
      }
      setStatus("idle");
    } catch (err) {
      console.error("[reset-password] échec de la demande :", err);
      setError(t.auth.genericError);
      setStatus("idle");
    }
  }

  if (success) {
    return (
      <p className="mt-8 text-center text-sm font-medium text-green-600">
        {t.auth.passwordReset.requestSuccess}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      <div>
        <label htmlFor="reset-request-email" className="sr-only">
          {t.auth.emailLabel}
        </label>
        <input
          id="reset-request-email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={t.auth.emailPlaceholder}
          className={inputClass}
        />
      </div>

      {error && <p className="text-sm font-medium text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full rounded-lg bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "loading"
          ? t.auth.passwordReset.requestSubmitLoading
          : t.auth.passwordReset.requestSubmit}
      </button>
    </form>
  );
}

// Stage 2: ?token=... is present -- set a new password.
function ConfirmForm({ token }: { token: string }) {
  const { t } = useLanguage();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

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
      const response = await fetch(`${API_URL}/api/password-reset/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: newPassword }),
      });

      if (response.status === 200) {
        setSuccess(true);
        setStatus("idle");
        return;
      }

      if (response.status === 400) {
        setError(t.auth.passwordReset.invalidOrExpiredToken);
      } else {
        setError(t.auth.genericError);
      }
      setStatus("idle");
    } catch (err) {
      console.error("[reset-password] échec de la confirmation :", err);
      setError(t.auth.genericError);
      setStatus("idle");
    }
  }

  if (success) {
    return (
      <p className="mt-8 text-center text-sm font-medium text-green-600">
        {t.auth.passwordReset.confirmSuccess}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      <div>
        <label
          htmlFor="reset-confirm-new-password"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          {t.auth.profile.newPasswordLabel}
        </label>
        <input
          id="reset-confirm-new-password"
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
          htmlFor="reset-confirm-confirm-password"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          {t.auth.profile.confirmPasswordLabel}
        </label>
        <input
          id="reset-confirm-confirm-password"
          type="password"
          required
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder={t.auth.profile.confirmPasswordPlaceholder}
          className={inputClass}
        />
      </div>

      {error && <p className="text-sm font-medium text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full rounded-lg bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "loading"
          ? t.auth.passwordReset.confirmSubmitLoading
          : t.auth.passwordReset.confirmSubmit}
      </button>
    </form>
  );
}

export default function ResetPassword() {
  const { t } = useLanguage();
  const router = useRouter();
  const rawToken = router.query.token;
  const token = typeof rawToken === "string" && rawToken.length > 0 ? rawToken : null;

  return (
    <>
      <Head>
        <title>{t.auth.passwordReset.heading} — Calcile</title>
      </Head>

      <div className="fixed right-4 top-4 z-50">
        <LanguageSwitcher />
      </div>

      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6 py-24">
        <div className="w-full max-w-sm">
          <h1 className="text-center text-2xl font-bold text-gray-900">
            {t.auth.passwordReset.heading}
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            {token
              ? t.auth.passwordReset.confirmSubtitle
              : t.auth.passwordReset.requestSubtitle}
          </p>

          {token ? <ConfirmForm token={token} /> : <RequestForm />}

          <p className="mt-6 text-center text-sm text-gray-600">
            <Link
              href="/login"
              className="font-semibold text-violet-700 hover:underline"
            >
              {t.auth.passwordReset.backToLogin}
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}
