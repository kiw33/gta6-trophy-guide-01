// Leonida Trophy Guide — entrypoint for make.fun's gta6-trophy-guide-01 bounty.
// Node 22, standard library only. The guide itself is the static app/ folder
// next to this file: plain HTML, CSS and JavaScript plus data/trophies.json,
// no build step and no network at runtime. This program hands it in: it
// copies app/ and screenshots/ into the output directory and writes
// dossier.json there with the kit's vendored buildDossier, byte for byte the
// summary the scorer reads. Run it locally with:
//   MAKEFUN_OUTPUT_DIR=/tmp/leonida-out node main.ts
// The vendor library is kit code and is left exactly as shipped.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The scorer's own caps for this bounty (reference/gate.json): the text cap
// shapes the dossier's bytes, and the rest refuse an entry the scorer would
// refuse — more than 4 screenshots or one over 256 KiB, more than 993 files
// and directories in app/ or 48 MiB of app files, and paths over 1000 bytes.
const dossier = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(out, 'dossier.json'), dossier);
console.log(`Leonida Trophy Guide handed in to ${out}`);
