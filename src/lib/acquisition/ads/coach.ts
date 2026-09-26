/**
 * Coach Ads — recommandations bornées au corpus docs/ADS_EXPERTISE.md + données réelles.
 * Interdit d’inventer des métriques.
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { runSocialTextCascade } from '@/lib/admin/social-text-ai';
import type { AdsAlert } from './alerts';
import type { IntelligenceBundle, OrganicMediaRow } from './intelligence-repository';

export type CoachAction =
  | { type: 'create_cold_draft'; label: string }
  | { type: 'boost_organic'; label: string; igMediaId: string; captionHint: string }
  | { type: 'refresh_creative'; label: string; entityName: string | null }
  | { type: 'sync_now'; label: string }
  | { type: 'add_payment'; label: string }
  | { type: 'add_ig_insights_scope'; label: string };

export type CoachAdvice = {
  id: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  body: string;
  dataStatus: 'ok' | 'too_early' | 'missing_permission';
  source: 'rules' | 'ai';
  action: CoachAction | null;
};

async function loadExpertiseCorpus(): Promise<string> {
  try {
    const expertise = await readFile(path.join(process.cwd(), 'docs', 'ADS_EXPERTISE.md'), 'utf8');
    let marche = '';
    try {
      marche = await readFile(path.join(process.cwd(), 'docs', 'MARCHE_FEMMES.md'), 'utf8');
    } catch {
      marche = '';
    }
    return `${expertise.slice(0, 9_000)}\n\n---\n\n${marche.slice(0, 5_000)}`;
  } catch {
    return 'Corpus ADS_EXPERTISE indisponible — règles embarquées uniquement.';
  }
}

function starterAdvice(bundle: IntelligenceBundle): CoachAdvice[] {
  const out: CoachAdvice[] = [];
  const hasSpend = bundle.campaigns.some((c) => c.spendCents > 0);
  const topOrganic = bundle.organicMedia.find((m) => m.boostBadge) ?? bundle.organicMedia[0];

  if (!bundle.lastSyncAt) {
    out.push({
      id: 'start-sync',
      priority: 'high',
      title: 'Lancer la première synchro',
      body: 'Aucune synchro enregistrée. Le cron quotidien tourne à 4h40 Europe/Paris ; tu peux aussi cliquer Sync maintenant. Zéros honnêtes jusqu’aux premières données.',
      dataStatus: 'too_early',
      source: 'rules',
      action: { type: 'sync_now', label: 'Synchroniser maintenant' },
    });
  }

  if (!hasSpend) {
    out.push({
      id: 'start-payment',
      priority: 'high',
      title: 'Ajouter le moyen de paiement Meta',
      body: 'Sans carte sur le Ad Account, aucune diffusion même après activation. Ouvre le billing Meta (pas de formulaire carte dans FitMangas). Puis active la campagne froide quiz à 8 €/j via double confirmation.',
      dataStatus: 'too_early',
      source: 'rules',
      action: { type: 'add_payment', label: 'Ouvrir facturation Meta' },
    });
    out.push({
      id: 'start-cold',
      priority: 'medium',
      title: 'Brouillon froid quiz (PAUSED · 0 €)',
      body: 'Prépare 3–6 créatives UGC / Reels (hooks différents) avant de scaler. Volume cible corpus : 2–4 concepts/sem, 20–40 variations/mois. Créative ≈ 56 % de la perf.',
      dataStatus: 'too_early',
      source: 'rules',
      action: { type: 'create_cold_draft', label: 'Créer / vérifier brouillon froid PAUSED' },
    });
  }

  if (topOrganic && topOrganic.score > 0) {
    out.push({
      id: `boost-${topOrganic.igMediaId}`,
      priority: 'medium',
      title: `Signal organique · score ${topOrganic.score.toFixed(0)} (à adapter)`,
      body: topOrganic.insightsAvailable
        ? `Angle qui a résonné : ${(topOrganic.caption ?? 'sans légende').slice(0, 120)}… Ce n’est PAS un ordre de booster tel quel — reformater en créative pub (15–30 s + CTA essai) via brouillon PAUSED.`
        : `Engagement de surface dispo. Adapter l’angle en pub (PAUSED), ne pas booster le post organique tel quel.`,
      dataStatus: topOrganic.insightsAvailable ? 'ok' : 'missing_permission',
      source: 'rules',
      action: {
        type: 'boost_organic',
        label: 'Adapter en pub (PAUSED)',
        igMediaId: topOrganic.igMediaId,
        captionHint: (topOrganic.caption ?? '').slice(0, 80),
      },
    });
  }

  const igCap = bundle.capabilities.find((c) => c.id === 'organic_media_insights');
  if (igCap && !igCap.accessible) {
    out.push({
      id: 'perm-ig-insights',
      priority: 'medium',
      title: 'Permission IG Insights manquante',
      body: `Pour reach, saves, vues, clics bio et vues profil : ajouter « ${igCap.missingPermission ?? 'instagram_manage_insights'} » au token Page / System User lié à @fit.mangas, puis resync.`,
      dataStatus: 'missing_permission',
      source: 'rules',
      action: { type: 'add_ig_insights_scope', label: 'Voir comment ajouter le scope' },
    });
  }

  for (const a of bundle.alerts.filter((x) => x.kind === 'fatigue' || x.kind === 'kill').slice(0, 3)) {
    out.push(alertToAdvice(a));
  }

  if (!out.length) {
    out.push({
      id: 'steady',
      priority: 'low',
      title: 'Données encore trop faibles pour scaler',
      body: 'Attends 48–72 h et 50–100 € de test avant kill/scale. Benchmark CPL froid FR ~4–18 €. Retarget = meilleur ROAS une fois le volume engagé.',
      dataStatus: hasSpend ? 'ok' : 'too_early',
      source: 'rules',
      action: null,
    });
  }

  return out.slice(0, 6);
}

function alertToAdvice(a: AdsAlert): CoachAdvice {
  return {
    id: `alert-${a.id}`,
    priority: a.severity === 'critical' ? 'high' : 'medium',
    title: a.title,
    body: a.detail,
    dataStatus: a.kind === 'data' ? 'too_early' : 'ok',
    source: 'rules',
    action:
      a.kind === 'fatigue' || a.kind === 'kill'
        ? {
            type: 'refresh_creative',
            label: 'Préparer brouillon créative refresh (PAUSED)',
            entityName: a.entityName,
          }
        : null,
  };
}

function summarizeBundleForAi(bundle: IntelligenceBundle): string {
  const spend = bundle.campaigns.reduce((s, c) => s + c.spendCents, 0);
  const leads = bundle.campaigns.reduce((s, c) => s + c.leads, 0);
  const top: OrganicMediaRow[] = bundle.organicMedia.slice(0, 5);
  return JSON.stringify(
    {
      lastSyncAt: bundle.lastSyncAt,
      spendEur: spend / 100,
      leads,
      campaigns: bundle.campaigns.slice(0, 8).map((c) => ({
        name: c.entityName,
        spendEur: c.spendCents / 100,
        leads: c.leads,
        cplEur: c.cplCents != null ? c.cplCents / 100 : null,
        frequency: c.frequency,
        ctr: c.ctr,
      })),
      temperature: bundle.temperatureCompare,
      alerts: bundle.alerts.slice(0, 5),
      organicTop: top.map((m) => ({
        id: m.igMediaId,
        score: m.score,
        boost: m.boostBadge,
        likes: m.likeCount,
        comments: m.commentsCount,
        reach: m.reach,
        caption: (m.caption ?? '').slice(0, 80),
      })),
      organicAccount: bundle.organicAccount
        ? {
            followers: bundle.organicAccount.followersCount,
            profileViews: bundle.organicAccount.profileViews,
            insightsAvailable: bundle.organicAccount.insightsAvailable,
          }
        : null,
      capabilities: bundle.capabilities.map((c) => ({
        id: c.id,
        ok: c.accessible,
        missing: c.missingPermission,
      })),
    },
    null,
    2,
  );
}

/**
 * Conseils = règles déterministes + (optionnel) reformulation IA bornée au corpus.
 * L’IA ne peut pas inventer de chiffres : on lui passe UNIQUEMENT le JSON réel.
 */
