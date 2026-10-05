/**
 * Plan d'action Ads — hypothèses prioritaires à tester (jamais certitudes).
 * Borné à ADS_EXPERTISE + MARCHE_FEMMES + données réelles.
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { runSocialTextCascade } from '@/lib/admin/social-text-ai';
import type { CoachAdvice, CoachAction } from './coach';
import type { IntelligenceBundle } from './intelligence-repository';
import { demoShare, summarizeOrganicPeriod, topDemo } from './stats-compute';

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
  /** Id d’un besoin Marché (constance, etre-vue…). */
  wantId?: string;
  /** Phrase appuyée sur les chiffres réels (jamais inventée). */
  evidence?: string;
  emoji?: string;
};

const COUNTRY_NAME: Record<string, string> = { FR: 'France', MX: 'Mexique', ES: 'Espagne', US: 'États-Unis' };

export function planEvidenceFromBundle(bundle: IntelligenceBundle): string {
  const daily = bundle.organicDaily ?? [];
  const p = summarizeOrganicPeriod(daily, 28);
  const gender = demoShare(bundle.demographics?.gender ?? []);
  const age = demoShare(bundle.demographics?.age ?? []);
  const country = demoShare(bundle.demographics?.country ?? []);
  const parts: string[] = [];
  if (p.coveredDays > 0) {
    if (p.totals.profileViews != null) {
      parts.push(`${p.totals.profileViews.toLocaleString('fr-FR')} visites de profil (28 j)`);
    }
    if (p.netFollowers != null) {
      parts.push(`croissance nette ${p.netFollowers >= 0 ? '+' : ''}${p.netFollowers}`);
    }
    const clicks = (p.totals.websiteClicks ?? 0) + (p.totals.profileLinksTaps ?? 0);
    if (p.totals.profileViews != null && p.totals.profileViews > 0) {
      parts.push(`${clicks.toLocaleString('fr-FR')} clics vers le site`);
    }
  }
  const topG = topDemo(gender);
  if (topG) parts.push(`${Math.round(topG.pct)} % ${topG.key === 'F' ? 'femmes' : topG.key === 'M' ? 'hommes' : 'non renseigné'}`);
  const topA = topDemo(age);
  if (topA) parts.push(`âge le plus présent : ${topA.key} (${Math.round(topA.pct)} %)`);
  const topC = topDemo(country);
  if (topC) parts.push(`pays n°1 des abonnées : ${COUNTRY_NAME[topC.key] ?? topC.key}`);
  const spend = bundle.adsTotals?.spendCents ?? 0;
  if (spend === 0) parts.push('0 € dépensé en pub — à tester, pas une certitude');
  return parts.length ? parts.join(' · ') : 'Pas encore assez de chiffres — synchronise les données.';
}

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
  const hasSpend = bundle.campaigns.some((c) => c.spendCents > 0) || (bundle.adsTotals?.spendCents ?? 0) > 0;
  const followers = bundle.organicAccount?.followersCount ?? null;
  const evidence = planEvidenceFromBundle(bundle);
  const daily = bundle.organicDaily ?? [];
  const period = summarizeOrganicPeriod(daily, 28);
  const countryShare = demoShare(bundle.demographics?.country ?? []);
  const mxShare = countryShare.find((c) => c.key === 'MX')?.pct ?? 0;
  const profileViews = period.totals.profileViews;
  const siteClicks = (period.totals.websiteClicks ?? 0) + (period.totals.profileLinksTaps ?? 0);
  const leakyBio = profileViews != null && profileViews >= 80 && siteClicks < profileViews * 0.04;

  const items: ActionPlanItem[] = [
    {
      id: 'create-th-pas-dos',
      priority: 1,
      emoji: '🎥',
      wantId: 'mind-body',
      evidence,
      title: 'Film #1 — elle parle à la caméra, 15–30 s (dos à 15h)',
      hypothesis:
        'Hypothèse : une accroche « À 15h ton dos te lâche ? » + la solitude de YouTube + les cours collectifs + essai 7 jours convertit mieux qu’un exercice technique.',
      creativeType: 'talking_head',
      framework: 'PAS',
      market: 'FR',
      budgetHint: hasSpend
        ? 'Tester en froid 8–15 €/j après double confirmation'
        : 'Brouillon en pause d’abord · activer 8 €/j après double confirmation',
      honesty:
        'Hypothèse à tester — pas une certitude. Couper si 48–72 h ou 50–100 € sans inscription et presque aucun clic.',
      action: { type: 'create_cm_draft', label: 'Créer le brouillon', planItemId: 'create-th-pas-dos' },
      source: 'rules',
    },
    {
      id: 'create-ugc-preuve',
      priority: 2,
      emoji: '🤳',
      wantId: 'etre-vue',
      evidence,
      title: 'Film #2 — preuve en vrai (correction / tableau de bord)',
      hypothesis:
        'Hypothèse : montrer la correction en direct ou le tableau de bord + essai 7 jours sans risque bat une pub « studio trop beau ».',
      creativeType: 'ugc_temoignage',
      framework: 'Hook-Problème-Solution-Preuve',
      market: 'FR',
      budgetHint: '2ᵉ film dans la même campagne froide (deux accroches à comparer)',
      honesty: 'À tester en parallèle du #1 — un seul message par pub.',
      action: { type: 'create_cm_draft', label: 'Créer le brouillon', planItemId: 'create-ugc-preuve' },
      source: 'rules',
    },
    {
      id: 'signal-organique',
      priority: 3,
      emoji: '📡',
      wantId: 'constance',
      evidence: topOrganic
        ? [
            `Note ${topOrganic.score.toFixed(0)}`,
            topOrganic.reach != null ? `portée ${topOrganic.reach.toLocaleString('fr-FR')}` : null,
            topOrganic.avgWatchTimeMs != null
              ? `visionnage moyen ${(topOrganic.avgWatchTimeMs / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} s`
              : null,
          ]
            .filter(Boolean)
            .join(' · ')
        : evidence,
      title: topOrganic
        ? `Un Reel a déjà résonné (note ${topOrganic.score.toFixed(0)}) — en extraire l’angle`
        : 'Synchroniser Instagram pour voir quels Reels résonnent',
      hypothesis: topOrganic
        ? `Ce Reel/post a parlé (${(topOrganic.caption ?? 'sans légende').slice(0, 90)}…). Ce n’est pas un ordre de le « booster » tel quel : on en tire l’angle, on refait 15–30 s + essai 7 jours.`
        : 'Sans tops Instagram, prioriser les angles Marché France (dos, essai, correction).',
      creativeType: 'talking_head',
      framework: 'signal_organique',
      market: 'FR',
      budgetHint: 'Brouillon en pause depuis le média = zéro €',
      honesty: 'Instagram sans pub = signal d’angle, pas une preuve que ça vendra.',
      action: topOrganic
        ? {
            type: 'boost_organic',
            label: 'Adapter en brouillon (0 €)',
            igMediaId: topOrganic.igMediaId,
            captionHint: (topOrganic.caption ?? '').slice(0, 80),
          }
        : { type: 'sync_now', label: 'Synchroniser Instagram' },
      source: 'rules',
    },
    {
      id: 'structure-froid',
      priority: 4,
      emoji: '🧭',
      wantId: 'constance',
      evidence,
      title: 'Organisation — 1 campagne froide, ciblage large, 3–6 films',
      hypothesis:
        'À 8–30 €/j, un ciblage large femmes 30–55 marche mieux que d’empiler trop de centres d’intérêt. Objectif : 15–40 films/mois, nouvelle version tous les 10–14 jours.',
      creativeType: 'autre',
      framework: 'structure',
      market: 'FR',
      budgetHint: '8 €/j au démarrage · monter seulement si le coût par inscription est entre 4 et 18 €',
      honesty: hasSpend
        ? 'De l’argent a déjà été dépensé — lire coût par inscription, taux de clic et fréquence avant d’augmenter.'
        : 'Sans dépense, tout coût par inscription est « trop tôt ».',
      action: { type: 'create_cold_draft', label: 'Vérifier le brouillon froid (0 €)' },
      source: 'rules',
    },
    {
      id: 'mx-later',
      priority: mxShare >= 15 ? 3 : 5,
      emoji: '🇲🇽',
      wantId: 'etre-vue',
      evidence:
        mxShare > 0
          ? `${Math.round(mxShare)} % des abonnées sont au Mexique — film ES dédié, pas une copie FR.`
          : evidence,
      title: 'Mexique — film en espagnol (pas une copie du français)',
      hypothesis:
        'Hypothèse secondaire : « no estás sola » + corrección en vivo + filet WhatsApp. Lancer après un premier signal France.',
      creativeType: 'talking_head',
      framework: 'PAS',
      market: 'MX',
      budgetHint: 'Après un test France — budget à part',
      honesty: 'Marché secondaire — ne pas diluer le test France trop tôt.',
      action: null,
      source: 'rules',
    },
  ];

  if (leakyBio) {
    items.push({
      id: 'bio-leak',
      priority: 2,
      emoji: '🔗',
      wantId: 'at-home',
      evidence: `${profileViews!.toLocaleString('fr-FR')} visites de profil vs ${siteClicks.toLocaleString('fr-FR')} clics vers le site (28 j).`,
      title: 'Le profil attire, le lien convertit peu',
      hypothesis:
        'Hypothèse : plus de visites que de clics vers le site — reforger l’accroche + le bouton « essai 7 jours » dans la bio, et le dire dans le film.',
      creativeType: 'autre',
      framework: 'structure',
      market: 'FR',
      budgetHint: '0 € — à faire avant d’allumer la pub',
      honesty: 'Lecture des visites Instagram, pas une preuve pub.',
      action: null,
      source: 'rules',
    });
  }

  if (followers != null || (bundle.demographics?.age?.length ?? 0) > 0) {
    items.push({
      id: 'demo-cross',
      priority: 3,
      emoji: '🎯',
      wantId: 'pour-la-vie',
      evidence,
      title: 'Qui te suit vraiment vs le message large',
      hypothesis: [
        followers != null ? `Compte ~${followers.toLocaleString('fr-FR')} abonnées.` : null,
        evidence,
        'Ne pas viser seulement « les fans de Pilates » — message large (constance / être vue).',
      ]
        .filter(Boolean)
        .join(' '),
      creativeType: 'autre',
      framework: 'structure',
      market: 'FR+MX',
      budgetHint: 'Ajuster les accroches, pas micro-cibler',
      honesty: 'La répartition pub est vide tant que 0 € — les abonnées Instagram donnent la tendance.',
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
    system: `Tu es stratège pub FitMangas. Français simple, zéro jargon anglais non expliqué.
Borné au corpus + FAITS JSON. INTERDIT inventer des métriques.
Chaque idée = HYPOTHÈSE À TESTER. Titres concrets (scène + durée), pas « talking-head » / « UGC » / « hook ».
Focus : QUOI FILMER pour convertir (elle parle à la caméra, témoignage téléphone, image, carrousel).
Instagram sans pub = signal d'angle seulement, pas « booster tel quel ».
Corpus:\n${corpus}`,
    user: `FAITS:\n${facts}\n\nJSON array 2-3 items: [{"title":"...","hypothesis":"...","creativeType":"talking_head|ugc_temoignage|image_forte|carousel","framework":"PAS|Hook-Problème-Solution-Preuve","market":"FR|MX","wantId":"constance|etre-vue|mind-body|at-home"}]`,
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
            budgetHint: 'Brouillon en pause → petit budget après double confirmation',
            honesty: 'Hypothèse à tester — pas une certitude.',
            action: {
              type: 'create_cm_draft',
              label: 'Créer le brouillon',
              planItemId: `ai-plan-${idx}`,
            },
            source: 'ai',
            wantId: p.wantId,
            evidence: planEvidenceFromBundle(bundle),
            emoji: '✨',
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
