#!/usr/bin/env node
// Fail if any installed npm dependency is under a GPL/AGPL (copyleft) license.
//
// LGPL is allowed and reported separately (e.g. @img/sharp-libvips-* is
// LGPL-3.0, pulled in transitively by Next.js's image optimizer as a
// dynamically-linked native binary — it is not statically linked into or
// merged with Calcile's own code, so its copyleft does not extend to our
// source). Plain GPL/AGPL would force our source to be open-sourced too,
// so those are hard failures here.
//
// Usage: node scripts/check-licenses.mjs

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";

const ROOT = path.join(import.meta.dirname, "..", "node_modules");

function walk(dir, pkgs) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.name.startsWith("@")) {
      walk(full, pkgs);
      continue;
    }
    const pkgJsonPath = path.join(full, "package.json");
    if (existsSync(pkgJsonPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgJsonPath, "utf8"));
        const key = `${pkg.name}@${pkg.version}`;
        let license = pkg.license;
        if (!license && pkg.licenses) {
          license = pkg.licenses.map((l) => l.type).join(",");
        }
        pkgs.set(key, license || "UNKNOWN");
      } catch {
        // skip unparsable package.json
      }
    }
    const nested = path.join(full, "node_modules");
    if (existsSync(nested)) walk(nested, pkgs);
  }
}

function main() {
  const pkgs = new Map();
  walk(ROOT, pkgs);

  const gplHits = [];
  const lgplHits = [];
  const unknownHits = [];

  for (const [name, license] of pkgs) {
    if (/LGPL/i.test(license)) {
      lgplHits.push([name, license]);
    } else if (/A?GPL/i.test(license)) {
      gplHits.push([name, license]);
    } else if (license === "UNKNOWN") {
      unknownHits.push(name);
    }
  }

  if (lgplHits.length) {
    console.log(
      "LGPL dependencies (allowed — dynamically linked native binaries, see /pages/licenses.tsx):",
    );
    for (const [name, license] of lgplHits) console.log(`  - ${name}: ${license}`);
    console.log();
  }

  if (unknownHits.length) {
    console.log(`Note: ${unknownHits.length} package(s) with no declared license field.`);
  }

  if (gplHits.length) {
    console.log(
      "❌ GPL/AGPL dependencies found — these force derivative works to be open-sourced and are NOT allowed in Calcile:",
    );
    for (const [name, license] of gplHits) console.log(`  - ${name}: ${license}`);
    process.exit(1);
  }

  console.log(`✅ No GPL/AGPL dependency among ${pkgs.size} installed packages.`);
}

main();
