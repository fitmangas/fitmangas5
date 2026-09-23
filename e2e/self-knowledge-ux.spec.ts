import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const CAPTURE_DIR = path.join(root, '_captures', 'tests-ux');

test.setTimeout(360_000);

function ensureDir() {
  fs.mkdirSync(CAPTURE_DIR, { recursive: true });
}

async function shot(page: Page, name: string, fullPage = true) {
  ensureDir();
  const file = path.join(CAPTURE_DIR, `${name}.png`);
  await page.screenshot({ path: file, fullPage });
  return file;
}

async function dismissCookies(page: Page) {
  const btn = page.getByRole('button', { name: 'Accepter' });
  if (await btn.isVisible().catch(() => false)) {
    await btn.click({ force: true });
    await expect(
      page.locator('[role="dialog"][aria-labelledby="cookie-consent-title"]'),
    ).toBeHidden({ timeout: 5_000 });
  }
}

/** CTA « Je commence » entièrement dans le viewport (pas besoin de scroll). */
async function expectCtasAboveFold(page: Page) {
  const viewport = page.viewportSize();
  expect(viewport).toBeTruthy();
  for (const slug of ['big-five', 'attachement'] as const) {
    const cta = page.getByTestId(`grid-cta-${slug}`);
    await expect(cta).toBeVisible();
    const box = await cta.boundingBox();
    expect(box, `CTA ${slug} bounding box`).toBeTruthy();
    expect(box!.y + box!.height, `CTA ${slug} bottom`).toBeLessThanOrEqual(viewport!.height - 4);
  }
}

async function completeQuestionnaire(page: Page) {
  for (let guard = 0; guard < 40; guard++) {
    if (await page.getByTestId('self-test-lead').isVisible().catch(() => false)) return;
    if (await page.getByTestId('self-test-report').isVisible().catch(() => false)) return;
    await expect(page.getByTestId('self-test-questions')).toBeVisible();
    const questions = page.locator('[data-testid^="question-"]');
    const n = await questions.count();
    for (let i = 0; i < n; i++) {
      const mid = questions.nth(i).locator('button[data-testid^="answer-"]').nth(2);
      await mid.click({ force: true });
    }
    await page.getByTestId('questions-next').click({ force: true });
    await page.waitForTimeout(200);
  }
  throw new Error('Questionnaire : pas de lead');
}

async function fillLead(page: Page) {
  await expect(page.getByTestId('self-test-lead')).toBeVisible({ timeout: 30_000 });
  await page.getByTestId('lead-firstname').fill('Camille');
  await page.getByTestId('lead-email').fill(`e2e-ux-${Date.now()}@fitmangas.test`);
  await page.getByTestId('lead-consent').check({ force: true });
  await page.getByTestId('lead-submit').click({ force: true });
  await expect(page.getByTestId('self-test-report')).toBeVisible({ timeout: 60_000 });
}

async function mockSubmitWithBank(page: Page) {
  await page.route('**/api/self-knowledge/submit', async (route) => {
    const req = route.request().postDataJSON() as {
      slug: string;
      format?: string;
      locale?: string;
      answers: Record<string, number>;
    };
    const res = await page.request.post('/api/self-knowledge/ux-fixture', {
      data: {
        slug: req.slug,
        format: req.format,
        locale: req.locale ?? 'fr',
        answers: req.answers,
      },
    });
    const body = await res.text();
    await route.fulfill({
      status: res.status(),
      contentType: 'application/json',
      body,
    });
  });
}

async function pdfPrintReport(page: Page, query: string, filename: string) {
  await page.goto(`/quiz/print-report?${query}`, { waitUntil: 'networkidle' });
  await expect(page.getByTestId('self-test-report')).toBeVisible({ timeout: 45_000 });
  await expect(page.getByTestId('self-test-report')).toHaveAttribute('data-show-full', 'true');
  await page.waitForTimeout(500);
  const dest = path.join(CAPTURE_DIR, filename);
  await page.pdf({
    path: dest,
    format: 'A4',
    printBackground: true,
    preferCSSPageSize: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
  });
  expect(fs.statSync(dest).size).toBeGreaterThan(40_000);
  return dest;
}

