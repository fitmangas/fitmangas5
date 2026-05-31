'use server';

import { GoogleGenAI } from '@google/genai';

import { getMarketingSettings } from '@/lib/admin/marketing-settings';
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

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://fitmangas.com').replace(/\/$/, '');

type ArticleSeoRow = {
  title_fr: string | null;
  description_fr: string | null;
  meta_description_fr: string | null;
  slug_fr: string | null;
  content_fr: string | null;
  featured_image_url: string | null;
  view_count: number | null;
  average_time_spent_seconds: number | null;
  average_scroll_percentage: number | null;
};

export type GlobalMarketingSnapshot = {
  seo: {
    sitemapUrl: string;
    robotsUrl: string;
    publishedCount: number;
    scheduledCount: number;
    allArticlesAbove80: boolean;
    articleScores: Array<{ title: string; score: number; failingChecks: string[] }>;
    metaPages: Array<{ path: string; title: string; description: string; complete: boolean }>;
    searchConsole: {
      available: boolean;
      error?: string;
      queries: Array<{ query: string; clicks: number; impressions: number; ctr: number; position: number }>;
      topPages: Array<{ page: string; clicks: number; impressions: number }>;
      indexing: { indexedUrls: number; submittedUrls: number; sitemapErrors: number; sitemapWarnings: number } | null;
      crawlErrors: Array<{ type: string; detail: string }>;
    };
  };
  analytics: {
    settings: { ga4Configured: boolean; ga4Id: string | null; metaPixelConfigured: boolean; metaPixelId: string | null };
    ga4: {
      available: boolean;
      error?: string;
      realtimeUsers: number | null;
      sessions30d: number;
      pageViews30d: Array<{ date: string; views: number }>;
      topPages: Array<{ page: string; views: number; avgTimeSeconds: number }>;
      trafficSources: Array<{ name: string; value: number }>;
      countries: Array<{ label: string; users: number }>;
      conversion: { ratePercent: number | null; sessions: number; keyEvents: number } | null;
    };
    blogTopArticles: Array<{ title: string; views: number; avgTimeSeconds: number; scrollPercent: number }>;
  };
  marketing: {
    newsletter: { total: number; confirmed: number; confirmationRatePercent: number };
    notifications30d: { email: number; push: number; inApp: number; total: number };
    referral: {
      ambassadorsCount: number;
      totalReferrals: number;
      topAmbassadors: Array<{ name: string; count: number }>;
    };
    checklist: {
      completed: Array<{ key: string; label: string; category: string }>;
      pending: Array<{ key: string; label: string; category: string }>;
    };
    social: { instagram: string | null; tiktok: string | null };
  };
};

const GLOBAL_MARKETING_PROMPT = `Tu es un consultant marketing senior pour FitMangas (coach Pilates / Barre en visio, site fitmangas.com, blog bilingue FR/ES).
Analyse l'ensemble des données SEO, Analytics et Marketing fournies et réponds UNIQUEMENT en markdown français avec EXACTEMENT cette structure :

## Diagnostic global — Santé marketing : X/10

2 à 4 phrases sur la santé globale du marketing du site (SEO, trafic, conversion, communication).

---

## 5 actions prioritaires cette semaine

| # | Action | Intérêt | Objectif |
|---|--------|---------|----------|
| 1 | [Étapes concrètes — voir règles ci-dessous] | [Pourquoi en 1 phrase] | [Résultat mesurable] |
| 2 | ... | ... | ... |
| 3 | ... | ... | ... |
| 4 | ... | ... | ... |
| 5 | ... | ... | ... |

---

## Problèmes structurels détectés

- Problème 1 (1 ligne)
- Problème 2 (1 ligne)
(max 4 bullet points)

---

## Actions concrètes (sans compétence technique)

Liste 3 à 5 actions que la coach peut faire elle-même cette semaine (Instagram, Search Console, contenu, newsletter, etc.) avec URLs, durées estimées et étapes cliquables.

---

Règles :
- La coach n'est PAS développeuse. Colonne Action = étapes exactes (site à ouvrir, bouton, texte à publier, durée).
- Si développeur requis : commencer par "⚙️ Demande à ton développeur de..."
- Ne suggère JAMAIS de réductions, promos ou mois gratuits (offre déjà à 39€/mois).
- Le site peut être en pré-lancement : ne critique pas un faible trafic de test.
- Colonnes Intérêt et Objectif = 1 phrase max. Pas d'intro ni conclusion hors sections.
- Ne mets JAMAIS la réponse dans un bloc code (\`\`\`) : le markdown doit être brut pour que les tableaux GFM soient rendus en HTML.`;

