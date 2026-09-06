const CALENDLY_URL = "https://calendly.com/amaury-calcile"; // TODO: remplacer par l'URL Calendly réelle

export default function Hero() {
  return (
    <section className="bg-gradient-to-b from-violet-50 to-white">
      <div className="mx-auto flex max-w-5xl flex-col items-center px-6 py-24 text-center sm:py-32">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Calcile — Résous tes maths, comprends chaque étape
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-gray-600 sm:text-xl">
          L&apos;API de calcul symbolique qui explique, pas juste qui répond.
          Comme WolframAlpha, mais avec les étapes détaillées et 80% moins
          cher.
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <a
            href="#waitlist"
            className="rounded-lg bg-violet-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-violet-700"
          >
            Rejoindre la waitlist
          </a>
          <a
            href={CALENDLY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-gray-300 bg-white px-6 py-3 text-base font-semibold text-gray-900 transition hover:border-gray-400 hover:bg-gray-50"
          >
            Réserver une démo
          </a>
        </div>
      </div>
    </section>
  );
}
