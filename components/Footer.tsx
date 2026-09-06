export default function Footer() {
  return (
    <footer className="bg-white">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-6 py-10 text-sm text-gray-500 sm:flex-row sm:justify-between">
        <p>Calcile © 2026 — contact@calcile.fr</p>
        <div className="flex gap-6">
          {/* Placeholders : à remplacer par les vrais comptes une fois créés */}
          <a href="#" className="hover:text-gray-700">
            Twitter
          </a>
          <a href="#" className="hover:text-gray-700">
            Reddit
          </a>
        </div>
      </div>
    </footer>
  );
}
