import { useEffect, useState, type FormEvent } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/lib/i18n";
import {
  API_URL,
  authHeaders,
  getStoredToken,
} from "@/lib/api";

type Status = "idle" | "loading";

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
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
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
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
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
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
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
              className="w-full rounded-lg bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === "loading"
                ? t.auth.profile.submitLoading
                : t.auth.profile.submit}
            </button>
          </form>

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
