'use server';

import { GoogleGenAI } from '@google/genai';

import { requireAdmin } from '@/lib/auth/require-admin';

export type SeoAdvisorInput = {
  articleScores: Array<{
    title: string;
    score: number;
    checks: Array<{ label: string; ok: boolean }>;
  }>;
  metaPages: Array<{ path: string; title: string; description: string; complete: boolean }>;
  publishedCount: number;
  scheduledCount: number;
  searchConsole: {
    available: boolean;
    error?: string;
    queries?: Array<{ query: string; clicks: number; impressions: number; ctr: number; position: number }>;
    topPages?: Array<{ page: string; clicks: number; impressions: number }>;
    indexing?: {
      indexedUrls: number | null;
      indexedUrlsLabel: string;
      indexedUrlsSource: string;
      searchAnalyticsUrlsWithImpressions: number;
      submittedUrls: number;
      sitemapErrors: number;
      sitemapWarnings: number;
    };
    crawlErrors?: Array<{ type: string; detail: string }>;
  };
};

export type TrafficAdvisorInput = {
  realtimeUsers: number | null;
  gaAvailable: boolean;
  gaError?: string;
  pageViews: Array<{ date: string; views: number }>;
  topPages: Array<{ page: string; views: number; avgTimeSeconds: number }>;
  trafficSources: Array<{ name: string; value: number }>;
  countries: Array<{ label: string; users: number }>;
  conversion: { ratePercent: number | null; sessions: number; keyEvents: number } | null;
  blogTopArticles: Array<{
    title: string;
    views: number;
    avgTimeSeconds: number;
    scrollPercent: number;
  }>;
};

export type MarketingAdvisorInput = {
  business: {
    mrr: number;
    activeSubscribers: number;
    churn30d: number;
    newSubscribers30d: number;
    unsubscribed30d: number;
  } | null;
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
};

const ADVISOR_TONE = `Tu es un consultant marketing bienveillant qui conseille une coach Pilates qui lance son activité en ligne. Le site n'est pas encore lancé. Sois encourageant sur ce qui est déjà en place, et donne des conseils actionnables et réalistes pour une personne seule (pas une équipe marketing). Ne suggère jamais de réductions ou promotions.`;

const RESPONSE_FORMAT = `Tu DOIS répondre UNIQUEMENT en markdown français, avec une casse normale (jamais tout en majuscules), en respectant EXACTEMENT cette structure (mêmes titres, emojis et puces) :

## Diagnostic global — Score : X/10

### ✅ Ce qui va bien
- Point positif 1
- Point positif 2

### ❌ Problèmes identifiés
- Problème 1
- Problème 2

### 🎯 Actions prioritaires
1. **[Priorité haute]** Action 1
   → Détail concret de ce qu'il faut faire
2. **[Priorité haute]** Action 2
   → Détail concret
3. **[Priorité moyenne]** Action 3
   → Détail concret

Règles : 3 à 5 actions numérotées ; pas d'introduction ni de conclusion hors sections ; pas de texte avant ## Diagnostic global.`;

async function runGeminiAdvisor(
  systemRole: string,
  contextBlock: string,
  dataJson: string,
): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  await requireAdmin();
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { ok: false, error: 'GEMINI_API_KEY manquant.' };

  const model = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash';
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `${systemRole}

${ADVISOR_TONE}

${contextBlock}

Données actuelles (JSON) :
${dataJson}

${RESPONSE_FORMAT}`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { temperature: 0.45, maxOutputTokens: 4096 },
    });
    const text = (response.text ?? '').trim();
    if (!text) return { ok: false, error: 'Réponse vide de Gemini.' };
    return { ok: true, text };
  } catch (e) {
    console.error('[runGeminiAdvisor]', e);
    return { ok: false, error: e instanceof Error ? e.message : 'Erreur Gemini.' };
  }
}

const SEO_CONTEXT = `CONTEXTE : Le sitemap est actif et soumis à Google. Le robots.txt est configuré. Google Search Console est connecté. Le site vient d'être créé et n'a pas encore été lancé publiquement.
RÈGLE CRITIQUE : si une métrique vaut null, \"Non disponible\" ou source=unavailable, tu ne dois PAS conclure qu'elle vaut zéro. Tu dois dire que la donnée est indisponible. Pour l’indexation, privilégie indexedUrlsLabel + indexedUrlsSource : URL Inspection = fiable ; search_analytics_estimate = estimation honnête ; unavailable = aucune conclusion.`;

const ANALYTICS_CONTEXT = `CONTEXTE : Google Analytics GA4 est actif et collecte des données. Le Meta Pixel est installé. Le site n'est pas encore lancé publiquement, donc le trafic actuel est uniquement du trafic de test/développement. Ne critique pas le faible trafic.`;

const MARKETING_CONTEXT = `CONTEXTE : Le site n'est pas encore lancé publiquement. Les abonnées actuelles sont des comptes de test. Le programme de parrainage est en place mais ne donne PAS de réduction ni d'avantage (l'offre à 39€/mois est déjà basse). Ne suggère JAMAIS de réductions ou mois gratuits. Le Pixel Meta et Google Analytics SONT installés et actifs.`;

export async function analyzeSEO(data: SeoAdvisorInput) {
  return runGeminiAdvisor(
    `Tu es consultant SEO senior pour FitMangas (pilates / barre en visio, blog bilingue FR/ES).
Analyse le référencement technique et éditorial à partir des scores articles, meta pages publiques, volumes de publication et données Search Console si présentes.
Mets en avant : articles sous 80 %, meta > 160 car., mots-clés GSC exploitables, indexation, erreurs crawl, rythme de publication.`,
    SEO_CONTEXT,
    JSON.stringify(data, null, 2),
  );
}

export async function analyzeTraffic(data: TrafficAdvisorInput) {
  return runGeminiAdvisor(
    `Tu es analyste web pour FitMangas (site Next.js, blog, espace compte, abonnements).
Analyse le trafic GA4 (temps réel, tendance 30j, sources, pays FR/MX/autres, conversion) et le trafic blog interne.
Compare pages fortes vs faibles (vues, temps moyen). Signale hausse/baisse si visible sur la série journalière.`,
    ANALYTICS_CONTEXT,
    JSON.stringify(data, null, 2),
  );
}

export async function analyzeMarketing(data: MarketingAdvisorInput) {
  return runGeminiAdvisor(
    `Tu es directrice marketing pour FitMangas (abonnements, newsletter, notifications, parrainage, checklist lancement).
Priorise les canaux à activer (SEO déjà en cours, social, ads, communauté) selon les KPI réels et items checklist non cochés.
Sois concrète : lead magnets, campagnes, parrainage, confirmation newsletter.`,
    MARKETING_CONTEXT,
    JSON.stringify(data, null, 2),
  );
}
