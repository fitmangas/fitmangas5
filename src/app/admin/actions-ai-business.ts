'use server';

import { GoogleGenAI } from '@google/genai';

import { getAdminKpiDrilldowns, getAdminKpis, stripeCollectedCurrentMonthEur } from '@/lib/admin/kpis';
import { requireAdmin } from '@/lib/auth/require-admin';
import {
  getConversionRate,
  getPageViews,
  getRealtimeUsers,
  getTopPages,
  getTrafficSources,
  getUsersByCountry,
} from '@/lib/google/analytics';
import { getCrawlErrors, getIndexingStatus, getSearchQueries, getSearchTopPages } from '@/lib/google/search-console';
import { hasGoogleServiceAccountJson } from '@/lib/google/service-account';
import { createAdminClient } from '@/lib/supabase/admin';

export type BusinessAdvisorSnapshot = {
  stripe: {
    mrrEur: number | null;
    mrrSource: string;
    activeSubscribers: number;
    churnRate30d: number | null;
    revenueMonthEur: number | null;
    newSubscribers30d: number | null;
    unsubscribed30d: number | null;
  };
  blog: {
    publishedCount: number;
    totalViews: number;
    avgViewsPerArticle: number;
    topArticles: Array<{ title: string; views: number; avgTimeSeconds: number }>;
    pendingValidation: number;
  };
  seo: {
    available: boolean;
    error?: string;
    topQueries: Array<{ query: string; clicks: number; impressions: number; ctr: number; position: number }>;
    topPages: Array<{ page: string; clicks: number; impressions: number }>;
    indexing: { indexedUrls: number | null; indexedUrlsLabel: string; indexedUrlsSource: string; submittedUrls: number } | null;
  };
  analytics: {
    available: boolean;
    error?: string;
    realtimeUsers: number | null;
    pageViewsTotal30d: number;
    topPages: Array<{ page: string; views: number }>;
    trafficSources: Array<{ name: string; value: number }>;
    countries: Array<{ label: string; users: number }>;
    conversionRatePercent: number | null;
  };
  clients: {
    totalMembers: number;
    health: {
      healthy: number;
      fragile: number;
      atRisk: number;
      newMembers: number;
      watch: number;
      incomplete: number;
    };
    occupancyPercent: number | null;
    replayCompletionRate30d: number | null;
    liveShowUpRate30d: number | null;
  };
  referral: {
    ambassadorsCount: number;
    totalReferrals: number;
    topAmbassadors: Array<{ name: string; count: number }>;
  };
  notifications: {
    last30d: { email: number; push: number; inApp: number; total: number };
  };
  support: { openTickets: number };
  boutique: { itemsSoldMonth: number; revenueMonthEur: number };
};

const BUSINESS_ADVISOR_PROMPT = `Tu es un consultant business pour une coach Pilates indépendante qui lance son activité en ligne. Analyse ses données et réponds avec EXACTEMENT ce format, rien d'autre :

## 5 actions prioritaires

| # | Action | Intérêt | Objectif |
|---|--------|---------|----------|
| 1 | [Étapes concrètes — voir règles ci-dessous] | [Pourquoi c'est important en 1 phrase] | [Résultat mesurable attendu] |
| 2 | ... | ... | ... |
| 3 | ... | ... | ... |
| 4 | ... | ... | ... |
| 5 | ... | ... | ... |

---

## Problèmes structurels détectés

Liste les incohérences ou problèmes techniques trouvés dans les données (max 3-4 bullet points, 1 ligne chacun).

---

IMPORTANT : la coach n'est PAS développeuse. Ne dis JAMAIS "résoudre un problème technique" sans détail. Pour chaque action (colonne Action), donne les étapes EXACTES qu'elle peut faire elle-même :
- Si une métrique vaut null, "Non disponible" ou source=unavailable, ne la transforme JAMAIS en 0 et ne conclus JAMAIS à un problème sur cette base.
- Pour l’indexation Google : URL Inspection = fiable ; search_analytics_estimate = estimation ; unavailable = aucune conclusion possible.
- Ne calcule JAMAIS un "taux d'indexation" en divisant indexedUrlsLabel par submittedUrls : indexedUrlsLabel peut être un échantillon URL Inspection, alors que submittedUrls est le total du sitemap.
- Quel site ouvrir (URL complète)
- Quel bouton cliquer
- Quoi écrire/publier
- Combien de temps ça prend (ex. "Temps : 15 min.")

Si l'action nécessite un développeur, commence la cellule Action par : "⚙️ Demande à ton développeur de..." suivi de l'instruction technique précise.

Exemples de BONNES actions (colonne Action) :
- "Publie un Reel Instagram de 30 secondes montrant un exercice de Pilates pour le dos. Utilise ton téléphone, filme en vertical. Ajoute #pilatesenligne #fitmangas. Temps : 15 min."
- "⚙️ Demande à ton développeur de soumettre le sitemap dans Google Search Console (search.google.com/search-console)."
- "Envoie un message WhatsApp à tes 3 abonnées actuelles pour leur demander un témoignage vidéo de 30 secondes. Temps : 20 min."

Exemples de MAUVAISES actions :
- "Résoudre le problème d'indexation SEO"
- "Mettre en place le suivi de conversion"
- "Clarifier l'incohérence des données"

Règles de concision : colonnes Intérêt et Objectif = 1 phrase max. Colonne Action = jusqu'à 3 phrases courtes avec étapes cliquables. Pas de paragraphes hors tableau.
Le site est fitmangas.com, offre principale Visio Collectif 39€/mois.
La coach est seule. Donne des chiffres concrets.`;

