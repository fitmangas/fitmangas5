/**
 * Génère 3 PDF de rapports complets (fixtures) → _captures/tests-ux/
 * Usage : npx tsx scripts/generate-self-test-report-pdfs.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  assembleAttachmentReport,
  assembleBigFiveReport,
} from '../src/lib/self-knowledge/assemble-report';
import { buildSelfTestReportPdf } from '../src/lib/self-knowledge/build-self-test-pdf';
import { IPIP120_FACET_IDS } from '../src/lib/self-knowledge/ipip120';
import { ATTACHMENT_TEST } from '../src/lib/self-knowledge/ecr-short';
import { BIG_FIVE_TEST } from '../src/lib/self-knowledge/ipip50';
import { BIG_FIVE_120_TEST } from '../src/lib/self-knowledge/ipip120';
import type { SelfTestScores } from '../src/lib/self-knowledge/types';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(root, '_captures', 'tests-ux');

function scores50(): SelfTestScores {
  return { E: 28, A: 34, C: 44, ES: 18, O: 36 };
}

function scores120(): SelfTestScores {
  const base = scores50();
  for (const id of IPIP120_FACET_IDS) {
    const n = Number(id.slice(1));
    base[id] = 8 + ((n * 2) % 10);
  }
  return base;
}

function scoresAttach(): SelfTestScores {
  return { anxiety: 5.1, avoidance: 2.4 };
}

async function writePdf(filename: string, blob: Blob) {
  const buf = Buffer.from(await blob.arrayBuffer());
  const dest = path.join(OUT, filename);
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(dest, buf);
  const stat = fs.statSync(dest);
  console.log(`OK ${dest} (${stat.size} bytes)`);
  return { dest, size: stat.size };
}

async function main() {
  const locale = 'fr' as const;

  const a50 = assembleBigFiveReport(scores50(), locale, 'ipip-50');
  const pdf50 = await buildSelfTestReportPdf({
    locale,
    testTitle: BIG_FIVE_TEST.title.fr,
    portraitName: a50.portrait!.name,
    tagline: a50.portrait!.tagline,
    disclaimer: a50.portrait!.disclaimer,
    sections: a50.sections!,
    instrumentVersion: 'ipip-50',
  });
  await writePdf('rapport-ipip50.pdf', pdf50);

  const a120 = assembleBigFiveReport(scores120(), locale, 'ipip-120');
  const pdf120 = await buildSelfTestReportPdf({
    locale,
    testTitle: BIG_FIVE_120_TEST.title.fr,
    portraitName: a120.portrait!.name,
    tagline: a120.portrait!.tagline,
    disclaimer: a120.portrait!.disclaimer,
    sections: a120.sections!,
    instrumentVersion: 'ipip-120',
  });
  await writePdf('rapport-ipip120.pdf', pdf120);

  const aAtt = assembleAttachmentReport(scoresAttach(), locale);
  const pdfAtt = await buildSelfTestReportPdf({
    locale,
    testTitle: ATTACHMENT_TEST.title.fr,
    portraitName: aAtt.portrait!.name,
    tagline: aAtt.portrait!.tagline,
    disclaimer: aAtt.portrait!.disclaimer,
    sections: aAtt.sections!,
    instrumentVersion: 'ecr-s',
  });
  await writePdf('rapport-attachement.pdf', pdfAtt);

  // Garde-fou : forces non vides
  if (!aAtt.sections?.forces?.length) {
    throw new Error('BUG: rapport attachement sans forces');
  }
  console.log('forces attachement:', aAtt.sections.forces.length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
