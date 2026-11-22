/* Verify every bundled image without relying on omitted binary JPG/PNG files.
   Run locally after starting the app: node scripts/verify-assets.mjs */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const base = process.env.BASE ?? "http://localhost:3000";
let failures = 0;
const paths = new Set();
const walk = (dir) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const file = join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (/\.(?:ts|tsx|js|mjs|webmanifest)$/.test(entry.name)) {
      const text = readFileSync(file, "utf8");
      for (const [, asset] of text.matchAll(/['"`](\/(?:images|icons)\/[^'"`\s]+\.svg)['"`]/g)) {
        paths.add(asset);
      }
    }
  }
};
walk(join(root, "src"));
for (const file of ["public/manifest.webmanifest", "public/sw.js"]) {
  const text = readFileSync(join(root, file), "utf8");
  for (const [, asset] of text.matchAll(/['"`](\/(?:images|icons)\/[^'"`\s]+\.svg)['"`]/g)) paths.add(asset);
}

for (const asset of [...paths].sort()) {
  const file = join(root, "public", asset);
  const hasFile = existsSync(file);
  const startsSvg = hasFile && readFileSync(file, "utf8").startsWith("<svg ");
  if (!hasFile || !startsSvg) {
    console.error(`✗ missing/invalid image: ${asset}`);
    failures++;
    continue;
  }
  try {
    const res = await fetch(base + asset);
    const body = await res.text();
    if (res.status !== 200 || !body.startsWith("<svg ")) {
      console.error(`✗ HTTP ${res.status}: ${asset}`);
      failures++;
    }
  } catch (err) {
    console.error(`✗ request failed for ${asset}: ${err.message}`);
    failures++;
  }
}
console.log(`Checked ${paths.size} portable images/icons. ${failures === 0 ? "ALL ASSETS PASS ✅" : `${failures} FAILURES ❌`}`);
process.exit(failures ? 1 : 0);
