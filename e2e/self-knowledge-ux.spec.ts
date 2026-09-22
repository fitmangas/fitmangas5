import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const CAPTURE_DIR = path.join(root, '_captures', 'tests-ux');

test.setTimeout(600_000);

function ensureDir() {
  fs.mkdirSync(CAPTURE_DIR, { recursive: true });
}

async function shot(page: Page, name: string) {
  ensureDir();
  const file = path.join(CAPTURE_DIR, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
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

async function answerCurrentBatch(page: Page) {
  await page.evaluate(() => {
    document.querySelectorAll('[data-testid^="question-"]').forEach((field) => {
      const buttons = Array.from(
        field.querySelectorAll('button[data-testid^="answer-"]'),
      ) as HTMLButtonElement[];
      if (!buttons.length) return;
      const mid = buttons[Math.floor((buttons.length - 1) / 2)];
      mid?.click();
    });
  });
}

async function startQuestions(page: Page) {
  await page.getByTestId('intro-start').click({ force: true });
  await expect(page.getByTestId('self-test-questions')).toBeVisible({ timeout: 15_000 });
}

async function completeQuestionnaire(page: Page) {
  for (let guard = 0; guard < 50; guard++) {
    if (await page.getByTestId('self-test-lead').isVisible().catch(() => false)) return;
    if (await page.getByTestId('self-test-report').isVisible().catch(() => false)) return;
    await expect(page.getByTestId('self-test-questions')).toBeVisible();
    await answerCurrentBatch(page);
    await page.getByTestId('questions-next').click({ force: true });
    await page.waitForTimeout(60);
  }
  throw new Error('Questionnaire : trop de batches sans atteindre lead/rapport');
}

async function fillLead(page: Page) {
  await expect(page.getByTestId('self-test-lead')).toBeVisible();
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

  test('hub + choix + intros + 3 parcours + rapports full', async ({ page }) => {
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
    await expect(page.getByTestId('hub-video-proof')).toBeVisible();
    await shot(page, '01-hub-hero-carousel');

    await page.getByTestId('grid-cta-big-five').click({ force: true });
    await expect(page.getByTestId('self-test-choose')).toBeVisible();
    await shot(page, '02-big-five-choix');

    await page.getByTestId('choose-ipip-50').click({ force: true });
    await expect(page.getByTestId('self-test-intro')).toBeVisible();
    await shot(page, '03-intro-ipip-50');

    await startQuestions(page);
    await completeQuestionnaire(page);
    await fillLead(page);
    await shot(page, '04-rapport-teaser-ipip-50');

    await page.goto('/quiz/big-five');
    await dismissCookies(page);
    await page.getByTestId('choose-ipip-120').click({ force: true });
    await expect(page.getByTestId('self-test-intro')).toBeVisible();
    await shot(page, '05-intro-ipip-120');
    await startQuestions(page);
    await completeQuestionnaire(page);
    await fillLead(page);
    await shot(page, '06-rapport-teaser-ipip-120');

    await page.goto('/quiz/attachement');
    await dismissCookies(page);
    await expect(page.getByTestId('self-test-intro')).toBeVisible();
    await shot(page, '07-intro-attachement');
    await startQuestions(page);
    await completeQuestionnaire(page);
    await fillLead(page);
    await shot(page, '08-rapport-teaser-attachement');

    await page.goto('/quiz/ux-capture?slug=big-five&format=ipip-50&full=1');
    await dismissCookies(page);
    await expect(page.getByTestId('self-test-report')).toHaveAttribute('data-show-full', 'true');
    await shot(page, '09-rapport-full-ipip-50');

    await page.goto('/quiz/ux-capture?slug=big-five&format=ipip-120&full=1');
    await dismissCookies(page);
    await expect(page.getByTestId('self-test-report')).toHaveAttribute('data-show-full', 'true');
    const facet = page.locator('details').first();
    if (await facet.count()) {
      await facet.click({ force: true });
    }
    await shot(page, '10-rapport-full-ipip-120-facettes');

    await page.goto('/quiz/ux-capture?slug=attachement&full=1');
    await dismissCookies(page);
    await expect(page.getByTestId('self-test-report')).toHaveAttribute('data-show-full', 'true');
    await shot(page, '11-rapport-full-attachement');

    // Profil équilibré + rapport sans répétition (full 50)
    await page.goto('/quiz/ux-capture?slug=big-five&format=ipip-50&full=1&balanced=1');
    await dismissCookies(page);
    await expect(page.getByTestId('self-test-report')).toBeVisible();
    await expect(page.getByText(/Polyvalente/i)).toBeVisible();
    await shot(page, '12-rapport-full-profil-equilibre');

    await page.goto('/quiz/ux-capture?slug=big-five&format=ipip-50&full=1');
    await dismissCookies(page);
    await shot(page, '13-rapport-full-sans-repetition');

    const files = fs
      .readdirSync(CAPTURE_DIR)
      .filter((f) => f.endsWith('.png'))
      .sort()
      .map((f) => path.join('_captures/tests-ux', f));
    fs.writeFileSync(path.join(CAPTURE_DIR, 'MANIFEST.txt'), files.join('\n') + '\n', 'utf8');
    expect(files.length).toBeGreaterThanOrEqual(13);
  });
});
