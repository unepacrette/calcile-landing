type Audience = {
  title: string;
  description: string;
  price: string;
  annualNote?: string;
};

const AUDIENCES: Audience[] = [
  {
    title: "Étudiants",
    description:
      "Vérifie tes réponses et comprends chaque étape de résolution — comme un prof particulier disponible 24/7.",
    price: "4,90€/mois",
    annualNote: "ou 39€/an en annuel",
  },
  {
    title: "Profs",
    description:
      "Automatise la correction d'exercices. Économise 3-4h par semaine.",
    price: "50€/mois",
    annualNote: "ou 450€/an en annuel",
  },
  {
    title: "Labs/Universités",
    description:
      "Alternative SaaS à Mathematica/Maple, API robuste, 80% moins cher.",
    price: "Sur devis",
  },
];

export default function AudienceSection() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="text-center text-3xl font-bold text-gray-900">
          Pour qui ?
        </h2>
        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          {AUDIENCES.map((audience) => (
            <div
              key={audience.title}
              className="flex flex-col rounded-xl border border-gray-200 bg-gray-50 p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900">
                {audience.title}
              </h3>
              <p className="mt-3 flex-1 text-sm text-gray-600">
                {audience.description}
              </p>
              <p className="mt-4 text-base font-semibold text-violet-700">
                {audience.price}
              </p>
              {audience.annualNote && (
                <p className="mt-0.5 text-xs font-medium text-violet-500">
                  {audience.annualNote}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
