import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { WEARABLES_V2_ENABLED, appleHealthNote, stravaAdapter, fitbitAdapter } from './wearables';
import { HEALTH_CONSENT_VERSION } from './store';

const ROOT = join(__dirname, '../../..');

function walkTsFiles(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.next' || name === '_archive') continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walkTsFiles(p, acc);
    else if (/\.(ts|tsx)$/.test(name)) acc.push(p);
  }
  return acc;
}

describe('archive legacy isolée', () => {
  it('dossier _archive/quiz-legacy-* existe', () => {
    const archiveRoot = join(ROOT, '_archive');
    const dirs = readdirSync(archiveRoot).filter((d) => d.startsWith('quiz-legacy-'));
    expect(dirs.length).toBeGreaterThanOrEqual(1);
    const sample = join(archiveRoot, dirs[0]!, 'README.md');
    expect(readFileSync(sample, 'utf8').length).toBeGreaterThan(20);
  });

  it('aucun fichier src/ n’importe depuis _archive', () => {
    const files = walkTsFiles(join(ROOT, 'src'));
    const offenders: string[] = [];
    for (const file of files) {
      if (file.includes('archive-and-guards.test')) continue;
      const text = readFileSync(file, 'utf8');
      if (
        /from\s+['"][^'"]*_archive/.test(text) ||
        /import\s+['"][^'"]*_archive/.test(text) ||
        /require\(['"][^'"]*_archive/.test(text)
      ) {
        offenders.push(file.replace(ROOT + '/', ''));
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe('wearables v2 flag OFF', () => {
  it('WEARABLES_V2_ENABLED = false', () => {
    expect(WEARABLES_V2_ENABLED).toBe(false);
  });

  it('Strava/Fitbit refusent la connexion', async () => {
    expect((await stravaAdapter.connect()).ok).toBe(false);
    expect((await fitbitAdapter.connect()).ok).toBe(false);
  });

  it('documente Apple Health = app mobile', () => {
    expect(appleHealthNote.toLowerCase()).toMatch(/healthkit|mobile|application/);
  });
});

describe('RGPD / opt-in distincts (non-régression conceptuelle)', () => {
  it('consent santé a sa propre version string', () => {
    expect(HEALTH_CONSENT_VERSION).toMatch(/^health-/);
  });

  it('newsletter double opt-in reste un module séparé', () => {
    const newsletter = readFileSync(join(ROOT, 'src/lib/blog/newsletter-double-optin.test.ts'), 'utf8');
    expect(newsletter.length).toBeGreaterThan(50);
  });

  it('quiz_leads lead.ts toujours présent (données legacy intactes côté code)', () => {
    const lead = readFileSync(join(ROOT, 'src/lib/quiz/lead.ts'), 'utf8');
    expect(lead).toContain('quiz_leads');
    expect(lead).toContain('acq_contacts');
  });

  it('progression badges non fusionnés (fichier intact)', () => {
    const prog = readFileSync(join(ROOT, 'src/app/compte/progression/page.tsx'), 'utf8');
    expect(prog).not.toContain('self_test_results');
    expect(prog).not.toContain('health_score_entries');
  });
});