const FIXTURE_50 = { E: 28, A: 34, C: 44, ES: 18, O: 36 };
const FIXTURE_ATTACH = { anxiety: 5.1, avoidance: 2.4 };

test.describe('Self-knowledge UX — desktop', () => {
  test.beforeAll(() => {
    ensureDir();
  });

  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'desktop only');
  });

  test('hub CTA above fold + questions + PDF', async ({ page }) => {
    await page.addInitScript(() => {
      try {
        localStorage.setItem('fm_cookie_consent', 'accepted');
      } catch {
        /* ignore */
      }
    });
    await mockSubmitWithBank(page);

    await page.goto('/quiz');
    await dismissCookies(page);
    await expect(page.getByTestId('faces-cloud-hero')).toBeVisible();
    await expect(page.getByTestId('self-test-card-grid')).toBeVisible();
    await expect(page.getByTestId('locale-switcher')).toBeVisible();
    await expectCtasAboveFold(page);
    await shot(page, '01-hub-hero-carousel', false);

    await page.getByTestId('grid-cta-big-five').click({ force: true });
    await expect(page.getByTestId('self-test-choose')).toBeVisible();
    await shot(page, '02-big-five-choix');

    await page.getByTestId('choose-ipip-50').click({ force: true });
    await expect(page.getByTestId('self-test-questions')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('[data-testid^="question-"]')).toHaveCount(5);
    await expect(page.getByText('Plutôt inexact').first()).toBeVisible();
    await shot(page, '03-questions-redesign');

    await page.goto('/quiz/ux-capture?slug=big-five&format=ipip-50&full=0');
    await dismissCookies(page);
    await shot(page, '04-rapport-teaser-ipip-50');

    await page.goto('/quiz/big-five');
    await dismissCookies(page);
    await page.getByTestId('choose-ipip-120').click({ force: true });
    await expect(page.getByTestId('self-test-questions')).toBeVisible({ timeout: 15_000 });
    await shot(page, '05-questions-ipip-120');

    await page.goto('/quiz/ux-capture?slug=big-five&format=ipip-120&full=0');
    await dismissCookies(page);
    await shot(page, '06-rapport-teaser-ipip-120');

    await page.goto('/quiz/attachement');
    await dismissCookies(page);
    await shot(page, '07-intro-attachement');
    await page.getByTestId('intro-start').click({ force: true });
    await expect(page.getByText(/Pas du tout d.accord/).first()).toBeVisible();
    await completeQuestionnaire(page);
    await fillLead(page);
    await shot(page, '08-rapport-teaser-attachement');

    await page.goto('/quiz/ux-capture?slug=big-five&format=ipip-50&full=1');
    await dismissCookies(page);
    await expect(page.getByText('Stabilité').first()).toBeVisible();
    await shot(page, '09-rapport-full-ipip-50');

    await page.goto('/quiz/ux-capture?slug=big-five&format=ipip-120&full=1');
    await dismissCookies(page);
    await expect(page.getByTestId('facets-accordion')).toBeVisible();
    await shot(page, '10-rapport-full-ipip-120-facettes');

    await page.goto('/quiz/ux-capture?slug=attachement&full=1');
    await dismissCookies(page);
    await expect(page.getByTestId('self-test-report')).toBeVisible();
    await shot(page, '11-rapport-full-attachement');

    await page.goto('/quiz/ux-capture?slug=big-five&format=ipip-50&full=1&balanced=1');
    await dismissCookies(page);
    await expect(page.getByText(/Polyvalente/i)).toBeVisible();
    await shot(page, '12-rapport-full-profil-equilibre');

    await page.goto('/quiz/ux-capture?slug=big-five&format=ipip-50&full=1');
    await dismissCookies(page);
    await expect(page.getByTestId('download-pdf')).toBeVisible();
    await shot(page, '13-rapport-full-pdf-parrainage');

    await pdfPrintReport(
      page,
      `slug=big-five&format=ipip-50&scores=${encodeURIComponent(JSON.stringify(FIXTURE_50))}`,
      'rapport-ipip50.pdf',
    );
    await pdfPrintReport(page, 'slug=big-five&format=ipip-120', 'rapport-ipip120.pdf');
    await pdfPrintReport(
      page,
      `slug=attachement&scores=${encodeURIComponent(JSON.stringify(FIXTURE_ATTACH))}`,
      'rapport-attachement.pdf',
    );

    const apiRes = await page.request.post('/api/self-knowledge/pdf', {
      data: {
        slug: 'big-five',
        format: 'ipip-50',
        locale: 'fr',
        scores: FIXTURE_50,
      },
      timeout: 120_000,
    });
    expect(apiRes.ok(), await apiRes.text()).toBeTruthy();
    const apiBuf = Buffer.from(await apiRes.body());
    fs.writeFileSync(path.join(CAPTURE_DIR, 'rapport-client-api-ipip50.pdf'), apiBuf);

    await page.goto(
      `/quiz/print-report?slug=big-five&format=ipip-50&scores=${encodeURIComponent(JSON.stringify(FIXTURE_50))}`,
    );
    await shot(page, '14-pdf-print-report-preview', true);

    const files = fs
      .readdirSync(CAPTURE_DIR)
      .filter((f) => f.endsWith('.png') || f.endsWith('.pdf'))
      .sort()
      .map((f) => path.join('_captures/tests-ux', f));
    fs.writeFileSync(path.join(CAPTURE_DIR, 'MANIFEST.txt'), files.join('\n') + '\n', 'utf8');
    expect(files.filter((f) => f.endsWith('.png')).length).toBeGreaterThanOrEqual(14);
  });
});

