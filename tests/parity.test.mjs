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

console.log(`\n  ${pass} parity checks passed`);