function scoreArticleSeo(article: ArticleSeoRow) {
  const title = article.title_fr ?? '';
  const description = article.meta_description_fr || article.description_fr || '';
  const slug = article.slug_fr ?? '';
  const content = article.content_fr || '';
  const wordCount = content.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  const checks = [
    { label: 'Titre < 60', ok: title.length > 0 && title.length < 60 },
    { label: 'Description < 160', ok: description.length > 0 && description.length < 160 },
    { label: 'Image', ok: Boolean(article.featured_image_url) },
    { label: 'Contenu > 300 mots', ok: wordCount > 300 },
    { label: 'Slug propre', ok: /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) },
  ];
  const score = Math.round((checks.filter((c) => c.ok).length / checks.length) * 100);
  return {
    title,
    score,
    failingChecks: checks.filter((c) => !c.ok).map((c) => c.label),
  };
}

function publicMetaPages() {
  return [
    { path: '/', title: 'FitMangas — Cours de Pilates & Barre en visio', description: 'Landing principale', complete: true },
    { path: '/blog', title: 'Blog Pilates FitMangas', description: 'Index blog', complete: true },
    { path: '/blog/[slug]', title: 'Meta dynamiques par article', description: 'OG + Twitter Card', complete: true },
    { path: '/privacy', title: 'Politique de confidentialité', description: 'Page légale', complete: true },
    { path: '/terms', title: 'Conditions générales', description: 'Page légale', complete: true },
  ];
}