test.describe('Hub membre — captures DA', () => {
  test.beforeAll(() => {
    ensureDir();
  });

  test('5 sections empty + filled desktop', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'desktop only');
    await page.addInitScript(() => {
      try {
        localStorage.setItem('fm_cookie_consent', 'accepted');
      } catch {
        /* ignore */
      }
    });

    const memberSections = [
      'evolution',
      'progression',
      'tests',
      'corps',
      'developpement',
    ] as const;
    let n = 21;
    for (const section of memberSections) {
      await page.goto(`/quiz/hub-membre-capture?section=${section}`, { waitUntil: 'domcontentloaded' });
      await dismissCookies(page);
      await expect(page.getByTestId('hub-ux-capture')).toBeVisible({ timeout: 30_000 });
      await expect(page.getByTestId('hub-ux-capture')).toHaveAttribute('data-section', section);
      await page.waitForTimeout(700);
      await shot(page, `${String(n).padStart(2, '0')}-membre-${section}-empty`);
      n += 1;
      await page.goto(`/quiz/hub-membre-capture?section=${section}&filled=1`, {
        waitUntil: 'domcontentloaded',
      });
      await expect(page.getByTestId('hub-ux-capture')).toHaveAttribute('data-filled', '1');
      if (section === 'developpement') {
        await expect(page.getByTestId('affiliate-disclosure').first()).toBeVisible();
        await expect(page.getByTestId('reading-section-books')).toBeVisible();
        await expect(page.getByTestId('reading-section-gear')).toBeVisible();
        await expect(page.getByTestId('reading-book-card').first()).toBeVisible();
        await expect(page.getByTestId('reading-gear-card').first()).toBeVisible();
      }
      if (section === 'evolution' && page.url().includes('filled=1')) {
        await expect(page.getByTestId('evolution-scene')).toBeVisible();
        await expect(page.getByTestId('evolution-hero-number')).toBeVisible();
        await expect(page.getByTestId('evolution-pastilles')).toBeVisible();
        await expect(page.getByTestId('evolution-delta')).toBeVisible();
        await expect(page.getByTestId('fluid-evolution-curve')).toBeVisible();
        await expect(page.getByTestId('advance-test-preview')).toBeVisible();
        await expect(page.getByTestId('advance-health-preview')).toBeVisible();
      }
      if (section === 'tests' && page.url().includes('filled=1')) {
        await expect(page.getByTestId('tests-history-list')).toBeVisible();
        await expect(page.getByTestId('test-history-card').first()).toBeVisible();
        await expect(page.getByTestId('mini-ocean-radar').first()).toBeVisible();
        await expect(page.getByTestId('test-compare')).toBeVisible();
      }
      await page.waitForTimeout(700);
      await shot(page, `${String(n).padStart(2, '0')}-membre-${section}-filled`);
      n += 1;
    }

    const files = fs
      .readdirSync(CAPTURE_DIR)
      .filter((f) => f.endsWith('.png') || f.endsWith('.pdf'))
      .sort()
      .map((f) => path.join('_captures/tests-ux', f));
    fs.writeFileSync(path.join(CAPTURE_DIR, 'MANIFEST.txt'), files.join('\n') + '\n', 'utf8');
    expect(files.some((f) => f.includes('21-membre-evolution-empty'))).toBeTruthy();
    expect(files.some((f) => f.includes('30-membre-developpement-filled'))).toBeTruthy();
  });

  test('5 sections empty + filled mobile', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'mobile only');
    await page.addInitScript(() => {
      try {
        localStorage.setItem('fm_cookie_consent', 'accepted');
      } catch {
        /* ignore */
      }
    });

    for (const section of ['evolution', 'progression', 'tests', 'corps', 'developpement'] as const) {
      await page.goto(`/quiz/hub-membre-capture?section=${section}`, { waitUntil: 'domcontentloaded' });
      await expect(page.getByTestId('hub-ux-capture')).toBeVisible({ timeout: 30_000 });
      await page.waitForTimeout(300);
      await shot(page, `m-${section}-empty`, true);
      await page.goto(`/quiz/hub-membre-capture?section=${section}&filled=1`, {
        waitUntil: 'domcontentloaded',
      });
      await page.waitForTimeout(300);
      await shot(page, `m-${section}-filled`, true);
    }

    const files = fs
      .readdirSync(CAPTURE_DIR)
      .filter((f) => f.endsWith('.png') || f.endsWith('.pdf'))
      .sort()
      .map((f) => path.join('_captures/tests-ux', f));
    fs.writeFileSync(path.join(CAPTURE_DIR, 'MANIFEST.txt'), files.join('\n') + '\n', 'utf8');
  });
});

