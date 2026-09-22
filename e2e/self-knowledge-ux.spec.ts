import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const CAPTURE_DIR = path.join(root, '_captures', 'tests-ux');

test.setTimeout(300_000);

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

/** Répond à tout l’écran courant (jusqu’à 5 Q) + Suivant jusqu’au lead. */
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

test.describe('Self-knowledge UX — parcours + captures', () => {
  test.beforeAll(() => {
    ensureDir();
  });

  test('hub + profondeur + questions 5/écran + rapports', async ({ page }) => {
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
    await expect(page.getByTestId('hub-credibility-stats')).toBeVisible();
    await expect(page.getByTestId('hub-proof-avatars')).toBeVisible();
    await shot(page, '01-hub-hero-carousel', false);
    const carouselBox = await page.getByTestId('hub-video-proof').boundingBox();
    expect(carouselBox).toBeTruthy();
    expect(carouselBox!.y).toBeGreaterThan(700);

    await page.getByTestId('grid-cta-big-five').click({ force: true });
    await expect(page.getByTestId('self-test-choose')).toBeVisible();
    await shot(page, '02-big-five-choix');

    await page.getByTestId('choose-ipip-50').click({ force: true });
    await expect(page.getByTestId('self-test-questions')).toBeVisible({ timeout: 15_000 });
    // 5 questions visibles + sous-titres d’échelle
    await expect(page.locator('[data-testid^="question-"]')).toHaveCount(5);
    await expect(page.getByText('Plutôt inexact').first()).toBeVisible();
    await shot(page, '03-questions-redesign');

    await page.goto('/quiz/ux-capture?slug=big-five&format=ipip-50&full=0');
    await dismissCookies(page);
    await expect(page.getByTestId('self-test-report')).toBeVisible();
    await shot(page, '04-rapport-teaser-ipip-50');

    await page.goto('/quiz/big-five');
    await dismissCookies(page);
    await expect(page.getByTestId('self-test-choose')).toBeVisible({ timeout: 20_000 });
    await page.getByTestId('choose-ipip-120').click({ force: true });
    await expect(page.getByTestId('self-test-questions')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('[data-testid^="question-"]')).toHaveCount(5);
    await shot(page, '05-questions-ipip-120');

    await page.goto('/quiz/ux-capture?slug=big-five&format=ipip-120&full=0');
    await dismissCookies(page);
    await shot(page, '06-rapport-teaser-ipip-120');

    await page.goto('/quiz/attachement');
    await dismissCookies(page);
    await expect(page.getByTestId('self-test-intro')).toBeVisible();
    await shot(page, '07-intro-attachement');
    await page.getByTestId('intro-start').click({ force: true });
    await expect(page.getByTestId('self-test-questions')).toBeVisible();
    await expect(page.getByText(/Pas du tout d.accord/).first()).toBeVisible();
    await completeQuestionnaire(page);
    await fillLead(page);
    await shot(page, '08-rapport-teaser-attachement');

    await page.goto('/quiz/ux-capture?slug=big-five&format=ipip-50&full=1');
    await dismissCookies(page);
    await expect(page.getByTestId('self-test-report')).toHaveAttribute('data-show-full', 'true');
    await shot(page, '09-rapport-full-ipip-50');

    await page.goto('/quiz/ux-capture?slug=big-five&format=ipip-120&full=1');
    await dismissCookies(page);
    await expect(page.getByTestId('facets-accordion')).toBeVisible();
    await shot(page, '10-rapport-full-ipip-120-facettes');

    await page.goto('/quiz/ux-capture?slug=attachement&full=1');
    await dismissCookies(page);
    await expect(page.getByTestId('self-test-report')).toHaveAttribute('data-show-full', 'true');
    await expect(page.locator('#forces li').first()).toBeVisible();
    await shot(page, '11-rapport-full-attachement');

    await page.goto('/quiz/ux-capture?slug=big-five&format=ipip-50&full=1&balanced=1');
    await dismissCookies(page);
    await expect(page.getByText(/Polyvalente/i)).toBeVisible();
    await shot(page, '12-rapport-full-profil-equilibre');

    await page.goto('/quiz/ux-capture?slug=big-five&format=ipip-50&full=1');
    await dismissCookies(page);
    await expect(page.getByTestId('download-pdf')).toBeVisible();
    await shot(page, '13-rapport-full-pdf-parrainage');

    // PDF print-to-PDF (page web complète)
    for (const [qs, name] of [
      ['slug=big-five&format=ipip-50&full=1', 'rapport-ipip50.pdf'],
      ['slug=big-five&format=ipip-120&full=1', 'rapport-ipip120.pdf'],
      ['slug=attachement&full=1', 'rapport-attachement.pdf'],
    ] as const) {
      await page.goto(`/quiz/ux-capture?${qs}`);
      await dismissCookies(page);
      await expect(page.getByTestId('self-test-report')).toHaveAttribute('data-show-full', 'true');
      await page.waitForTimeout(400);
      const dest = path.join(CAPTURE_DIR, name);
      await page.pdf({
        path: dest,
        format: 'A4',
        printBackground: true,
        margin: { top: '10mm', bottom: '14mm', left: '12mm', right: '12mm' },
      });
      expect(fs.statSync(dest).size).toBeGreaterThan(20_000);
    }

    const files = fs
      .readdirSync(CAPTURE_DIR)
      .filter((f) => f.endsWith('.png') || f.endsWith('.pdf'))
      .sort()
      .map((f) => path.join('_captures/tests-ux', f));
    fs.writeFileSync(path.join(CAPTURE_DIR, 'MANIFEST.txt'), files.join('\n') + '\n', 'utf8');
    expect(files.filter((f) => f.endsWith('.png')).length).toBeGreaterThanOrEqual(13);
    expect(files.filter((f) => f.endsWith('rapport-ipip50.pdf')).length).toBe(1);
  });
});
