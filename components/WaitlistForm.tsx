import { useState, type FormEvent } from "react";

type Status = "idle" | "loading" | "success" | "error";

export default function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  // TODO: connecter au formulaire d'inscription Mailchimp une fois l'embed
  // code récupéré. Pour l'instant, on log l'email et on poste vers une
  // route API interne (/api/waitlist) qui ne fait elle-même que logger.
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    console.log("[waitlist] email soumis :", email);

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error("Réponse non-ok du serveur");
      }

      setStatus("success");
      setEmail("");
    } catch (error) {
      console.error("[waitlist] échec de l'inscription :", error);
      setStatus("error");
    }
  }

  return (
    <section id="waitlist" className="bg-violet-700">
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <h2 className="text-3xl font-bold text-white">
          Sois parmi les premiers testeurs
        </h2>
        <p className="mt-3 text-violet-100">
          Laisse-nous ton email, on te prévient dès que Calcile ouvre ses
          portes.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center"
        >
          <label htmlFor="waitlist-email" className="sr-only">
            Adresse email
          </label>
          <input
            id="waitlist-email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="ton@email.com"
            className="w-full rounded-lg border-0 px-4 py-3 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-300 sm:max-w-xs"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="rounded-lg bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "loading" ? "Inscription…" : "Je m'inscris"}
          </button>
        </form>

        {status === "success" && (
          <p className="mt-4 text-sm font-medium text-white">
            Merci ! Tu es sur la liste 🎉
          </p>
        )}
        {status === "error" && (
          <p className="mt-4 text-sm font-medium text-red-100">
            Une erreur est survenue, réessaie dans un instant.
          </p>
        )}
      </div>
    </section>
  );
}
