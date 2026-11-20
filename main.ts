import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier, type DossierCaps } from './vendor/makefun-frontend.ts';

/* Leonida Trophy Guide — entry hand-in.
   Copies app/ and screenshots/ from this repository into the output
   directory and writes dossier.json there with the kit's buildDossier.
   Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output. */

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';

const caps: DossierCaps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000
};

function copyEntryTree(name: string): void {
  const from = join(repoRoot, name);
  const to = join(outputDir, name);
  cpSync(from, to, { recursive: true });
  console.log('copied ' + name + '/ -> ' + to);
}

rmSync(outputDir, { recursive: true, force: true });
mkdirSync(outputDir, { recursive: true });
copyEntryTree('app');
copyEntryTree('screenshots');

const dossier = buildDossier(outputDir, caps);
const dossierPath = join(outputDir, 'dossier.json');
writeFileSync(dossierPath, dossier);
console.log('wrote ' + dossierPath + ' (' + dossier.length + ' bytes)');
