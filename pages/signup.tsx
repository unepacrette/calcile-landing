import { useState, type FormEvent } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/lib/i18n";
import { API_URL, setStoredToken } from "@/lib/api";

type Status = "idle" | "loading";

type SignupSuccess = { access_token: string; token_type: string };

export default function Signup() {
  const { t } = useLanguage();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError(t.auth.passwordTooShort);
      return;
    }

    setStatus("loading");

    try {
      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (response.status === 201) {
        const body = (await response.json()) as SignupSuccess;
        setStoredToken(body.access_token);
        router.push("/solve");
        return;
      }

      if (response.status === 400 || response.status === 409) {
        setError(t.auth.signupEmailInUse);
      } else {
        setError(t.auth.genericError);
      }
      setStatus("idle");
    } catch (err) {
      console.error("[signup] échec de la création de compte :", err);
      setError(t.auth.genericError);
      setStatus("idle");
    }
  }

  return (
    <>
      <Head>
        <title>{t.auth.signupHeading} — Calcile</title>
      </Head>

      <div className="fixed right-4 top-4 z-50">
        <LanguageSwitcher />
      </div>

      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6 py-24">
        <div className="w-full max-w-sm">
          <h1 className="text-center text-2xl font-bold text-gray-900">
            {t.auth.signupHeading}
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t.auth.signupSubtitle}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label htmlFor="signup-email" className="sr-only">
                {t.auth.emailLabel}
              </label>
              <input
                id="signup-email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t.auth.emailPlaceholder}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
              />
            </div>
            <div>
              <label htmlFor="signup-password" className="sr-only">
                {t.auth.passwordLabel}
              </label>
              <input
                id="signup-password"
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={t.auth.passwordPlaceholderSignup}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
              />
            </div>

            {error && (
              <p className="text-sm font-medium text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full rounded-lg bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === "loading"
                ? t.auth.signupSubmitLoading
                : t.auth.signupSubmit}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            {t.auth.alreadyHaveAccount}{" "}
            <Link
              href="/login"
              className="font-semibold text-violet-700 hover:underline"
            >
              {t.auth.goToLogin}
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}