async function gatherGlobalMarketingSnapshot(): Promise<GlobalMarketingSnapshot> {
  const admin = createAdminClient();
  const settings = await getMarketingSettings();
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceIso = since.toISOString();
  const nowIso = new Date().toISOString();

  const [
    { data: articlesRaw },
    { count: newsletterTotal },
    { count: newsletterConfirmed },
    { data: notificationRows },
    { data: checklistRaw },
    { data: referralRows },
    { data: scheduledRaw },
  ] = await Promise.all([
    admin
      .from('blog_articles')
      .select(
        'title_fr,description_fr,meta_description_fr,slug_fr,content_fr,featured_image_url,view_count,average_time_spent_seconds,average_scroll_percentage',
      )
      .eq('status', 'published')
      .order('view_count', { ascending: false }),
    admin.from('newsletter_subscriptions').select('*', { count: 'exact', head: true }).eq('unsubscribed', false),
    admin
      .from('newsletter_subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('unsubscribed', false)
      .eq('confirmed', true),
    admin.from('notification_log').select('channel').gte('created_at', sinceIso),
    admin.from('admin_marketing_checklist').select('key,label_fr,category,completed').order('category'),
    admin.from('referrals').select('referrer_user_id'),
    admin
      .from('blog_articles')
      .select('id')
      .gte('scheduled_publication_at', nowIso)
      .in('status', ['draft', 'validated']),
  ]);

  const articles = (articlesRaw ?? []) as ArticleSeoRow[];
  const seoScores = articles.map((a) => scoreArticleSeo(a));
  const allArticlesAbove80 = seoScores.length > 0 && seoScores.every((r) => r.score >= 80);

  let searchConsole: GlobalMarketingSnapshot['seo']['searchConsole'] = {
    available: false,
    queries: [],
    topPages: [],
    indexing: null,
    crawlErrors: [],
  };
  if (hasGoogleServiceAccountJson()) {
    try {
      const [queries, topPages, indexing, crawlErrors] = await Promise.all([
        getSearchQueries(28, 15),
        getSearchTopPages(28, 10),
        getIndexingStatus(),
        getCrawlErrors(),
      ]);
      searchConsole = {
        available: true,
        queries: [...queries].sort((a, b) => b.clicks - a.clicks).slice(0, 15),
        topPages: topPages.slice(0, 10),
        indexing: {
          indexedUrls: indexing.indexedUrls,
          submittedUrls: indexing.submittedUrls,
          sitemapErrors: indexing.sitemapErrors,
          sitemapWarnings: indexing.sitemapWarnings,
        },
        crawlErrors: crawlErrors.slice(0, 8),
      };
    } catch (e) {
      searchConsole = {
        available: false,
        error: e instanceof Error ? e.message : 'Erreur Search Console',
        queries: [],
        topPages: [],
        indexing: null,
        crawlErrors: [],
      };
    }
  } else {
    searchConsole.error = 'Credentials Google non configurés';
  }

  let ga4: GlobalMarketingSnapshot['analytics']['ga4'] = {
    available: false,
    realtimeUsers: null,
    sessions30d: 0,
    pageViews30d: [],
    topPages: [],
    trafficSources: [],
    countries: [],
    conversion: null,
  };
  if (hasGoogleServiceAccountJson()) {
    try {
      const [realtimeUsers, pageViews, topPages, trafficSources, countries, conversion] = await Promise.all([
        getRealtimeUsers(),
        getPageViews(30),
        getTopPages(30, 10),
        getTrafficSources(30),
        getUsersByCountry(30),
        getConversionRate(30),
      ]);
      ga4 = {
        available: true,
        realtimeUsers,
        sessions30d: conversion.sessions,
        pageViews30d: pageViews,
        topPages,
        trafficSources,
        countries,
        conversion,
      };
    } catch (e) {
      ga4 = { ...ga4, error: e instanceof Error ? e.message : 'Erreur GA4' };
    }
  } else {
    ga4.error = 'Credentials Google non configurés';
  }

  const notif = { email: 0, push: 0, inApp: 0, total: 0 };
  for (const row of notificationRows ?? []) {
    const ch = row.channel ?? '';
    if (ch === 'email') notif.email += 1;
    else if (ch === 'push') notif.push += 1;
    else notif.inApp += 1;
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
    ? await admin.from('profiles').select('id, first_name').in('id', referrerIds)
    : { data: [] as { id: string; first_name: string | null }[] };
  const nameById = new Map((referrerProfiles ?? []).map((p) => [p.id, p.first_name ?? '—']));
  const topAmbassadors = sortedReferrers.map(([id, count]) => ({
    name: nameById.get(id) ?? '—',
    count,
  }));

  const checklist = (checklistRaw ?? []) as Array<{ key: string; label_fr: string; category: string; completed: boolean }>;
  const checklistCompleted = checklist.filter((i) => i.completed).map(({ key, label_fr, category }) => ({ key, label: label_fr, category }));
  const checklistPending = checklist.filter((i) => !i.completed).map(({ key, label_fr, category }) => ({ key, label: label_fr, category }));

  const total = newsletterTotal ?? 0;
  const confirmed = newsletterConfirmed ?? 0;

  return {
    seo: {
      sitemapUrl: `${APP_URL}/sitemap.xml`,
      robotsUrl: `${APP_URL}/robots.txt`,
      publishedCount: articles.length,
      scheduledCount: scheduledRaw?.length ?? 0,
      allArticlesAbove80,
      articleScores: seoScores.map(({ title, score, failingChecks }) => ({ title, score, failingChecks })),
      metaPages: publicMetaPages(),
      searchConsole,
    },
    analytics: {
      settings: {
        ga4Configured: Boolean(settings.google_analytics_id),
        ga4Id: settings.google_analytics_id ?? null,
        metaPixelConfigured: Boolean(settings.meta_pixel_id),
        metaPixelId: settings.meta_pixel_id ?? null,
      },
      ga4,
      blogTopArticles: articles.slice(0, 10).map((a) => ({
        title: a.title_fr ?? '—',
        views: a.view_count ?? 0,
        avgTimeSeconds: a.average_time_spent_seconds ?? 0,
        scrollPercent: a.average_scroll_percentage ?? 0,
      })),
    },
    marketing: {
      newsletter: {
        total,
        confirmed,
        confirmationRatePercent: total ? Math.round((confirmed / total) * 100) : 0,
      },
      notifications30d: notif,
      referral: {
        ambassadorsCount: countMap.size,
        totalReferrals: refList.length,
        topAmbassadors,
      },
      checklist: { completed: checklistCompleted, pending: checklistPending },
      social: {
        instagram: settings.instagram_handle ?? null,
        tiktok: settings.tiktok_handle ?? null,
      },
    },
  };
}

export async function analyzeGlobalMarketingDiagnostic(): Promise<
  { ok: true; text: string; snapshot: GlobalMarketingSnapshot } | { ok: false; error: string }
> {
  await requireAdmin();
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { ok: false, error: 'GEMINI_API_KEY manquant.' };

  const snapshot = await gatherGlobalMarketingSnapshot();
  const model = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash';
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `${GLOBAL_MARKETING_PROMPT}

Données consolidées SEO + Analytics + Marketing (JSON) :
${JSON.stringify(snapshot, null, 2)}`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { temperature: 0.45, maxOutputTokens: 6144 },
    });
    const text = (response.text ?? '').trim();
    if (!text) return { ok: false, error: 'Réponse vide de Gemini.' };
    return { ok: true, text, snapshot };
  } catch (e) {
    console.error('[analyzeGlobalMarketingDiagnostic]', e);
    return { ok: false, error: e instanceof Error ? e.message : 'Erreur Gemini.' };
  }
}