async function gatherBusinessAdvisorSnapshot(): Promise<BusinessAdvisorSnapshot> {
  const admin = createAdminClient();
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceIso = since.toISOString();
  const monthYear = `${since.getFullYear()}-${String(since.getMonth() + 1).padStart(2, '0')}`;

  const [
    kpis,
    revenueMonthEur,
    { count: publishedCount },
    { data: articlesRaw },
    { count: pendingValidation },
    { data: notificationRows },
    { count: openTickets },
    { data: referralRows },
    { data: latestBusiness },
    drilldowns,
  ] = await Promise.all([
    getAdminKpis(),
    stripeCollectedCurrentMonthEur(),
    admin.from('blog_articles').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    admin
      .from('blog_articles')
      .select('title_fr, view_count, average_time_spent_seconds')
      .eq('status', 'published')
      .order('view_count', { ascending: false })
      .limit(8),
    admin
      .from('admin_article_validations')
      .select('*', { count: 'exact', head: true })
      .eq('month_year', monthYear)
      .eq('status', 'pending'),
    admin.from('notification_log').select('channel').gte('created_at', sinceIso),
    admin.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    admin.from('referrals').select('referrer_user_id'),
    admin
      .from('business_stats_daily')
      .select('new_subscribers_30d, unsubscribed_30d')
      .order('stat_date', { ascending: false })
      .limit(1)
      .maybeSingle(),
    getAdminKpiDrilldowns(),
  ]);

  const articles = articlesRaw ?? [];
  const totalViews = articles.reduce((s, a) => s + (a.view_count ?? 0), 0);
  const publishedN = publishedCount ?? 0;

  const notif = { email: 0, push: 0, inApp: 0, total: 0 };
  for (const row of notificationRows ?? []) {
    const ch = row.channel ?? '';
    if (ch === 'email') notif.email += 1;
    else if (ch === 'push') notif.push += 1;
    else if (ch === 'in_app') notif.inApp += 1;
    notif.total += 1;
  }

  const refList = (referralRows ?? []) as { referrer_user_id: string }[];
  const countMap = new Map<string, number>();
  for (const r of refList) {
    countMap.set(r.referrer_user_id, (countMap.get(r.referrer_user_id) ?? 0) + 1);
  }
  const sortedReferrers = [...countMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const referrerIds = sortedReferrers.map(([id]) => id);
  const { data: referrerProfiles } = referrerIds.length
    ? await admin.from('profiles').select('id, first_name, last_name').in('id', referrerIds)
    : { data: [] as { id: string; first_name: string | null; last_name: string | null }[] };
  const nameById = new Map(
    (referrerProfiles ?? []).map((p) => [
      p.id,
      [p.first_name, p.last_name].filter(Boolean).join(' ') || '—',
    ]),
  );
  const topAmbassadors = sortedReferrers.map(([id, count]) => ({
    name: nameById.get(id) ?? '—',
    count,
  }));

  // Cohorte payante uniquement (hors « Pas finalisé »)
  const totalMembers =
    kpis.health.healthy +
    kpis.health.fragile +
    kpis.health.atRisk +
    kpis.health.newMembers +
    kpis.health.watch;

  let seo: BusinessAdvisorSnapshot['seo'] = {
    available: false,
    topQueries: [],
    topPages: [],
    indexing: null,
  };
  if (hasGoogleServiceAccountJson()) {
    try {
      const [queries, topPages, indexing] = await Promise.all([
        getSearchQueries(28, 15),
        getSearchTopPages(28, 10),
        getIndexingStatus(),
      ]);
      seo = {
        available: true,
        topQueries: [...queries].sort((a, b) => b.clicks - a.clicks).slice(0, 15),
        topPages: topPages.slice(0, 10),
        indexing: {
          indexedUrls: indexing.indexedUrls,
          indexedUrlsLabel: indexing.indexedUrlsLabel,
          indexedUrlsSource: indexing.indexedUrlsSource,
          submittedUrls: indexing.submittedUrls,
        },
      };
      await getCrawlErrors();
    } catch (e) {
      seo = {
        available: false,
        error: e instanceof Error ? e.message : 'Erreur Search Console',
        topQueries: [],
        topPages: [],
        indexing: null,
      };
    }
  } else {
    seo.error = 'Credentials Google non configurés';
  }

  let analytics: BusinessAdvisorSnapshot['analytics'] = {
    available: false,
    realtimeUsers: null,
    pageViewsTotal30d: 0,
    topPages: [],
    trafficSources: [],
    countries: [],
    conversionRatePercent: null,
  };
  if (hasGoogleServiceAccountJson()) {
    try {
      const [realtimeUsers, pageViews, topPages, trafficSources, countries, conversion] = await Promise.all([
        getRealtimeUsers(),
        getPageViews(30),
        getTopPages(30, 8),
        getTrafficSources(30),
        getUsersByCountry(30),
        getConversionRate(30),
      ]);
      analytics = {
        available: true,
        realtimeUsers,
        pageViewsTotal30d: pageViews.reduce((s, p) => s + p.views, 0),
        topPages: topPages.map((p) => ({ page: p.page, views: p.views })),
        trafficSources: trafficSources.map((s) => ({ name: s.name, value: s.value })),
        countries: countries.map((c) => ({ label: c.label, users: c.users })),
        conversionRatePercent: conversion.ratePercent,
      };
    } catch (e) {
      analytics = {
        ...analytics,
        error: e instanceof Error ? e.message : 'Erreur GA4',
      };
    }
  } else {
    analytics.error = 'Credentials Google non configurés';
  }

  return {
    stripe: {
      mrrEur: kpis.mrrEur,
      mrrSource: kpis.mrrSource,
      activeSubscribers: kpis.activeSubscribers,
      churnRate30d: kpis.churnRate30d,
      revenueMonthEur,
      newSubscribers30d: latestBusiness?.new_subscribers_30d != null ? Number(latestBusiness.new_subscribers_30d) : null,
      unsubscribed30d:
        latestBusiness?.unsubscribed_30d != null ? Number(latestBusiness.unsubscribed_30d) : null,
    },
    blog: {
      publishedCount: publishedN,
      totalViews,
      avgViewsPerArticle: publishedN > 0 ? Math.round(totalViews / publishedN) : 0,
      topArticles: articles.map((a) => ({
        title: a.title_fr ?? '—',
        views: a.view_count ?? 0,
        avgTimeSeconds: a.average_time_spent_seconds ?? 0,
      })),
      pendingValidation: pendingValidation ?? 0,
    },
    seo,
    analytics,
    clients: {
      totalMembers,
      health: kpis.health,
      occupancyPercent: kpis.occupancyPercent,
      replayCompletionRate30d: kpis.replayCompletionRate30d,
      liveShowUpRate30d: kpis.liveShowUpRate30d,
    },
    referral: {
      ambassadorsCount: countMap.size,
      totalReferrals: refList.length,
      topAmbassadors,
    },
    notifications: { last30d: notif },
    support: { openTickets: openTickets ?? 0 },
    boutique: {
      itemsSoldMonth: drilldowns.boutiqueItemsSold,
      revenueMonthEur: drilldowns.boutiqueRevenueEur,
    },
  };
}

export async function analyzeBusiness(): Promise<
  { ok: true; text: string; snapshot: BusinessAdvisorSnapshot } | { ok: false; error: string }
> {
  await requireAdmin();
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { ok: false, error: 'GEMINI_API_KEY manquant.' };

  const snapshot = await gatherBusinessAdvisorSnapshot();
  const model = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash';
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `${BUSINESS_ADVISOR_PROMPT}

Données actuelles du business FitMangas (JSON) :
${JSON.stringify(snapshot, null, 2)}`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { temperature: 0.5, maxOutputTokens: 6144 },
    });
    const text = (response.text ?? '').trim();
    if (!text) return { ok: false, error: 'Réponse vide de Gemini.' };
    return { ok: true, text, snapshot };
  } catch (e) {
    console.error('[analyzeBusiness]', e);
    return { ok: false, error: e instanceof Error ? e.message : 'Erreur Gemini.' };
  }
}
