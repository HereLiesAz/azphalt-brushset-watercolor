// Pack every brushes/<slug>/ subfolder into its own .azp — this repo ships several brush
// packages, one per subfolder, rather than one package at the repo root.
import fs from "node:fs";
import path from "node:path";
import { writeAzp } from "@azphalt/azp";

for (const slug of fs.readdirSync("brushes")) {
  const dir = path.join("brushes", slug);
  const manifestPath = path.join(dir, "manifest.json");
  if (!fs.existsSync(manifestPath)) continue;

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  const payload = {};
  const assetsDir = path.join(dir, "assets");
  if (fs.existsSync(assetsDir)) {
    for (const rel of walk(assetsDir)) payload[path.posix.relative(dir, rel)] = fs.readFileSync(rel);
  }
  const license = fs.readFileSync(path.join(dir, "LICENSE"), "utf-8");

  const { azp } = writeAzp({ manifest, payload, license });
  const out = `${slug}-${manifest.version}.azp`;
  fs.writeFileSync(out, azp);
  console.log(`Built ${out} (${azp.length} bytes)`);
}

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = path.posix.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(rel));
    else if (e.isFile()) out.push(rel);
  }
  return out;
}
