import { useState, type FormEvent } from "react";
import { useLanguage } from "@/lib/i18n";

type Status = "idle" | "loading" | "success" | "alreadySubscribed" | "error";

type WaitlistApiResponse =
  | { success: true; alreadySubscribed?: boolean }
  | { success: false; error: string };

type WaitlistFormProps = {
  selectedTier?: string | null;
  onClearTier?: () => void;
};

export default function WaitlistForm({
  selectedTier = null,
  onClearTier,
}: WaitlistFormProps) {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  // Source of truth lives in the parent (pages/index.tsx): it passes
  // selectedTier and onClearTier, and onClearTier resets it to null,
  // which flows back down through the prop. No local state needed here.
  const tier = selectedTier;

  function handleClearTier() {
    onClearTier?.();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, tier }),
      });

      const body = (await response.json()) as WaitlistApiResponse;

      if (!body.success) {
        setStatus("error");
        return;
      }

      setStatus(body.alreadySubscribed ? "alreadySubscribed" : "success");
      setEmail("");
    } catch (error) {
      console.error("[waitlist] échec de l'inscription :", error);
      setStatus("error");
    }
  }

  return (
    <section id="waitlist" className="bg-ink">
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <h2 className="font-display text-3xl font-semibold text-paper-raised">
          {t.waitlist.heading}
        </h2>
        <p className="mt-3 text-paper-raised/70">{t.waitlist.subtitle}</p>

        {tier && (
          <p className="mt-4 text-sm text-paper-raised/70">
            {t.waitlist.tierPrefix}{" "}
            <span className="font-semibold text-paper-raised">{tier}</span>{" "}
            <button
              type="button"
              onClick={handleClearTier}
              className="underline underline-offset-2 hover:text-paper-raised"
            >
              {t.waitlist.change}
            </button>
          </p>
        )}

        <form
          onSubmit={handleSubmit}
          className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center"
        >
          <label htmlFor="waitlist-email" className="sr-only">
            {t.waitlist.emailLabel}
          </label>
          <input
            id="waitlist-email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={t.waitlist.emailPlaceholder}
            className="w-full rounded-lg border-0 px-4 py-3 text-ink shadow-sm focus:outline-none focus:ring-2 focus:ring-mark sm:max-w-xs"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="rounded-lg bg-mark px-6 py-3 text-sm font-semibold text-paper-raised transition duration-150 hover:bg-mark-strong active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100"
          >
            {status === "loading" ? t.waitlist.submitLoading : t.waitlist.submit}
          </button>
        </form>

        {status === "success" && (
          <p className="mt-4 text-sm font-medium text-paper-raised">
            {t.waitlist.success}
          </p>
        )}
        {status === "alreadySubscribed" && (
          <p className="mt-4 text-sm font-medium text-paper-raised">
            {t.waitlist.alreadySubscribed}
          </p>
        )}
        {status === "error" && (
          <p className="mt-4 text-sm font-medium text-mark-soft">
            {t.waitlist.error}
          </p>
        )}
      </div>
    </section>
  );
}
