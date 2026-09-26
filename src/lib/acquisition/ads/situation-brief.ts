/**
 * Lecture de situation (cockpit Exécution) — Claude en primaire via la cascade texte.
 * Borné à docs/ADS_EXPERTISE.md + docs/MARCHE_FEMMES.md + faits synchronisés.
 * Si l’IA échoue : lecture déterministe, marquée comme telle (jamais silencieux).
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { createAdminClient } from '@/lib/supabase/admin';
import { runSocialTextCascade } from '@/lib/admin/social-text-ai';
import type { ActionPlanItem } from './action-plan';
import type { IntelligenceBundle } from './intelligence-repository';
import { MARCHE_MARKETS, MARCHE_POSITIONING, MARCHE_PUB_CONCLUSION } from './marche-content';
import { demoShare, summarizeOrganicPeriod } from './stats-compute';

export const ADS_SITUATION_SETTING_KEY = 'ads_situation_brief_v1';

export type SituationBrief = {
  whereYouAre: string;
  marketSays: string;
  priority: string;
  source: 'ai' | 'rules';
  provider: string | null;
  note: string | null;
  updatedAt: string;
};

async function loadCorpus(): Promise<string> {
  const parts: string[] = [];
  for (const name of ['ADS_EXPERTISE.md', 'MARCHE_FEMMES.md']) {
    try {
      const text = await readFile(path.join(process.cwd(), 'docs', name), 'utf8');
      parts.push(`## ${name}\n${text.slice(0, 7_000)}`);
    } catch {
      parts.push(`## ${name}\n(indisponible)`);
    }
  }
  return parts.join('\n\n');
}

function fmtPct(n: number | null): string {
  return n == null ? 'n/d' : `${n >= 0 ? '+' : ''}${n.toFixed(0)} %`;
}

export function buildSituationFacts(bundle: IntelligenceBundle, plan: ActionPlanItem[]) {
  const p28 = summarizeOrganicPeriod(bundle.organicDaily, 28);
  const gender = demoShare(bundle.demographics.gender);
  const country = demoShare(bundle.demographics.country);
  const age = demoShare(bundle.demographics.age);
  const spend = bundle.adsTotals.spendCents;
  return {
    followers: bundle.organicAccount?.followersCount ?? null,
    organic28d: {
      views: p28.totals.views,
      viewsDelta: p28.deltaPct.views,
      reachSum: p28.totals.reach,
      reachDelta: p28.deltaPct.reach,
      interactions: p28.totals.totalInteractions,
      profileViews: p28.totals.profileViews,
      linkTaps: p28.totals.profileLinksTaps,
      websiteClicks: p28.totals.websiteClicks,
      follows: p28.totals.follows,
      unfollows: p28.totals.unfollows,
      netFollowers: p28.netFollowers,
    },
    audience: {
      women: gender.find((g) => g.key === 'F')?.pct ?? null,
      topAges: age
        .slice()
        .sort((a, b) => b.value - a.value)
        .slice(0, 3)
        .map((a) => `${a.key} ${a.pct.toFixed(0)} %`),
      france: country.find((c) => c.key === 'FR')?.pct ?? null,
      mexico: country.find((c) => c.key === 'MX')?.pct ?? null,
      topCountries: country.slice(0, 4).map((c) => `${c.key} ${c.pct.toFixed(0)} %`),
    },
    topPosts: bundle.organicMedia.slice(0, 3).map((m) => ({
      caption: (m.caption ?? '').slice(0, 70),
      reach: m.reach,
      saved: m.saved,
      shares: m.shares,
    })),
    ads30d: {
      spendEur: spend / 100,
      leads: bundle.adsTotals.leads,
      cplEur: bundle.adsTotals.cplCents != null ? bundle.adsTotals.cplCents / 100 : null,
      ctr: bundle.adsTotals.ctr,
      frequency: bundle.adsTotals.frequency,
      newPaidSubs30d: bundle.newPaidSubs30d,
    },
    alerts: bundle.alerts.map((a) => a.title),
    planTop: plan.slice(0, 3).map((i) => i.title),
  };
}

export function buildDeterministicBrief(
  bundle: IntelligenceBundle,
  plan: ActionPlanItem[],
  note: string | null,
): SituationBrief {
  const f = buildSituationFacts(bundle, plan);
  const o = f.organic28d;
  const where = [
    f.followers != null ? `${f.followers.toLocaleString('fr-FR')} abonnés.` : null,
    o.views != null
      ? `28 derniers jours : ${o.views.toLocaleString('fr-FR')} vues (${fmtPct(o.viewsDelta)} vs 28 j précédents)`
      : 'Pas encore de série organique 28 j.',
    o.netFollowers != null ? `, solde abonnés ${o.netFollowers >= 0 ? '+' : ''}${o.netFollowers}.` : '.',
    f.ads30d.spendEur === 0
      ? ' Pub : 0 € dépensé — aucun chiffre de conversion payante à juger pour l’instant.'
      : ` Pub : ${f.ads30d.spendEur.toFixed(0)} € dépensés, ${f.ads30d.leads} leads.`,
  ]
    .filter(Boolean)
    .join('');
  const aud =
    f.audience.women != null
      ? `Ton audience actuelle : ${f.audience.women.toFixed(0)} % de femmes, âges dominants ${f.audience.topAges.join(', ')}, pays ${f.audience.topCountries.join(', ')}.`
      : 'Démographie non synchronisée.';
  const market = `${aud} Le marché dit : ${MARCHE_POSITIONING.rule} ${MARCHE_PUB_CONCLUSION[1]}`;
  const priority =
    bundle.alerts.find((a) => a.kind === 'kill' || a.kind === 'fatigue')?.title ??
    (f.planTop[0] ? `Produire la créative « ${f.planTop[0]} » puis tester en froid FR.` : 'Synchroniser puis régénérer le plan.');
  return {
    whereYouAre: where,
    marketSays: market,
    priority,
    source: 'rules',
    provider: null,
    note,
    updatedAt: new Date().toISOString(),
  };
}

export async function generateSituationBrief(
  bundle: IntelligenceBundle,
  plan: ActionPlanItem[],
): Promise<SituationBrief> {
  const facts = buildSituationFacts(bundle, plan);
  const corpus = await loadCorpus();
  const markets = MARCHE_MARKETS.map((m) => `${m.label}: ${m.anglesPriority.join(' / ')}`).join('\n');

  const cascade = await runSocialTextCascade({
    system: `Tu es la stratège acquisition de FitMangas (Pilates & Barre en visio, coach Alejandra, FR primaire / MX secondaire).
Tu écris à Kevin, qui n'est pas marketeur : français simple, phrases courtes, concret, tutoiement.
STRICTEMENT borné au corpus ci-dessous et aux FAITS JSON. INTERDIT d'inventer un chiffre.
Si une donnée vaut null ou 0 € de dépense : dis-le honnêtement (« pas encore mesurable »).
La cliente paie pour ne pas être seule (cours collectifs à horaires fixes + correction en direct + être vue). Ne jamais écrire « Mangitas ».
Marchés :\n${markets}\n\nCorpus:\n${corpus}`,
    user: `FAITS:\n${JSON.stringify(facts)}

Réponds UNIQUEMENT en JSON :
{"whereYouAre":"2-3 phrases : où en est le compte (chiffres réels cités)","marketSays":"2-3 phrases : ce que dit le marché, croisé avec l'audience réelle","priority":"1 phrase : LA priorité de la semaine"}`,
    temperature: 0.3,
    maxOutputTokens: 700,
  });

  if (!cascade.ok) {
    return buildDeterministicBrief(bundle, plan, `IA indisponible (${cascade.detail}) — lecture automatique à partir des chiffres.`);
  }
  try {
    const raw = cascade.text.trim();
    const parsed = JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1)) as Record<string, unknown>;
    const pick = (k: string) => String(parsed[k] ?? '').trim().slice(0, 700);
    if (!pick('whereYouAre') || !pick('priority')) throw new Error('champs manquants');
    return {
      whereYouAre: pick('whereYouAre'),
      marketSays: pick('marketSays'),
      priority: pick('priority'),
      source: 'ai',
      provider: `${cascade.provider}/${cascade.model}`,
      note: null,
      updatedAt: new Date().toISOString(),
    };
  } catch (e) {
    return buildDeterministicBrief(
      bundle,
      plan,
      `Réponse IA illisible (${e instanceof Error ? e.message : 'JSON'}) — lecture automatique à partir des chiffres.`,
    );
  }
}

export async function loadStoredSituationBrief(): Promise<SituationBrief | null> {
  try {
    const admin = createAdminClient();
    const { data } = await admin.from('admin_settings').select('value').eq('key', ADS_SITUATION_SETTING_KEY).maybeSingle();
    if (!data?.value) return null;
    return JSON.parse(String(data.value)) as SituationBrief;
  } catch {
    return null;
  }
}

export async function regenerateAndPersistSituationBrief(
  bundle: IntelligenceBundle,
  plan: ActionPlanItem[],
): Promise<SituationBrief> {
  const brief = await generateSituationBrief(bundle, plan);
  const admin = createAdminClient();
  await admin
    .from('admin_settings')
    .upsert({ key: ADS_SITUATION_SETTING_KEY, value: JSON.stringify(brief) }, { onConflict: 'key' });
  return brief;
}
