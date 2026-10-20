import { describe, expect, it } from 'vitest';

import { quoteGiftRefund, giftTotalDays, creditToRemoveCents, remainingCreditCents } from './refund';
import { giftReminderStage, renderGiftReminderEmail } from './reminders';
import { withFreeMonths, type GiftPrice } from './prices';
import { giftPageLang } from './page-lang';
import { guessGiftTimezone, ymdInZone } from './send-at';
import { toAdminGiftRows, giftStats, demoAdminGiftRows } from './admin-data';

const base = { amount_cents: 10900, months: 3, status: 'sent' as const, activated_at: null, created_at: '2026-10-01T10:00:00Z' };

describe('quoteGiftRefund', () => {
  it('carte non activée : remboursement intégral, dans le délai', () => {
    const q = quoteGiftRefund(base, new Date('2026-10-05T10:00:00Z'));
    expect(q).toMatchObject({ amountCents: 10900, full: true, usedDays: 0, late: false });
  });

  it('au-delà de 14 jours : signalé hors délai (geste commercial possible)', () => {
    const q = quoteGiftRefund(base, new Date('2026-10-20T10:00:00Z'));
    expect(q?.late).toBe(true);
    expect(q?.amountCents).toBe(10900);
  });

  it('carte activée : au prorata des jours non utilisés', () => {
    const row = { ...base, status: 'activated' as const, activated_at: '2026-10-02T10:00:00Z' };
    const total = giftTotalDays(row);
    expect(total).toBe(92); // 2 oct. → 2 janv.
    const q = quoteGiftRefund(row, new Date('2026-10-12T10:00:00Z'));
    expect(q?.usedDays).toBe(10);
    expect(q?.amountCents).toBe(Math.floor((10900 * (92 - 10)) / 92));
    expect(q?.full).toBe(false);
  });

  it('carte entièrement utilisée : rien à rembourser', () => {
    const row = { ...base, status: 'activated' as const, activated_at: '2026-06-01T10:00:00Z' };
    expect(quoteGiftRefund(row, new Date('2026-10-12T10:00:00Z'))?.amountCents).toBe(0);
  });

  it('carte remboursée ou offerte par FitMangas : pas de remboursement', () => {
    expect(quoteGiftRefund({ ...base, status: 'refunded' })).toBeNull();
    expect(quoteGiftRefund({ ...base, amount_cents: 0 })).toBeNull();
  });
});

describe('crédit repris au remboursement', () => {
  it('au prorata, jamais plus que le crédit encore disponible', () => {
    // 3 mois = 117 € crédités ; 39 € déjà consommés (solde −78 €) ; remboursement à 89 % des jours restants.
    expect(creditToRemoveCents(-11700, 0.89, -7800)).toBe(7800);
    // Crédit encore intact : prorata.
    expect(creditToRemoveCents(-11700, 0.5, -11700)).toBe(5850);
    // Plus aucun crédit : rien à reprendre (pas de facture surprise).
    expect(creditToRemoveCents(-11700, 0.9, 0)).toBe(0);
    expect(creditToRemoveCents(-11700, 0.9, 1500)).toBe(0);
    expect(remainingCreditCents(-2500)).toBe(2500);
  });
});

describe('giftReminderStage', () => {
  const none = [{ reminder_14_sent_at: null, reminder_3_sent_at: null }];
  it('J-14 puis J-3, une seule fois chacun', () => {
    expect(giftReminderStage(20, none)).toBeNull();
    expect(giftReminderStage(13.5, none)).toBe('14');
    expect(giftReminderStage(13.5, [{ reminder_14_sent_at: 'x', reminder_3_sent_at: null }])).toBeNull();
    expect(giftReminderStage(2.5, [{ reminder_14_sent_at: 'x', reminder_3_sent_at: null }])).toBe('3');
    expect(giftReminderStage(2.5, [{ reminder_14_sent_at: 'x', reminder_3_sent_at: 'y' }])).toBeNull();
    expect(giftReminderStage(-1, none)).toBeNull();
  });

  it('activation tardive : directement J-3', () => {
    expect(giftReminderStage(2, none)).toBe('3');
  });
});

