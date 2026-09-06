import { useState, type FormEvent } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/lib/i18n";
import { API_URL, setStoredToken } from "@/lib/api";

type Status = "idle" | "loading";

type LoginSuccess = { access_token: string; token_type: string };

export default function Login() {
  const { t } = useLanguage();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setStatus("loading");

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (response.status === 200) {
        const body = (await response.json()) as LoginSuccess;
        setStoredToken(body.access_token);
        router.push("/solve");
        return;
      }

      if (response.status === 401) {
        setError(t.auth.loginInvalidCredentials);
      } else {
        setError(t.auth.genericError);
      }
      setStatus("idle");
    } catch (err) {
      console.error("[login] échec de la connexion :", err);
      setError(t.auth.genericError);
      setStatus("idle");
    }
  }

  return (
    <>
      <Head>
        <title>{t.auth.loginHeading} — Calcile</title>
      </Head>

      <div className="fixed right-4 top-4 z-50">
        <LanguageSwitcher />
      </div>

      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6 py-24">
        <div className="w-full max-w-sm">
          <h1 className="text-center text-2xl font-bold text-gray-900">
            {t.auth.loginHeading}
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t.auth.loginSubtitle}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label htmlFor="login-email" className="sr-only">
                {t.auth.emailLabel}
              </label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t.auth.emailPlaceholder}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
              />
            </div>
            <div>
              <label htmlFor="login-password" className="sr-only">
                {t.auth.passwordLabel}
              </label>
              <input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={t.auth.passwordPlaceholderLogin}
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
                ? t.auth.loginSubmitLoading
                : t.auth.loginSubmit}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            {t.auth.noAccountPrefix}{" "}
            <Link
              href="/"
              className="font-semibold text-violet-700 hover:underline"
            >
              {t.auth.noAccountLinkLabel}
            </Link>
            {t.auth.noAccountSuffix}
          </p>
        </div>
      </main>
    </>
  );
}