test.describe('Self-knowledge UX — mobile', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'mobile only');
  });

  test('hub + questions 2/écran + rapport lisible', async ({ page }) => {
    await page.addInitScript(() => {
      try {
        localStorage.setItem('fm_cookie_consent', 'accepted');
      } catch {
        /* ignore */
      }
    });
    await mockSubmitWithBank(page);

    await page.goto('/quiz');
    await dismissCookies(page);
    await expect(page.getByTestId('self-test-card-grid')).toBeVisible();
    // Mobile : cartes empilées — au moins le 1er CTA visible
    const firstCta = page.getByTestId('grid-cta-big-five');
    await expect(firstCta).toBeVisible();
    const box = await firstCta.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.y).toBeLessThan(page.viewportSize()!.height);
    await shot(page, '15-hub-mobile', false);

    await firstCta.click({ force: true });
    await page.getByTestId('choose-ipip-50').click({ force: true });
    await expect(page.getByTestId('self-test-questions')).toBeVisible({ timeout: 15_000 });
    // Mobile = 2 questions / écran
    await expect(page.locator('[data-testid^="question-"]')).toHaveCount(2);
    await shot(page, '16-questions-mobile', false);

    await page.goto('/quiz/ux-capture?slug=big-five&format=ipip-50&full=1');
    await dismissCookies(page);
    await expect(page.getByTestId('self-test-report')).toBeVisible();
    await expect(page.getByText('Stabilité').first()).toBeVisible();
    await shot(page, '17-rapport-mobile', true);

    await page.goto('/quiz/attachement');
    await dismissCookies(page);
    await page.getByTestId('intro-start').click({ force: true });
    await expect(page.getByTestId('self-test-questions')).toBeVisible();
    // ECR-S : 7 boutons toujours accessibles
    const firstQ = page.locator('[data-testid^="question-"]').first();
    await expect(firstQ.locator('button[data-testid^="answer-"]')).toHaveCount(7);
    await shot(page, '18-questions-attachement-mobile', false);

    const files = fs
      .readdirSync(CAPTURE_DIR)
      .filter((f) => f.endsWith('.png') || f.endsWith('.pdf'))
      .sort()
      .map((f) => path.join('_captures/tests-ux', f));
    fs.writeFileSync(path.join(CAPTURE_DIR, 'MANIFEST.txt'), files.join('\n') + '\n', 'utf8');
  });
});
