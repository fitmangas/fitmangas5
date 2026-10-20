import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ send: vi.fn(), batchSend: vi.fn() }));

vi.mock('resend', () => ({
  Resend: vi.fn(() => ({ emails: { send: mocks.send }, batch: { send: mocks.batchSend } })),
}));

import { applySafeMode, resolveEmailSafeMode, sendEmail, sendEmailBatch } from './send';

describe('resolveEmailSafeMode', () => {
  it('production : envoi réel', () => {
    expect(resolveEmailSafeMode({ VERCEL_ENV: 'production' })).toEqual({ mode: 'send' });
  });
  it('production + EMAIL_SAFE_MODE actif : envoi réel (la garde ne vaut que hors prod)', () => {
    expect(resolveEmailSafeMode({ VERCEL_ENV: 'production', EMAIL_SAFE_MODE: 'on' })).toEqual({ mode: 'send' });
  });
  it('preview sans réglage : redirection vers ADMIN_ALERT_EMAIL', () => {
    expect(resolveEmailSafeMode({ VERCEL_ENV: 'preview', ADMIN_ALERT_EMAIL: 'kevin@x.fr' })).toEqual({
      mode: 'redirect',
      to: 'kevin@x.fr',
    });
  });
  it('local sans ADMIN_ALERT_EMAIL : journalisation seule', () => {
    expect(resolveEmailSafeMode({})).toEqual({ mode: 'log' });
  });
  it('EMAIL_SAFE_MODE=off hors prod : envoi réel (choix explicite)', () => {
    expect(resolveEmailSafeMode({ EMAIL_SAFE_MODE: 'OFF' })).toEqual({ mode: 'send' });
  });
});

describe('applySafeMode', () => {
  it('redirige et préfixe le sujet avec le destinataire d’origine', () => {
    const out = applySafeMode({ to: 'cliente@ex.com', subject: 'Rappel', html: '<p/>' }, { mode: 'redirect', to: 'a@b.c' });
    expect(out?.to).toBe('a@b.c');
    expect(out?.subject).toBe('[SAFE → cliente@ex.com] Rappel');
  });
});

describe('sendEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RESEND_API_KEY = 'k';
    process.env.NEWSLETTER_FROM_EMAIL = 'from@fitmangas.com';
    delete process.env.VERCEL_ENV;
    delete process.env.EMAIL_SAFE_MODE;
    delete process.env.ADMIN_ALERT_EMAIL;
    mocks.send.mockResolvedValue({ data: { id: 'e1' }, error: null });
    mocks.batchSend.mockResolvedValue({ data: { data: [{ id: 'b1' }] }, error: null });
  });

  it('hors prod sans adresse d’alerte : Resend jamais appelé', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const res = await sendEmail({ to: 'cliente@ex.com', subject: 'S', html: '<p/>' });
    expect(res).toEqual({ ok: true, id: null, safeMode: 'log' });
    expect(mocks.send).not.toHaveBeenCalled();
    info.mockRestore();
  });

  it('hors prod avec ADMIN_ALERT_EMAIL : la cliente ne reçoit rien, Kevin reçoit la copie', async () => {
    process.env.ADMIN_ALERT_EMAIL = 'kevin@fitmangas.com';
    await sendEmail({ to: 'cliente@ex.com', subject: 'S', html: '<p/>' });
    expect(mocks.send).toHaveBeenCalledTimes(1);
    const arg = mocks.send.mock.calls[0][0];
    expect(arg.to).toEqual(['kevin@fitmangas.com']);
    expect(JSON.stringify(arg)).not.toContain('"to":["cliente@ex.com"]');
  });

  it('batch hors prod : chaque email redirigé', async () => {
    process.env.ADMIN_ALERT_EMAIL = 'kevin@fitmangas.com';
    await sendEmailBatch([{ to: 'a@ex.com', subject: 'S', html: '<p/>' }]);
    const payload = mocks.batchSend.mock.calls[0][0];
    expect(payload[0].to).toEqual(['kevin@fitmangas.com']);
  });

  it('production : envoi au vrai destinataire', async () => {
    process.env.VERCEL_ENV = 'production';
    await sendEmail({ to: 'cliente@ex.com', subject: 'S', html: '<p/>' });
    expect(mocks.send.mock.calls[0][0].to).toEqual(['cliente@ex.com']);
  });
});
