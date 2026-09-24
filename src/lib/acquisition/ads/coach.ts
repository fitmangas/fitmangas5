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
    const p = path.join(process.cwd(), 'docs', 'ADS_EXPERTISE.md');
    const text = await readFile(p, 'utf8');
    return text.slice(0, 12_000);
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
      title: `Meilleur contenu organique · score ${topOrganic.score.toFixed(0)}`,
      body: topOrganic.insightsAvailable
        ? `Candidat « à booster » : ${(topOrganic.caption ?? 'sans légende').slice(0, 120)}… Transformer en pub = brouillon PAUSED (zéro €).`
        : `Engagement de surface (likes/comments) disponible. Reach/saves/shares incomplets tant que le scope instagram_manage_insights n’est pas ajouté. Tu peux quand même créer un brouillon PAUSED.`,
      dataStatus: topOrganic.insightsAvailable ? 'ok' : 'missing_permission',
      source: 'rules',
      action: {
        type: 'boost_organic',
        label: 'Transformer en pub (PAUSED)',
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

PLACEHOLDER_REST
