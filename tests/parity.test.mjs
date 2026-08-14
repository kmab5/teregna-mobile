/**
 * Cross-platform parity checks.
 *
 * The mobile app shares its contract layer with teregna-web by copying files
 * rather than importing a package, which is simple but silently allows drift.
 * These assert the things that must not diverge.
 *
 * Run: node --experimental-strip-types tests/parity.test.mjs
 */
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { __cldrFallback } from "../src/i18n/plural.ts";

const SRC = new URL("../src", import.meta.url).pathname;

let pass = 0;
function check(name, fn) {
  try {
    fn();
    pass++;
    console.log(`  ok    ${name}`);
  } catch (e) {
    console.error(`  FAIL  ${name}\n        ${e.message}`);
    process.exitCode = 1;
  }
}

function walk(dir) {
  return readdirSync(dir).flatMap((e) => {
    const full = join(dir, e);
    return statSync(full).isDirectory() ? walk(full) : /\.tsx?$/.test(full) ? [full] : [];
  });
}
const files = walk(SRC).map((f) => ({ path: f, src: readFileSync(f, "utf8") }));

const en = readFileSync(join(SRC, "i18n/messages/en.ts"), "utf8");
const am = readFileSync(join(SRC, "i18n/messages/am.ts"), "utf8");
const keys = (s) => (s.match(/^  "([^"]+)":/gm) ?? []).map((k) => k.slice(3, -2));

check("both catalogues carry the same keys", () => {
  const e = keys(en), a = keys(am);
  assert.deepEqual(e.filter((k) => !a.includes(k)), [], "missing in am");
  assert.deepEqual(a.filter((k) => !e.includes(k)), [], "extra in am");
});

check("catalogue is non-trivial", () => {
  assert.ok(keys(en).length > 250, `only ${keys(en).length} keys`);
});

check("no web-only APIs leaked into the port", () => {
  const banned = ["next/", "window.", "document.", "localStorage", '"use client"'];
  const bad = [];
  for (const { path, src } of files) {
    // Strip comments: several files legitimately mention these while explaining
    // why they avoid them.
    const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
    for (const b of banned) if (code.includes(b)) bad.push(`${path.replace(SRC, "")} (${b})`);
  }
  assert.deepEqual(bad, [], `web APIs present: ${bad.join(", ")}`);
});

check("every request mutation goes through rpc.ts", () => {
  const bad = files
    .filter(({ path }) => !path.endsWith("lib/rpc.ts"))
    .filter(({ src }) => /\.from\(["']requests["']\)\s*\.\s*(insert|update|delete)/.test(src))
    .map(({ path }) => path.replace(SRC, ""));
  assert.deepEqual(bad, [], `direct writes to requests: ${bad.join(", ")}`);
});

check("the anon key is the only Supabase key referenced", () => {
  const bad = files
    .filter(({ src }) => /SERVICE_ROLE|service_role/.test(src))
    .map(({ path }) => path.replace(SRC, ""));
  assert.deepEqual(bad, [], `service-role reference: ${bad.join(", ")}`);
});

/* ------------------------------------------------------- Hermes safety --- */
/*
 * These two exist because both bugs they cover shipped: the bundle built, types
 * passed, lint passed, and the app crashed on the first screen. Neither is
 * detectable without either running on a device or asserting the rule directly.
 */


check("plural fallback matches CLDR exactly (en and am)", () => {
  const cases = [];
  for (let n = 0; n <= 1000; n++) cases.push(n);
  cases.push(0.5, 1.0, 1.5, 2.5, 0.1, 99.9, -1, -5, -1.5);

  const bad = [];
  for (const loc of ["en", "am"]) {
    const ref = new Intl.PluralRules(loc);
    for (const n of cases) {
      const expected = ref.select(n);
      const got = __cldrFallback(loc, n);
      if (expected !== got) bad.push(`${loc} n=${n}: ICU=${expected} got=${got}`);
    }
  }
  assert.deepEqual(bad.slice(0, 5), [], `${bad.length} mismatches`);
});

check("zero is singular in Amharic and plural in English", () => {
  // The specific difference that makes a `count === 1` check wrong. Stated
  // separately from the sweep above so a regression names the actual rule.
  assert.equal(__cldrFallback("am", 0), "one");
  assert.equal(__cldrFallback("en", 0), "other");
});

check("Intl.PluralRules is never constructed unguarded", () => {
  const bad = files
    .filter(({ path }) => !path.endsWith("i18n/plural.ts"))
    .filter(({ src }) => /new\s+Intl\.PluralRules/.test(src.replace(/\/\/.*$/gm, "")))
    .map(({ path }) => path.replace(SRC, ""));
  assert.deepEqual(bad, [], `Hermes has no Intl.PluralRules: ${bad.join(", ")}`);
});

check("every Stack.Screen name matches a real route file", () => {
  const layout = readFileSync(join(SRC, "app/_layout.tsx"), "utf8");
  const declared = [...layout.matchAll(/<Stack\.Screen\s+name="([^"]+)"/g)].map((m) => m[1]);

  const routes = new Set();
  for (const f of walk(join(SRC, "app"))) {
    const rel = f.replace(join(SRC, "app") + "/", "").replace(/\.tsx?$/, "");
    if (rel.endsWith("_layout")) {
      const dir = rel.replace(/\/?_layout$/, "");
      if (dir) routes.add(dir);
      continue;
    }
    routes.add(rel);
    // A directory with routes inside is itself addressable as a group.
    const parts = rel.split("/");
    if (parts.length > 1) routes.add(parts[0]);
  }

  const missing = declared.filter((d) => !routes.has(d));
  assert.deepEqual(
    missing,
    [],
    `declared but no such route: ${missing.join(", ")} (have: ${[...routes].join(", ")})`,
  );
});

check("screen-level gutters are at least 20px", () => {
  // px-4 (16px) put content close enough to the edge to feel cramped, and on
  // curved-screen phones genuinely awkward to tap.
  //
  // Scans every quoted string rather than the className attribute, because the
  // classes are usually wrapped in cn(...) and an attribute-shaped regex misses
  // exactly the shared Screen component that matters most. Card and button
  // padding use a different rhythm and never carry flex-1.
  const scanned = files.filter(
    ({ path }) => path.includes("/app/") || path.endsWith("ui/screen.tsx"),
  );
  const bad = [];
  for (const { path, src } of scanned) {
    for (const m of src.matchAll(/"([^"\n]*)"/g)) {
      const cls = m[1];
      if (/\bflex-1\b/.test(cls) && /\bpx-[0-4]\b/.test(cls)) {
        bad.push(`${path.replace(SRC, "")}: "${cls}"`);
      }
    }
  }
  assert.deepEqual(bad, [], `tight screen gutter: ${bad.join(" | ")}`);
});console.log(`\n  ${pass} parity checks passed`);
