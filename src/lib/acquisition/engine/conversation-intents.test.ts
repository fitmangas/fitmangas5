import { describe, expect, it } from 'vitest';

import { runConcierge } from '@/lib/acquisition/ai/concierge';
import {
  classifyConversationIntent,
  replyForIntent,
} from '@/lib/acquisition/engine/conversation-intents';
import { shouldAskFollowGate } from '@/lib/acquisition/engine/follow-gate';
import { isSoftDeclineText } from '@/lib/acquisition/engine/soft-decline';
import { textMatchesKeyword } from '@/lib/acquisition/engine/workflow-catalog';
import type { AcqContact } from '@/lib/acquisition/types';

describe('conversation-intents', () => {
  it('thinking FR/ES — pas soft_decline', () => {
    expect(classifyConversationIntent('Je vais y réfléchir, plus tard')).toBe('thinking');
    expect(classifyConversationIntent('Lo pensaré, otro momento')).toBe('thinking');
    expect(isSoftDeclineText('Je vais y réfléchir, plus tard')).toBe(false);
  });

  it('question prix — répond factuel', () => {
    expect(classifyConversationIntent("c'est combien le mois ?")).toBe('factual_price');
    const fr = replyForIntent('factual_price', 'fr');
    expect(fr.body).toMatch(/39/);
    expect(fr.appendTrialLink).toBe(false);
    const es = replyForIntent('factual_price', 'mx');
    expect(es.body).toMatch(/39/);
  });

  it('horaires / replay / comment ça marche', () => {
    expect(classifyConversationIntent('quels horaires avez-vous ?')).toBe('factual_schedule');
    expect(classifyConversationIntent('si je rate un cours, y a un replay ?')).toBe('factual_replay');
    expect(classifyConversationIntent('comment ça se passe ?')).toBe('factual_how');
  });

  it('essai / code promo — cadre 7j sans dévaloriser', () => {
    expect(classifyConversationIntent("c'est gratuit ?")).toBe('trial_offer');
    expect(classifyConversationIntent('un code promo ?')).toBe('trial_offer');
    const body = replyForIntent('trial_offer', 'fr').body;
    expect(body).toMatch(/7 jours/i);
    expect(body).toMatch(/39/);
  });

  it('support — pas de pitch', () => {
    expect(classifyConversationIntent("je n'arrive pas à me connecter")).toBe('support');
    expect(classifyConversationIntent('où est le replay ?')).toBe('support');
    expect(replyForIntent('support', 'fr').appendTrialLink).toBe(false);
    expect(replyForIntent('support', 'fr').body).not.toMatch(/Essai 7 jours gratuits/);
  });

  it('compliment / hors-sujet — zéro tunnel', () => {
    expect(classifyConversationIntent("j'adore tes vidéos merci pour tout")).toBe('warm_no_intent');
    expect(classifyConversationIntent('Félicitations pour ton anniversaire 🎂')).toBe('offtopic');
    expect(replyForIntent('warm_no_intent', 'fr').appendTrialLink).toBe(false);
    expect(replyForIntent('offtopic', 'mx').body.length).toBeGreaterThan(5);
  });

  it('follow-gate ne part pas sur thinking / support / warm', () => {
    const c = { tags: [], lifecycleStage: 'new' } as AcqContact;
    expect(
      shouldAskFollowGate({
        triggerType: 'ig_dm_inbound',
        inboundText: 'je réfléchis encore',
        contact: c,
      }),
    ).toBe(false);
    expect(
      shouldAskFollowGate({
        triggerType: 'ig_dm_inbound',
        inboundText: "problème de connexion au compte",
        contact: c,
      }),
    ).toBe(false);
  });
});

describe('soft-decline Léa (non-régression)', () => {
  it('détecte refus poli déjà inscrite ailleurs', () => {
    const lea =
      'Hello ! Merci beaucoup pour ton message 😇 mais je suis déjà inscrite à une salle de sport qui me correspond vraiment bien :) Belle soirée à toi ! ✨';
    expect(isSoftDeclineText(lea)).toBe(true);
    expect(classifyConversationIntent(lea)).toBe(null);
    expect(
      shouldAskFollowGate({
        triggerType: 'ig_dm_inbound',
        inboundText: lea,
        contact: { tags: [], lifecycleStage: 'new' } as AcqContact,
      }),
    ).toBe(false);
  });
});

describe('triggers resserrés', () => {
  it('ne match plus « info » / « temps » / « test » seuls trop larges', () => {
    const prixKw =
      "prix|tarif|combien|cuesta|precio|costo|plus d'info|des infos|más info|mas info";
    expect(textMatchesKeyword('des infos svp', prixKw)).toBe(true);
    expect(textMatchesKeyword('information générale', prixKw)).toBe(false);

    const tempsKw =
      'pas le temps|manque de temps|no tengo tiempo|falta de tiempo|trop busy|muy ocupad|pas le time|no time';
    expect(textMatchesKeyword("j'ai pas le temps", tempsKw)).toBe(true);
    expect(textMatchesKeyword('en même temps c est bien', tempsKw)).toBe(false);

    const quizKw =
      'quiz|mon profil|mi perfil|test de profil|test personalidad|profil discipline|conocimiento de si|connaissance de soi|hub quiz';
    expect(textMatchesKeyword('je veux faire le quiz', quizKw)).toBe(true);
    expect(textMatchesKeyword('je teste mon tapis', quizKw)).toBe(false);
  });
});

describe('concierge fallback (Claude OFF)', () => {
  it('route thinking / factuel / warm sans pitch essai', async () => {
    const thinking = await runConcierge({ inboundText: 'Je réfléchis, plus tard', market: 'fr' });
    expect(thinking.ok && thinking.intent).toBe('thinking');
    if (thinking.ok) {
      expect(thinking.suggestedActions).not.toContain('send_trial_link');
      expect(thinking.reply).not.toMatch(/Essai 7 jours gratuits/);
    }

    const price = await runConcierge({ inboundText: 'cuánto cuesta?', market: 'mx' });
    expect(price.ok && price.intent).toBe('factual');
    if (price.ok) {
      expect(price.reply).toMatch(/39/);
      expect(price.suggestedActions).not.toContain('send_trial_link');
    }

    const warm = await runConcierge({ inboundText: 'me encanta tu contenido gracias', market: 'mx' });
    expect(warm.ok && warm.intent).toBe('warm_no_intent');
    if (warm.ok) expect(warm.suggestedActions).toEqual([]);

    const vague = await runConcierge({ inboundText: 'Salut, j’aimerais en savoir un peu plus', market: 'fr' });
    expect(vague.ok && vague.intent).toBe('info');
    if (vague.ok) {
      expect(vague.suggestedActions).not.toContain('send_trial_link');
      expect(vague.suggestedActions).not.toContain('capture_email_optin');
      expect(vague.reply).toMatch(/Dis-moi|question/i);
    }
  });
});