export async function generateCoachAdvice(
  bundle: IntelligenceBundle,
): Promise<{ advice: CoachAdvice[]; aiNote: string | null }> {
  const base = starterAdvice(bundle);
  const corpus = await loadExpertiseCorpus();
  const facts = summarizeBundleForAi(bundle);

  const cascade = await runSocialTextCascade({
    system: `Tu es le coach Ads FitMangas. Tu réponds en français, ton expert mais simple.
Tu es STRICTEMENT borné au corpus expertise (ADS_EXPERTISE + MARCHE_FEMMES) et aux FAITS JSON fournis.
INTERDIT : inventer impressions, spend, CPL, ROAS, followers.
Si une métrique manque → écris « trop tôt pour analyser ».
Organique = signal d'angle à adapter en créative pub, pas « booster tel quel ».
Chaque conseil = hypothèse à tester. Propose 2 à 4 conseils courts (titre + 1-2 phrases). Pas de markdown lourd.
Corpus:\n${corpus}`,
    user: `FAITS RÉELS (ne pas inventer hors de ce JSON) :\n${facts}\n\nRéponds en JSON array : [{"title":"...","body":"...","dataStatus":"ok|too_early|missing_permission"}]`,
    temperature: 0.3,
    maxOutputTokens: 900,
  });

  if (!cascade.ok) {
    return { advice: base, aiNote: cascade.detail ?? 'IA indisponible — conseils règles uniquement.' };
  }

  let parsed: Array<{ title?: string; body?: string; dataStatus?: string }> = [];
  try {
    const raw = cascade.text.trim();
    const start = raw.indexOf('[');
    const end = raw.lastIndexOf(']');
    if (start >= 0 && end > start) {
      parsed = JSON.parse(raw.slice(start, end + 1)) as typeof parsed;
    }
  } catch {
    return { advice: base, aiNote: 'Réponse IA non JSON — conseils règles conservés.' };
  }

  const aiAdvice: CoachAdvice[] = parsed.slice(0, 4).map((p, i) => ({
    id: `ai-${i}`,
    priority: i === 0 ? 'high' : 'medium',
    title: String(p.title ?? 'Conseil').slice(0, 120),
    body: String(p.body ?? '').slice(0, 500),
    dataStatus:
      p.dataStatus === 'ok' || p.dataStatus === 'missing_permission' || p.dataStatus === 'too_early'
        ? p.dataStatus
        : 'too_early',
    source: 'ai' as const,
    action: base[0]?.action ?? { type: 'sync_now' as const, label: 'Synchroniser' },
  }));

  // Merge : règles d’abord (actions fiables), puis IA sans doublon de titre
  const titles = new Set(base.map((b) => b.title.toLowerCase()));
  const merged = [...base];
  for (const a of aiAdvice) {
    if (titles.has(a.title.toLowerCase())) continue;
    merged.push(a);
  }
  return {
    advice: merged.slice(0, 8),
    aiNote: `Généré via ${cascade.provider}/${cascade.model} — borné au corpus + faits sync.`,
  };
}
