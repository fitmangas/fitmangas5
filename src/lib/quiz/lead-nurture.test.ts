import { describe, expect, it } from 'vitest';

import { trialFollowupSequence } from '@/lib/acquisition/copy-bilingual';
import { textMatchesKeyword } from '@/lib/acquisition/engine/workflow-catalog';
import {
  buildQuizNurtureEmail,
  buildQuizWhatsAppBody,
  phoneDigitsForWhatsApp,
  profileHook,
  profileLabel,
} from '@/lib/quiz/lead-nurture';

describe('textMatchesKeyword (prix en phrase)', () => {
  it('matche un mot seul', () => {
    expect(textMatchesKeyword('prix', 'prix|tarif|combien')).toBe(true);
  });
  it('matche une phrase complète', () => {
    expect(textMatchesKeyword('Bonjour, j’aimerais savoir le prix svp', 'prix|tarif|combien')).toBe(
      true,
    );
  });
  it('matche ES precio', () => {
    expect(textMatchesKeyword('¿Cuánto cuesta el precio?', 'prix|precio|costo')).toBe(true);
  });
  it('ne matche pas hors sujet', () => {
    expect(textMatchesKeyword('bonjour ça va', 'prix|tarif')).toBe(false);
  });
});

describe('trialFollowupSequence alignée J+2 / J+5', () => {
  it('planifie 48h, 120h, 168h', () => {
    const delays = trialFollowupSequence().map((a) => Number(a.config?.delayHours));
    expect(delays).toEqual([48, 120, 168]);
  });
});

describe('quiz nurture helpers', () => {
  it('profileLabel FR/ES', () => {
    expect(profileLabel('jaune', 'fr')).toContain('Enthousiaste');
    expect(profileLabel('jaune', 'es')).toContain('Entusiasta');
  });
  it('profileHook non vide', () => {
    expect(profileHook('rouge', 'fr').length).toBeGreaterThan(20);
  });
  it('phoneDigitsForWhatsApp FR national', () => {
    expect(phoneDigitsForWhatsApp('06 12 34 56 78')).toBe('33612345678');
    expect(phoneDigitsForWhatsApp('+33 6 12 34 56 78')).toBe('33612345678');
  });
  it('buildQuizWhatsAppBody contient profil + essai', () => {
    const body = buildQuizWhatsAppBody({
      locale: 'fr',
      firstName: 'Marie',
      resultId: 'jaune',
    });
    expect(body).toContain('Marie');
    expect(body).toContain('Enthousiaste');
    expect(body).toContain('Essai 7 jours');
    expect(body).toContain('offer=v-coll');
    expect(body.toLowerCase()).not.toContain('mangitas');
    expect(body.toLowerCase()).not.toContain('rendez-vous fixe');
  });

  it('buildQuizNurtureEmail : CTA essai + wa.me sur welcome, j2, j5', () => {
    for (const step of ['welcome', 'j2', 'j5'] as const) {
      const { subject, innerHtml } = buildQuizNurtureEmail({
        step,
        locale: 'fr',
        firstName: 'Marie',
        resultId: 'jaune',
        quizSlug: 'profil-discipline',
      });
      expect(subject.length).toBeGreaterThan(5);
      expect(innerHtml).toContain('wa.me/');
      expect(innerHtml).toContain('Écris-moi ici');
      expect(innerHtml).toContain('#C45D3E');
      expect(innerHtml.toLowerCase()).not.toContain('mangitas');
      expect(innerHtml.toLowerCase()).not.toContain('rendez-vous fixe');
    }
  });
});
