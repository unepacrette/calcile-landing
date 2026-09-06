type Step = {
  number: string;
  title: string;
};

const STEPS: Step[] = [
  { number: "1", title: "Entre ton équation ou expression" },
  {
    number: "2",
    title:
      "Calcile la résout avec SymPy (équations, dérivées, intégrales)",
  },
  {
    number: "3",
    title: "Tu reçois la réponse ET chaque étape de la résolution",
  },
];

export default function HowItWorks() {
  return (
    <section className="bg-gray-50">
      <div className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="text-center text-3xl font-bold text-gray-900">
          Comment ça marche
        </h2>
        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step.number} className="flex flex-col items-center text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-600 text-lg font-bold text-white">
                {step.number}
              </span>
              <p className="mt-4 text-base text-gray-700">{step.title}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