describe('renderGiftReminderEmail', () => {
  const input = {
    stage: '14' as const,
    firstName: 'Julie',
    buyerName: 'Sandrine',
    months: 3,
    extension: false,
    endsLabel: '24 janvier 2027',
    priceLabel: '39 €',
  };

  it('sans moyen de paiement : propose d’en ajouter, rappelle que rien n’est prélevé', () => {
    const { subject, html } = renderGiftReminderEmail({ ...input, lang: 'fr', continuation: 'add_payment' });
    expect(subject).toBe('Tes mois offerts se terminent le 24 janvier 2027');
    expect(html).toContain('ajoute un moyen de paiement');
    expect(html).toContain('sans aucun prélèvement');
    expect(html).toContain('Les 3 mois offerts par Sandrine');
  });

  it('avec moyen de paiement : annonce la suite sans demander de carte', () => {
    const { html } = renderGiftReminderEmail({ ...input, lang: 'fr', continuation: 'auto' });
    expect(html).not.toContain('ajoute un moyen de paiement');
    expect(html).toContain('ton abonnement continue à 39 €/mois');
  });

  it('ancienne abonnée avec une carte enregistrée : réactiver, sans prélèvement automatique', () => {
    const { html } = renderGiftReminderEmail({ ...input, lang: 'fr', continuation: 'renew' });
    expect(html).toContain('réactive ton abonnement');
    expect(html).toContain('sans aucun prélèvement');
  });

  it('en espagnol, et pour un essai prolongé', () => {
    const { subject, html } = renderGiftReminderEmail({ ...input, lang: 'es', stage: '3', extension: true, continuation: 'add_payment', endsLabel: '24 de enero de 2027' });
    expect(subject).toBe('Tu prueba termina el 24 de enero de 2027');
    expect(html).toContain('Quedan 3 días');
    expect(html).toContain('añade un medio de pago');
  });

  it('échappe les prénoms', () => {
    const { html } = renderGiftReminderEmail({ ...input, lang: 'fr', continuation: 'add_payment', firstName: '<b>x</b>' });
    expect(html).not.toContain('<b>x</b>');
  });
});

describe('withFreeMonths', () => {
  const rows: GiftPrice[] = [1, 3, 6, 12].map((m, i) => ({
    months: m as GiftPrice['months'],
    priceId: null,
    amountCents: [3900, 10900, 19500, 34900][i],
    currency: 'eur',
    perMonthCents: null,
    freeMonths: null,
  }));
  it('déduit les mois offerts des prix Stripe', () => {
    expect(withFreeMonths(rows).map((r) => r.freeMonths)).toEqual([null, null, 1, 3]);
  });
  it('rien si un prix manque', () => {
    expect(withFreeMonths(rows.map((r) => (r.months === 1 ? { ...r, amountCents: null } : r))).every((r) => r.freeMonths === null)).toBe(true);
  });
});

describe('giftPageLang', () => {
  it('?lang= prime, sinon le navigateur', () => {
    expect(giftPageLang('es', 'fr-FR,fr;q=0.9')).toEqual({ lang: 'es', fromUrl: true });
    expect(giftPageLang(undefined, 'es-MX,es;q=0.9,en;q=0.8')).toEqual({ lang: 'es', fromUrl: false });
    expect(giftPageLang(undefined, 'en-US,fr;q=0.5')).toEqual({ lang: 'fr', fromUrl: false });
    expect(giftPageLang(undefined, null)).toEqual({ lang: 'fr', fromUrl: false });
  });
});

describe('dates d’envoi', () => {
  it('jour local selon le fuseau', () => {
    const at = new Date('2026-10-20T23:30:00Z');
    expect(ymdInZone(at, 'Europe/Paris')).toBe('2026-10-21');
    expect(ymdInZone(at, 'America/Mexico_City')).toBe('2026-10-20');
    expect(ymdInZone(at, 'Europe/Paris', 1)).toBe('2026-10-22');
  });
  it('fuseau déduit du navigateur', () => {
    expect(guessGiftTimezone('America/Monterrey')).toBe('America/Mexico_City');
    expect(guessGiftTimezone('Europe/Madrid')).toBe('Europe/Paris');
    expect(guessGiftTimezone(undefined)).toBe('Europe/Paris');
  });
});

describe('écran admin C05', () => {
  const now = new Date('2026-10-20T10:00:00Z');
  const rows = demoAdminGiftRows();
  it('statuts affichés', () => {
    expect(toAdminGiftRows(rows, now).map((r) => r.display)).toEqual(['scheduled', 'active', 'sent', 'active', 'converted', 'refunded']);
  });
  it('statistiques du mois (remboursements déduits, activation sur cartes livrées)', () => {
    const s = giftStats(rows, now);
    expect(s.soldThisMonth).toBe(4);
    expect(s.revenueCents).toBe(10900 + 19500 + 3900 + 10900);
    expect(s.activated).toBe(3);
    expect(s.converted).toBe(1);
    expect(s.delivered).toBe(4);
  });
});
