/**
 * Plan d'action Ads — hypothèses prioritaires à tester (jamais certitudes).
 * Borné à ADS_EXPERTISE + MARCHE_FEMMES + données réelles.
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { runSocialTextCascade } from '@/lib/admin/social-text-ai';
import type { CoachAdvice, CoachAction } from './coach';
import type { IntelligenceBundle } from './intelligence-repository';

export type ActionPlanItem = {
  id: string;
  priority: 1 | 2 | 3 | 4 | 5;
  title: string;
  hypothesis: string;
  creativeType: 'talking_head' | 'ugc_temoignage' | 'image_forte' | 'carousel' | 'autre';
  framework: 'PAS' | 'Hook-Problème-Solution-Preuve' | 'signal_organique' | 'structure';
  market: 'FR' | 'MX' | 'FR+MX';
  budgetHint: string;
  honesty: string;
  action: CoachAction | null;
  source: 'rules' | 'ai';
};

async function loadDocs(): Promise<string> {
  const parts: string[] = [];
  for (const name of ['ADS_EXPERTISE.md', 'MARCHE_FEMMES.md']) {
    try {
      const text = await readFile(path.join(process.cwd(), 'docs', name), 'utf8');
      parts.push(`## ${name}\n${text.slice(0, 8_000)}`);
    } catch {
      parts.push(`## ${name}\n(indisponible)`);
    }
  }
  return parts.join('\n\n');
}

export function buildDeterministicActionPlan(bundle: IntelligenceBundle): ActionPlanItem[] {
  const topOrganic = bundle.organicMedia.find((m) => m.boostBadge) ?? bundle.organicMedia[0];
  const hasSpend = bundle.campaigns.some((c) => c.spendCents > 0);
  const followers = bundle.organicAccount?.followersCount ?? null;
  const ageTop = bundle.breakdowns.age[0];
  const countryTop = bundle.breakdowns.country[0];

  const items: ActionPlanItem[] = [
    {
      id: 'create-th-pas-dos',
      priority: 1,
      title: 'Créative #1 — talking-head 15–30 s (PAS · dos 15h)',
      hypothesis:
        'Hypothèse : un hook « À 15h ton dos te lâche ? » + agitation solitude YouTube + solution cours collectifs + CTA essai 7 j convertit mieux qu’un exo technique.',
      creativeType: 'talking_head',
      framework: 'PAS',
      market: 'FR',
      budgetHint: hasSpend ? 'Tester en froid 8–15 €/j après double confirm' : 'Brouillon PAUSED d’abord · activer 8 €/j après double confirm',
      honesty: 'Hypothèse à tester — pas une certitude. Kill si 48–72 h / 50–100 € sans lead + CTR mort.',
      action: { type: 'create_cold_draft', label: 'Créer brouillon froid PAUSED' },
      source: 'rules',
    },
    {
      id: 'create-ugc-preuve',
      priority: 2,
      title: 'Créative #2 — UGC preuve (Hook-Problème-Solution-Preuve)',
      hypothesis:
        'Hypothèse : montrer correction en direct / dashboard (preuve produit) + essai 7 j anti-risque bat une pub « studio léché ».',
      creativeType: 'ugc_temoignage',
      framework: 'Hook-Problème-Solution-Preuve',
      market: 'FR',
      budgetHint: '2ᵉ créative dans la même campagne froide (A/B hooks)',
      honesty: 'À tester en parallèle de #1 — un seul message par pub.',
      action: { type: 'create_cold_draft', label: 'Préparer variation PAUSED' },
      source: 'rules',
    },
    {
      id: 'signal-organique',
      priority: 3,
      title: topOrganic
        ? `Signal organique · score ${topOrganic.score.toFixed(0)} → adapter en pub`
        : 'Signal organique · sync pour scorer',
      hypothesis: topOrganic
        ? `Ce Reel/post a résonné (${(topOrganic.caption ?? 'sans légende').slice(0, 90)}…). Ce n’est PAS un ordre de booster tel quel : en extraire l’angle / hook, reformater 15–30 s + CTA essai.`
        : 'Sans tops organiques, prioriser les angles Marché FR (dos, essai, correction).',
      creativeType: 'talking_head',
      framework: 'signal_organique',
      market: 'FR',
      budgetHint: 'Brouillon PAUSED depuis le média = zéro €',
      honesty: 'Organique = signal secondaire (angles), pas preuve de conversion ads.',
      action: topOrganic
        ? {
            type: 'boost_organic',
            label: 'Adapter en brouillon PAUSED',
            igMediaId: topOrganic.igMediaId,
            captionHint: (topOrganic.caption ?? '').slice(0, 80),
          }
        : { type: 'sync_now', label: 'Synchroniser organique' },
      source: 'rules',
    },
    {
      id: 'structure-froid',
      priority: 4,
      title: 'Structure — 1 campagne froide, broad, 3–6 créatives',
      hypothesis:
        'À ~8–30 €/j, broad femmes 30–55 bat l’interest stacking. Volume cible : 15–40 créatives/mois, refresh 10–14 j.',
      creativeType: 'autre',
      framework: 'structure',
      market: 'FR',
      budgetHint: '8 €/j démarrage · monter seulement si CPL dans 4–18 €',
      honesty: hasSpend
        ? 'Spend déjà présent — lire CPL/CTR/fréquence avant de scaler.'
        : 'Sans spend, toute analyse CPL est « trop tôt ».',
      action: { type: 'create_cold_draft', label: 'Vérifier brouillon froid PAUSED' },
      source: 'rules',
    },
    {
      id: 'mx-later',
      priority: 5,
      title: 'MX — créative ES dédiée (pas calque FR)',
      hypothesis:
        'Hypothèse secondaire : « no estás sola » + corrección en vivo + WhatsApp filet. Lancer après signal FR.',
      creativeType: 'talking_head',
      framework: 'PAS',
      market: 'MX',
      budgetHint: 'Après validation FR — budget test séparé',
      honesty: 'Marché secondaire — ne pas diluer le test FR trop tôt.',
      action: null,
      source: 'rules',
    },
  ];

  if (followers != null || ageTop || countryTop) {
    items.push({
      id: 'demo-cross',
      priority: 3,
      title: 'Croiser audience réelle vs message large',
      hypothesis: [
        followers != null ? `Compte ~${followers.toLocaleString('fr-FR')} abonnés.` : null,
        ageTop ? `Breakdown âge top (ads) : ${ageTop.key}.` : 'Pas encore de breakdown âge ads (zéros si 0 spend).',
        countryTop ? `Pays top : ${countryTop.key}.` : null,
        'Ne pas cibler uniquement « fans Pilates » — message large (constance / être vue).',
      ]
        .filter(Boolean)
        .join(' '),
      creativeType: 'autre',
      framework: 'structure',
      market: 'FR+MX',
      budgetHint: 'Ajuster hooks, pas micro-intérêts',
      honesty: 'Démographie ads vide tant que pas de dépense — organique compte pour tendance.',
      action: null,
      source: 'rules',
    });
  }

  return items.sort((a, b) => a.priority - b.priority).slice(0, 7);
}

export async function generateActionPlan(
  bundle: IntelligenceBundle,
  previousTitles: string[] = [],
): Promise<{ items: ActionPlanItem[]; aiNote: string | null; adviceMirror: CoachAdvice[] }> {
  const base = buildDeterministicActionPlan(bundle);
  const prev = new Set(previousTitles.map((t) => t.toLowerCase().trim()));
  const dedupedBase = base.filter((i) => !prev.has(i.title.toLowerCase()));
  const corpus = await loadDocs();
  const facts = JSON.stringify({
    lastSync: bundle.lastSyncAt,
    organicTop: bundle.organicMedia.slice(0, 5).map((m) => ({
      score: m.score,
      reach: m.reach,
      saved: m.saved,
      shares: m.shares,
      caption: (m.caption ?? '').slice(0, 60),
    })),
    account: bundle.organicAccount,
    spend: bundle.campaigns.reduce((s, c) => s + c.spendCents, 0) / 100,
    leads: bundle.campaigns.reduce((s, c) => s + c.leads, 0),
    breakdownsAge: bundle.breakdowns.age.slice(0, 5),
    breakdownsCountry: bundle.breakdowns.country.slice(0, 5),
  });

  const cascade = await runSocialTextCascade({
    system: `Tu es stratège Ads FitMangas. Français simple. Borné au corpus + FAITS JSON.
INTERDIT inventer des métriques. Chaque idée = HYPOTHÈSE À TESTER (pas certitude).
Focus : QUOI CRÉER pour convertir (talking-head, UGC, image, carousel) avec frameworks PAS ou Hook-Problème-Solution-Preuve.
Organique = signal d'angle seulement, pas « booster tel quel ».
Corpus:\n${corpus}`,
    user: `FAITS:\n${facts}\n\nJSON array 2-3 items: [{"title":"...","hypothesis":"...","creativeType":"talking_head|ugc_temoignage|image_forte|carousel","framework":"PAS|Hook-Problème-Solution-Preuve","market":"FR|MX"}]`,
    temperature: 0.35,
    maxOutputTokens: 1000,
  });

  let aiNote: string | null = null;
  const items = [...(dedupedBase.length ? dedupedBase : base)];

  if (cascade.ok) {
    aiNote = `Plan enrichi via ${cascade.provider}/${cascade.model} — hypothèses bornées aux docs + faits.`;
    try {
      const raw = cascade.text.trim();
      const start = raw.indexOf('[');
      const end = raw.lastIndexOf(']');
      if (start >= 0 && end > start) {
        const parsed = JSON.parse(raw.slice(start, end + 1)) as Array<Record<string, string>>;
        const titles = new Set(items.map((i) => i.title.toLowerCase()));
        for (const [idx, p] of parsed.slice(0, 3).entries()) {
          const title = String(p.title ?? '').slice(0, 120);
          if (!title || titles.has(title.toLowerCase()) || prev.has(title.toLowerCase())) continue;
          items.push({
            id: `ai-plan-${idx}`,
            priority: 2,
            title,
            hypothesis: String(p.hypothesis ?? '').slice(0, 400),
            creativeType: (['talking_head', 'ugc_temoignage', 'image_forte', 'carousel'].includes(p.creativeType)
              ? p.creativeType
              : 'talking_head') as ActionPlanItem['creativeType'],
            framework: (p.framework === 'PAS' ? 'PAS' : 'Hook-Problème-Solution-Preuve') as ActionPlanItem['framework'],
            market: p.market === 'MX' ? 'MX' : 'FR',
            budgetHint: 'Brouillon PAUSED → test budget bas après double confirm',
            honesty: 'Hypothèse IA à tester — pas une certitude.',
            action: { type: 'create_cold_draft', label: 'Créer brouillon PAUSED' },
            source: 'ai',
          });
          titles.add(title.toLowerCase());
        }
      }
    } catch {
      aiNote = 'IA non JSON — plan règles conservé.';
    }
  } else {
    aiNote = cascade.detail ?? 'IA indisponible — plan règles (docs + sync).';
  }

  const adviceMirror: CoachAdvice[] = items.slice(0, 6).map((i) => ({
    id: i.id,
    priority: i.priority <= 2 ? 'high' : i.priority <= 4 ? 'medium' : 'low',
    title: i.title,
    body: `${i.hypothesis} ${i.honesty}`,
    dataStatus: bundle.lastSyncAt ? 'ok' : 'too_early',
    source: i.source,
    action: i.action,
  }));

  return { items: items.slice(0, 8), aiNote, adviceMirror };
}
