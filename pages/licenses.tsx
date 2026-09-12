import Head from "next/head";
import Footer from "@/components/Footer";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/lib/i18n";

const SYMPY_LICENSE = `Copyright (c) 2006-2023 SymPy Development Team

All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

  a. Redistributions of source code must retain the above copyright notice,
     this list of conditions and the following disclaimer.
  b. Redistributions in binary form must reproduce the above copyright
     notice, this list of conditions and the following disclaimer in the
     documentation and/or other materials provided with the distribution.
  c. Neither the name of SymPy nor the names of its contributors
     may be used to endorse or promote products derived from this software
     without specific prior written permission.


THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE REGENTS OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY
OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH
DAMAGE.`;

const PYTHON_DEPS: Array<[string, string]> = [
  ["sympy", "BSD"],
  ["antlr4-python3-runtime", "BSD"],
  ["fastapi", "MIT"],
  ["starlette", "BSD"],
  ["uvicorn", "BSD-3-Clause"],
  ["sqlalchemy", "MIT"],
  ["pydantic", "MIT"],
  ["python-dotenv", "BSD-3-Clause"],
  ["pyjwt", "MIT"],
  ["email-validator", "Unlicense"],
  ["bcrypt", "Apache-2.0"],
  ["psycopg2-binary", "LGPL-3.0-with-exceptions"],
  ["resend", "MIT"],
];

const NPM_DEPS: Array<[string, string]> = [
  ["next", "MIT"],
  ["react", "MIT"],
  ["react-dom", "MIT"],
  ["typescript", "Apache-2.0"],
  ["tailwindcss", "MIT"],
  ["eslint", "MIT"],
  ["eslint-config-next", "MIT"],
];

function DepTable({
  deps,
  packageLabel,
  licenseLabel,
}: {
  deps: Array<[string, string]>;
  packageLabel: string;
  licenseLabel: string;
}) {
  return (
    <table className="mt-4 w-full border-collapse text-left text-sm">
      <thead>
        <tr className="border-b border-rule text-ink-faint">
          <th className="py-2 pr-4 font-medium">{packageLabel}</th>
          <th className="py-2 font-medium">{licenseLabel}</th>
        </tr>
      </thead>
      <tbody>
        {deps.map(([name, license]) => (
          <tr key={name} className="border-b border-rule">
            <td className="py-2 pr-4 font-mono text-xs text-ink">
              {name}
            </td>
            <td className="py-2 text-ink-soft">{license}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function Licenses() {
  const { t } = useLanguage();

  return (
    <>
      <Head>
        <title>{t.licenses.metaTitle}</title>
        <meta name="description" content={t.licenses.metaDescription} />
      </Head>

      <div className="fixed right-4 top-4 z-50">
        <LanguageSwitcher />
      </div>

      <main className="mx-auto max-w-3xl px-6 py-24">
        <h1 className="text-3xl font-display font-semibold text-ink">
          {t.licenses.heading}
        </h1>
        <p className="mt-6 text-base leading-relaxed text-ink-soft">
          {t.licenses.intro}
        </p>

        <h2 className="mt-12 text-xl font-display font-semibold text-ink">
          {t.licenses.howWeUseHeading}
        </h2>
        <p className="mt-4 text-base leading-relaxed text-ink-soft">
          {t.licenses.howWeUseBody}
        </p>

        <h2 className="mt-12 text-xl font-display font-semibold text-ink">
          {t.licenses.sympyHeading}
        </h2>
        <pre className="mt-4 overflow-x-auto whitespace-pre-wrap rounded-lg bg-paper p-5 font-mono text-xs leading-relaxed text-ink-soft">
          {SYMPY_LICENSE}
        </pre>

        <h2 className="mt-12 text-xl font-display font-semibold text-ink">
          {t.licenses.dependenciesHeading}
        </h2>

        <h3 className="mt-6 font-mono text-sm font-semibold uppercase tracking-wide text-ink-faint">
          {t.licenses.pythonHeading}
        </h3>
        <DepTable
          deps={PYTHON_DEPS}
          packageLabel={t.licenses.packageColumn}
          licenseLabel={t.licenses.licenseColumn}
        />

        <h3 className="mt-10 font-mono text-sm font-semibold uppercase tracking-wide text-ink-faint">
          {t.licenses.npmHeading}
        </h3>
        <DepTable
          deps={NPM_DEPS}
          packageLabel={t.licenses.packageColumn}
          licenseLabel={t.licenses.licenseColumn}
        />

        <h2 className="mt-12 text-xl font-display font-semibold text-ink">
          {t.licenses.ownCodeHeading}
        </h2>
        <p className="mt-4 text-base leading-relaxed text-ink-soft">
          {t.licenses.ownCodeBody}
        </p>
      </main>

      <Footer />
    </>
  );
}
