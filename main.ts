// Leonida Trophy Guide — entrypoint (Node 22, standard library only).
// The guide itself is plain static files in app/ (index.html, style.css, app.js
// and data/trophies.json): no build step, nothing fetched over the network.
// This program hands the entry in: it copies app/ and screenshots/ from beside
// this file into /output and writes /output/dossier.json with the vendored
// make.fun library, which is what the judge reads. vendor/makefun-frontend.ts
// is the kit's copy, unchanged — the scorer rebuilds the dossier with its own
// copy and requires the two to match byte for byte.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// Rebuilt 2026-11-20 under a live make.fun recording: the entrypoint now fails
// fast with a plain message when app/index.html or the screenshots are missing,
// instead of handing the scorer an empty or screenshot-less /output.

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Fail fast: a missing index.html or an empty screenshots/ folder would make
// buildDossier fail later with a less obvious message, or hand in a broken entry.
if (!existsSync(join(here, 'app', 'index.html'))) {
  throw new Error('app/index.html is missing — nothing to hand in');
}
const shotsDir = join(here, 'screenshots');
if (!existsSync(shotsDir)) {
  throw new Error('screenshots/ is missing — the entry needs 3 or 4 screenshots');
}
const shots = readdirSync(shotsDir).filter((f) => statSync(join(shotsDir, f)).isFile());
if (shots.length < 3 || shots.length > 4) {
  throw new Error(`screenshots/ holds ${shots.length} files — the entry needs 3 or 4`);
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
cpSync(shotsDir, join(out, 'screenshots'), { recursive: true });

// The scorer's caps: at most 4 screenshots, each at most 256 KiB; app/ at most
// 993 files and directories and 48 MiB in all. The dossier text is capped at
// 160 KiB, so the judge's outline shows the source files' headings and first
// declarations rather than whole bodies.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);
