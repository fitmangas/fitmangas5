import Link from 'next/link';
import { BarChart3, CheckCircle2, Circle, Rocket, Search, TrendingUp } from 'lucide-react';

import { BusinessCharts, NotificationChart, type BusinessStatsPoint, type NotificationPoint } from '@/components/Admin/MarketingCharts';
import { MarketingGlobalAiAdvisor } from '@/components/Admin/marketing/MarketingGlobalAiAdvisor';
import { MarketingAiAdvisor } from '@/components/Admin/marketing/MarketingAiAdvisor';
import { MarketingAnalyticsLive } from '@/components/Admin/marketing/MarketingAnalyticsLive';
import { MarketingEditorialCalendarSection } from '@/components/Admin/marketing/MarketingEditorialCalendarSection';
import { MarketingSearchConsoleLive } from '@/components/Admin/marketing/MarketingSearchConsoleLive';
import { getMarketingSettings } from '@/lib/admin/marketing-settings';
import { requireAdmin } from '@/lib/auth/require-admin';
import { getClientLang } from '@/lib/compte/i18n';
import { getConversionRate, getPageViews, getUsersByCountry } from '@/lib/google/analytics';
import { getIndexingStatus, getSearchOverview, getSearchQueries, getSearchTopPages } from '@/lib/google/search-console';
import { hasGoogleServiceAccountJson } from '@/lib/google/service-account';
import { SEO_PILLAR_PAGES } from '@/lib/seo-pillar-pages';
import { createAdminClient } from '@/lib/supabase/admin';

import { saveMarketingSettings, toggleMarketingChecklist } from './actions';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://fitmangas.com';

type ArticleSeoRow = {
  id: string;
  title_fr: string;
  title_es: string | null;
  slug_fr: string;
  slug_es: string | null;
  description_fr: string | null;
  description_es: string | null;
  meta_description_fr: string | null;
  meta_description_es: string | null;
  content_fr: string | null;
  content_es: string | null;
  featured_image_url: string | null;
  published_at: string | null;
  view_count: number | null;
  average_time_spent_seconds: number | null;
  average_scroll_percentage: number | null;
  average_rating: number | null;
  rating_count: number | null;
};

type ChecklistRow = {
  key: string;
  label_fr: string;
  label_es: string;
  completed: boolean;
  category: 'seo' | 'social' | 'ads' | 'community';
  sort_order: number;
};

type DynamicChecklistRow = ChecklistRow & {
  effectiveCompleted: boolean;
  auto: boolean;
  source: string;
};

type KpiTone = 'good' | 'watch' | 'bad' | 'neutral';

const fallbackChecklist: ChecklistRow[] = [
  ['search_console_connected', 'Google Search Console connecté', 'Google Search Console conectado', 'seo', 10],
  ['google_analytics_configured', 'Google Analytics configuré', 'Google Analytics configurado', 'seo', 20],
  ['sitemap_submitted', 'Sitemap soumis à Google', 'Sitemap enviado a Google', 'seo', 30],
  ['seo_scores_above_80', 'Tous les articles ont un score SEO > 80%', 'Todos los artículos tienen un score SEO > 80%', 'seo', 40],
  ['instagram_linked', 'Compte Instagram lié', 'Cuenta Instagram vinculada', 'social', 10],
  ['tiktok_linked', 'Compte TikTok lié', 'Cuenta TikTok vinculada', 'social', 20],
  ['first_instagram_post', 'Première publication Instagram faite', 'Primera publicación de Instagram hecha', 'social', 30],
  ['three_reels_month', '3 reels publiés ce mois', '3 reels publicados este mes', 'social', 40],
  ['meta_ads_created', 'Compte Meta Ads créé', 'Cuenta Meta Ads creada', 'ads', 10],
  ['first_instagram_campaign', 'Première campagne Instagram lancée', 'Primera campaña de Instagram lanzada', 'ads', 20],
  ['meta_pixel_installed', 'Pixel Meta installé sur le site', 'Pixel Meta instalado en el sitio', 'ads', 30],
  ['ten_clients_registered', '10 clientes inscrites', '10 clientas inscritas', 'community', 10],
  ['first_video_testimonial', 'Premier témoignage vidéo collecté', 'Primer testimonio en video recogido', 'community', 20],
  ['referral_program_launched', 'Programme de parrainage lancé', 'Programa de referidos lanzado', 'community', 30],
  ['whatsapp_group_created', 'Groupe WhatsApp créé', 'Grupo WhatsApp creado', 'community', 40],
].map(([key, label_fr, label_es, category, sort_order]) => ({
  key: String(key),
  label_fr: String(label_fr),
  label_es: String(label_es),
  category: category as ChecklistRow['category'],
  sort_order: Number(sort_order),
  completed: false,
}));

export default async function AdminMarketingPage() {
  const { user, supabase } = await requireAdmin();
  const lang = await getClientLang(supabase, user.id);
  const t = copy[lang === 'es' ? 'es' : 'fr'];
  const admin = createAdminClient();
  const settings = await getMarketingSettings();
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceIso = since.toISOString();

  const [
    { data: businessRows },
    { data: articlesRaw },
    { count: newsletterTotal },
    { count: newsletterConfirmed },
    { data: notificationRows },
    { data: checklistRaw },
    { count: memberCount },
    { data: subscriptionRows },
  ] = await Promise.all([
    admin.from('business_stats_daily').select('*').order('stat_date', { ascending: true }).limit(30),
    admin
      .from('blog_articles')
      .select(
        'id,title_fr,title_es,slug_fr,slug_es,description_fr,description_es,meta_description_fr,meta_description_es,content_fr,content_es,featured_image_url,published_at,view_count,average_time_spent_seconds,average_scroll_percentage,average_rating,rating_count',
      )
      .eq('status', 'published')
      .order('view_count', { ascending: false }),
    admin.from('newsletter_subscriptions').select('*', { count: 'exact', head: true }).eq('unsubscribed', false),
    admin
      .from('newsletter_subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('unsubscribed', false)
      .eq('confirmed', true),
    admin.from('notification_log').select('channel,created_at').gte('created_at', sinceIso),
    admin.from('admin_marketing_checklist').select('key,label_fr,label_es,completed,category,sort_order').order('category').order('sort_order'),
    admin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'member').eq('archived', false),
    admin
      .from('subscriptions')
      .select('status, price_cents, ends_at, stripe_subscription_id')
      .like('stripe_subscription_id', 'sub_%'),
  ]);

  const articles = (articlesRaw ?? []) as ArticleSeoRow[];
  const seoRows = articles.map((article) => scoreArticleSeo(article));
  const allSeoAbove80 = seoRows.length > 0 && seoRows.every((row) => row.score >= 80);
  const businessData = ((businessRows ?? []) as Record<string, string | number>[]).map<BusinessStatsPoint>((row) => ({
    date: String(row.stat_date).slice(5),
    mrr: Number(row.mrr_eur ?? 0),
    activeSubscribers: Number(row.active_subscribers ?? 0),
    newSubscribers: Number(row.new_subscribers_30d ?? 0),
    unsubscribed: Number(row.unsubscribed_30d ?? 0),
    churn: Number(row.churn_rate_30d ?? 0),
    liveShowUp: Number(row.live_show_up_rate_30d ?? 0),
    replayCompletion: Number(row.replay_completion_rate_30d ?? 0),
  }));
  const notificationData = aggregateNotifications((notificationRows ?? []) as Array<{ channel: string | null; created_at: string }>);
  const checklist = ((checklistRaw?.length ? checklistRaw : fallbackChecklist) ?? []) as ChecklistRow[];
  const confirmedRate = newsletterTotal ? Math.round(((newsletterConfirmed ?? 0) / newsletterTotal) * 100) : 0;
  const topArticles = articles.slice(0, 10);
  const seoPages = publicSeoPages(t);
  const googleApisConnected = hasGoogleServiceAccountJson();
  const googleSetupDocLabel = 'docs/google-cloud-setup.md';
  const subscriptionStats = summarizeSubscriptions(
    (subscriptionRows ?? []) as Array<{ status: string | null; price_cents: number | null; ends_at: string | null; stripe_subscription_id: string | null }>,
  );
  const liveBusinessData =
    businessData.length > 0
      ? businessData.map((row, index) =>
          index === businessData.length - 1
            ? { ...row, mrr: subscriptionStats.mrrEur, activeSubscribers: subscriptionStats.activeSubscribers }
            : row,
        )
      : [
          {
            date: new Date().toISOString().slice(5, 10),
            mrr: subscriptionStats.mrrEur,
            activeSubscribers: subscriptionStats.activeSubscribers,
            newSubscribers: 0,
            unsubscribed: 0,
            churn: 0,
            liveShowUp: 0,
            replayCompletion: 0,
          },
        ];

  const searchConsoleSummaryPromise = googleApisConnected
    ? fetchSearchConsoleSummary()
    : Promise.resolve({
        available: false,
        error: 'Credentials Google non configurés',
        overview: null,
        queries: [],
        topPages: [],
        indexing: null,
      });
  const gaSummaryPromise = googleApisConnected
    ? fetchGaSummary()
    : Promise.resolve({
        available: false,
        error: 'Credentials Google non configurés',
        users30d: null,
        pageViews30d: null,
        keyEvents30d: null,
        conversionRatePercent: null,
      });

  const nowIsoMarketing = new Date().toISOString();
  const [
    searchConsoleSummary,
    gaSummary,
    { data: scheduledRaw },
    { data: suggestionsRaw },
    { data: referralRows },
  ] = await Promise.all([
    searchConsoleSummaryPromise,
    gaSummaryPromise,
    admin
      .from('blog_articles')
      .select('id, title_fr, scheduled_publication_at, status')
      .gte('scheduled_publication_at', nowIsoMarketing)
      .in('status', ['draft', 'validated'])
      .order('scheduled_publication_at', { ascending: true })
      .limit(8),
    admin
      .from('marketing_editorial_suggestions')
      .select('id, suggestion_fr, suggestion_es, topics_hint, created_at')
      .order('created_at', { ascending: false })
      .limit(12),
    admin.from('referrals').select('referrer_user_id'),
  ]);
  const refList = (referralRows ?? []) as { referrer_user_id: string }[];
  const countMap = new Map<string, number>();
  for (const r of refList) {
    countMap.set(r.referrer_user_id, (countMap.get(r.referrer_user_id) ?? 0) + 1);
  }
  const sortedReferrers = [...countMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20);
  const referrerIds = sortedReferrers.map(([id]) => id);
  const { data: referrerProfiles } = referrerIds.length
    ? await admin.from('profiles').select('id, first_name').in('id', referrerIds)
    : { data: [] as { id: string; first_name: string | null }[] };
  const nameById = new Map((referrerProfiles ?? []).map((p) => [p.id, p.first_name ?? '—']));
  const referralLeaderboard = sortedReferrers.map(([id, count]) => ({
    id,
    count,
    name: nameById.get(id) ?? '—',
  }));

  const scheduledCount = (scheduledRaw ?? []).length;
  const latestBusiness = businessData.length > 0 ? businessData[businessData.length - 1] : null;
  const notificationTotals = notificationData.reduce(
    (acc, row) => ({
      email: acc.email + row.email,
      push: acc.push + row.push,
      inApp: acc.inApp + row.inApp,
    }),
    { email: 0, push: 0, inApp: 0 },
  );
  const dynamicChecklist = buildDynamicChecklist(checklist, {
    allSeoAbove80,
    googleApisConnected,
    searchConsoleSummary,
    gaSummary,
    settings,
    publishedCount: articles.length,
    memberCount: memberCount ?? 0,
  });
  const dynamicChecklistForAdvisor = dynamicChecklist.map((item) => ({
    key: item.key,
    label: lang === 'es' ? item.label_es : item.label_fr,
    category: item.category,
    completed: item.effectiveCompleted,
  }));
  const kpiCards = buildMarketingKpis({
    articlesPublished: articles.length,
    searchConsoleSummary,
    gaSummary,
    subscriptionStats,
  });
  const seoExcellencePlan = buildSeoExcellencePlan({
    articlesPublished: articles.length,
    searchConsoleSummary,
    gaSummary,
    subscriptionStats,
  });

  return (
    <main className="mx-auto max-w-[1280px] space-y-8 px-2 pb-20 pt-3 md:px-6 md:pt-6">
      <header className="rounded-[2rem] border border-white/65 bg-white/60 p-5 shadow-[0_18px_42px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-7">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-luxury-soft">
              <Rocket size={14} /> SEO & Marketing
            </p>
            <h1 className="hero-signature-title mt-2 text-4xl text-luxury-ink md:text-6xl">{t.title}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-luxury-muted">{t.intro}</p>
          </div>
          <nav className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.14em]">
            <a className="rounded-full bg-luxury-ink px-4 py-2 text-white" href="#seo">{t.tabs.seo}</a>
            <a className="rounded-full bg-white/65 px-4 py-2 text-luxury-muted" href="#analytics">{t.tabs.analytics}</a>
            <a className="rounded-full bg-white/65 px-4 py-2 text-luxury-muted" href="#marketing">{t.tabs.marketing}</a>
          </nav>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {kpiCards.map((card) => (
          <KpiSummaryCard key={card.label} {...card} />
        ))}
      </section>

      <SeoExcellencePlanCard plan={seoExcellencePlan} />

      <MarketingGlobalAiAdvisor />

      <section id="seo" className="space-y-5 scroll-mt-28 md:scroll-mt-8">
        <SectionTitle icon={<Search size={18} />} eyebrow={t.tabs.seo} title={t.seoTitle} />
        <MarketingAiAdvisor
          variant="seo"
          googleConnected={googleApisConnected}
          articleScores={seoRows.map((row) => ({
            title: row.title,
            score: row.score,
            checks: row.checks,
          }))}
          metaPages={seoPages}
          publishedCount={articles.length}
          scheduledCount={scheduledCount}
        />
        <div className="grid gap-4 lg:grid-cols-3">
          <StatusCard title="Sitemap" ok value="Sitemap actif" href={`${APP_URL}/sitemap.xml`} />
          <StatusCard title="Robots.txt" ok value="Robots.txt actif" href={`${APP_URL}/robots.txt`} />
          <StatusCard title="Score SEO" ok={allSeoAbove80} value={allSeoAbove80 ? t.seoScoreOk : t.seoScoreTodo} />
        </div>

        <div className="grid gap-5 xl:grid-cols-[1fr_1.1fr]">
          <Panel title={t.metaTags}>
            <div className="space-y-3">
              {seoPages.map((page) => (
                <div key={page.path} className="rounded-2xl border border-white/55 bg-white/55 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-luxury-ink">{page.path}</p>
                      <p className="mt-1 text-sm text-luxury-muted">{page.title}</p>
                      <p className="mt-1 text-xs text-luxury-muted">{page.description}</p>
                    </div>
                    {page.complete ? <CheckCircle2 className="text-emerald-600" size={20} /> : <Circle className="text-red-500" size={20} />}
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title={t.articleScores}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="text-[10px] uppercase tracking-[0.14em] text-luxury-soft">
                  <tr>
                    <th className="px-3 py-2">{t.article}</th>
                    <th className="px-3 py-2">Score</th>
                    <th className="px-3 py-2">{t.checks}</th>
                  </tr>
                </thead>
                <tbody>
                  {seoRows.map((row) => (
                    <tr key={row.id} className="border-t border-white/50">
                      <td className="px-3 py-3 font-medium text-luxury-ink">{row.title}</td>
                      <td className="px-3 py-3">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${row.score >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800'}`}>
                          {row.score}%
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs text-luxury-muted">{row.checks.map((check) => `${check.ok ? '✅' : '❌'} ${check.label}`).join(' · ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        <Panel title={t.gscLiveTitle}>
          <MarketingSearchConsoleLive docFileLabel={googleSetupDocLabel} connected={googleApisConnected} />
        </Panel>
      </section>

      <section id="analytics" className="space-y-5 scroll-mt-28 md:scroll-mt-8">
        <SectionTitle icon={<TrendingUp size={18} />} eyebrow={t.tabs.analytics} title={t.analyticsTitle} />
        <MarketingAiAdvisor
          variant="traffic"
          googleConnected={googleApisConnected}
          blogTopArticles={topArticles.map((article) => ({
            title: article.title_fr,
            views: article.view_count ?? 0,
            avgTimeSeconds: article.average_time_spent_seconds ?? 0,
            scrollPercent: article.average_scroll_percentage ?? 0,
          }))}
        />
        <div className="grid gap-4 md:grid-cols-3">
          <StatusCard
            title="Google Analytics"
            ok={Boolean(settings.google_analytics_id) && gaSummary.available}
            value={
              gaSummary.available
                ? t.active
                : settings.google_analytics_id
                  ? 'ID installé, API GA4 indisponible'
                  : t.notConfigured
            }
          />
          <StatusCard
            title="Google Search Console"
            ok={searchConsoleSummary.available}
            value={searchConsoleSummary.available ? t.searchConsoleDnsStatus : 'API indisponible'}
          />
          <StatusCard
            title="Meta Pixel"
            ok={Boolean(settings.meta_pixel_id)}
            value={settings.meta_pixel_id ? 'Installé sur pages publiques' : t.notConfigured}
          />
        </div>

        <Panel title={t.gaLiveTitle}>
          <MarketingAnalyticsLive docFileLabel={googleSetupDocLabel} connected={googleApisConnected} />
        </Panel>

        <form action={saveMarketingSettings} className="grid gap-4 rounded-[2rem] border border-white/65 bg-white/60 p-5 shadow-[0_18px_42px_rgba(15,23,42,0.08)] backdrop-blur-xl md:grid-cols-2 xl:grid-cols-4">
          <Field label="GA4 Measurement ID" name="google_analytics_id" defaultValue={settings.google_analytics_id} placeholder="G-XXXXXXXXXX" />
          <Field label="Meta Pixel ID" name="meta_pixel_id" defaultValue={settings.meta_pixel_id} placeholder="1234567890" />
          <Field label="Instagram" name="instagram_handle" defaultValue={settings.instagram_handle} placeholder="@fitmangas" />
          <Field label="TikTok" name="tiktok_handle" defaultValue={settings.tiktok_handle} placeholder="@fitmangas" />
          <div className="md:col-span-2 xl:col-span-4">
            <button className="btn-luxury-primary min-h-[44px] px-5 text-xs" type="submit">{t.saveSettings}</button>
          </div>
        </form>

        <div className="rounded-[2rem] border border-white/65 bg-white/60 p-5 shadow-[0_18px_42px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <h3 className="text-lg font-semibold text-luxury-ink">{t.searchConsoleTitle}</h3>
          <p className="mt-3 text-sm leading-6 text-luxury-muted">{t.searchConsoleNote}</p>
        </div>

        <BusinessCharts data={liveBusinessData} />
        <Panel title={t.blogTraffic}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="text-[10px] uppercase tracking-[0.14em] text-luxury-soft">
                <tr>
                  <th className="px-3 py-2">{t.article}</th>
                  <th className="px-3 py-2">{t.views}</th>
                  <th className="px-3 py-2">{t.avgTime}</th>
                  <th className="px-3 py-2">{t.scroll}</th>
                  <th className="px-3 py-2">{t.rating}</th>
                </tr>
              </thead>
              <tbody>
                {topArticles.map((article) => (
                  <tr key={article.id} className="border-t border-white/50">
                    <td className="px-3 py-3">
                      <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                        <Link className="font-medium text-luxury-ink underline-offset-2 hover:underline" href={`/admin/blog/articles/${article.id}/stats`}>
                          {article.title_fr}
                        </Link>
                        <Link className="text-xs font-semibold text-orange-700 underline-offset-2 hover:underline" href={`/admin/blog/articles/${article.id}/edit`}>
                          {t.editArticle}
                        </Link>
                      </div>
                    </td>
                    <td className="px-3 py-3">{article.view_count ?? 0}</td>
                    <td className="px-3 py-3">{formatSeconds(article.average_time_spent_seconds ?? 0)}</td>
                    <td className="px-3 py-3">{article.average_scroll_percentage ?? 0}%</td>
                    <td className="px-3 py-3">{article.average_rating ? `${Number(article.average_rating).toFixed(1)} / 5` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title={t.editorialTitle}>
          <MarketingEditorialCalendarSection
            scheduled={(scheduledRaw ?? []) as Array<{ id: string; title_fr: string; scheduled_publication_at: string; status: string }>}
            suggestions={(suggestionsRaw ?? []) as Array<{ id: string; suggestion_fr: string; suggestion_es: string | null; topics_hint: string | null; created_at: string }>}
          />
        </Panel>
      </section>

      <section id="marketing" className="space-y-5 scroll-mt-28 md:scroll-mt-8">
        <SectionTitle icon={<BarChart3 size={18} />} eyebrow={t.tabs.marketing} title={t.marketingTitle} />
        <MarketingAiAdvisor
          variant="marketing"
          marketingInput={{
            business: latestBusiness
              ? {
                  mrr: subscriptionStats.mrrEur,
                  activeSubscribers: subscriptionStats.activeSubscribers,
                  churn30d: latestBusiness.churn,
                  newSubscribers30d: latestBusiness.newSubscribers,
                  unsubscribed30d: latestBusiness.unsubscribed,
                }
              : null,
            newsletter: {
              total: newsletterTotal ?? 0,
              confirmed: newsletterConfirmed ?? 0,
              confirmationRatePercent: confirmedRate,
            },
            notifications30d: {
              email: notificationTotals.email,
              push: notificationTotals.push,
              inApp: notificationTotals.inApp,
              total: notificationTotals.email + notificationTotals.push + notificationTotals.inApp,
            },
            referral: {
              ambassadorsCount: referralLeaderboard.length,
              totalReferrals: refList.length,
              topAmbassadors: referralLeaderboard.slice(0, 5).map((r) => ({ name: r.name, count: r.count })),
            },
            checklist: {
              completed: dynamicChecklistForAdvisor.filter((i) => i.completed).map(({ key, label, category }) => ({ key, label, category })),
              pending: dynamicChecklistForAdvisor.filter((i) => !i.completed).map(({ key, label, category }) => ({ key, label, category })),
            },
          }}
        />
        <div className="grid gap-4 md:grid-cols-3">
          <Kpi label={t.newsletterSubscribers} value={String(newsletterTotal ?? 0)} />
          <Kpi label={t.newsletterConfirmed} value={String(newsletterConfirmed ?? 0)} />
          <Kpi label={t.confirmationRate} value={`${confirmedRate}%`} />
        </div>
        <NotificationChart data={notificationData} />

        <div className="grid gap-5 lg:grid-cols-2">
          <Panel title={t.metaAdsTitle}>
            <p className="text-sm leading-6 text-luxury-muted">{t.metaAdsHelp}</p>
            <a
              href="https://adsmanager.facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex min-h-[44px] items-center text-sm font-semibold text-orange-800 underline underline-offset-2"
            >
              {t.metaAdsLink} →
            </a>
          </Panel>
          <Panel title={t.googleAdsTitle}>
            <p className="text-sm leading-6 text-luxury-muted">{t.googleAdsHelp}</p>
            <a
              href="https://ads.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex min-h-[44px] items-center text-sm font-semibold text-orange-800 underline underline-offset-2"
            >
              {t.googleAdsLink} →
            </a>
          </Panel>
        </div>

        <Panel title={t.referralLeaderTitle}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[400px] text-left text-sm">
              <thead className="text-[10px] uppercase tracking-[0.14em] text-luxury-soft">
                <tr>
                  <th className="px-3 py-2">{t.referralAmbassador}</th>
                  <th className="px-3 py-2">{t.referralCount}</th>
                </tr>
              </thead>
              <tbody>
                {referralLeaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-3 py-4 text-luxury-muted">
                      {t.referralEmpty}
                    </td>
                  </tr>
                ) : (
                  referralLeaderboard.map((row) => (
                    <tr key={row.id} className="border-t border-white/50">
                      <td className="px-3 py-3 font-medium text-luxury-ink">{row.name}</td>
                      <td className="px-3 py-3">{row.count}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title={t.checklistTitle}>
          <div className="grid gap-4 lg:grid-cols-4">
            {(['seo', 'social', 'ads', 'community'] as const).map((category) => (
              <div key={category} className="rounded-2xl border border-white/55 bg-white/50 p-4">
                <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-luxury-ink">{t.categories[category]}</h3>
                <div className="space-y-2">
                  {dynamicChecklist
                    .filter((item) => item.category === category)
                    .sort((a, b) => a.sort_order - b.sort_order)
                    .map((item) => {
                      const content = (
                        <>
                          {item.effectiveCompleted ? (
                            <CheckCircle2 className="mt-0.5 shrink-0 text-[#C45D3E]" size={17} />
                          ) : (
                            <Circle className="mt-0.5 shrink-0 text-luxury-soft" size={17} />
                          )}
                          <span className="min-w-0">
                            <span className="block">{lang === 'es' ? item.label_es : item.label_fr}</span>
                            <span className="mt-0.5 block text-[11px] leading-4 text-luxury-muted/75">
                              {item.auto ? `Auto : ${item.source}` : `Manuel : ${item.source}`}
                            </span>
                          </span>
                        </>
                      );
                      if (item.auto) {
                        return (
                          <div key={item.key} className="flex w-full items-start gap-2 rounded-xl px-2 py-2 text-left text-sm text-luxury-muted">
                            {content}
                          </div>
                        );
                      }
                      return (
                        <form key={item.key} action={toggleMarketingChecklist}>
                          <input type="hidden" name="key" value={item.key} />
                          <input type="hidden" name="completed" value={String(!item.completed)} />
                          <button type="submit" className="flex w-full items-start gap-2 rounded-xl px-2 py-2 text-left text-sm text-luxury-muted transition hover:bg-white/70">
                            {content}
                          </button>
                        </form>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </section>
    </main>
  );
}

type SearchConsoleSummary = {
  available: boolean;
  error?: string;
  overview: Awaited<ReturnType<typeof getSearchOverview>> | null;
  queries: Array<{ query: string; clicks: number; impressions: number; ctr: number; position: number }>;
  topPages: Array<{ page: string; clicks: number; impressions: number }>;
  indexing: Awaited<ReturnType<typeof getIndexingStatus>> | null;
};

type GaSummary = {
  available: boolean;
  error?: string;
  users30d: number | null;
  pageViews30d: number | null;
  keyEvents30d: number | null;
  conversionRatePercent: number | null;
};

type SubscriptionStats = {
  activeSubscribers: number;
  failedPayments: number;
  mrrEur: number;
};

async function fetchSearchConsoleSummary(): Promise<SearchConsoleSummary> {
  try {
    const [overview, queries, topPages, indexing] = await Promise.all([
      getSearchOverview(28),
      getSearchQueries(28, 50),
      getSearchTopPages(28, 50),
      getIndexingStatus(),
    ]);
    return { available: true, overview, queries, topPages, indexing };
  } catch (e) {
    return {
      available: false,
      error: e instanceof Error ? e.message : 'Erreur Search Console',
      overview: null,
      queries: [],
      topPages: [],
      indexing: null,
    };
  }
}

async function fetchGaSummary(): Promise<GaSummary> {
  try {
    const [pageViews, countries, conversion] = await Promise.all([
      getPageViews(30),
      getUsersByCountry(30),
      getConversionRate(30),
    ]);
    return {
      available: true,
      users30d: countries.reduce((sum, row) => sum + row.users, 0),
      pageViews30d: pageViews.reduce((sum, row) => sum + row.views, 0),
      keyEvents30d: conversion.keyEvents,
      conversionRatePercent: conversion.ratePercent,
    };
  } catch (e) {
    return {
      available: false,
      error: e instanceof Error ? e.message : 'Erreur GA4',
      users30d: null,
      pageViews30d: null,
      keyEvents30d: null,
      conversionRatePercent: null,
    };
  }
}

function summarizeSubscriptions(
  rows: Array<{ status: string | null; price_cents: number | null; ends_at: string | null; stripe_subscription_id: string | null }>,
): SubscriptionStats {
  let activeSubscribers = 0;
  let failedPayments = 0;
  let mrrCents = 0;
  const now = Date.now();

  for (const row of rows) {
    if (!row.stripe_subscription_id?.startsWith('sub_')) continue;
    const status = (row.status ?? '').toLowerCase();
    const hasAccess = !row.ends_at || new Date(row.ends_at).getTime() > now;
    if ((status === 'active' || status === 'trialing') && hasAccess) {
      activeSubscribers += 1;
      mrrCents += row.price_cents ?? 0;
    }
    if (status === 'past_due' || status === 'unpaid') failedPayments += 1;
  }

  return { activeSubscribers, failedPayments, mrrEur: Math.round(mrrCents / 100) };
}

function buildDynamicChecklist(
  checklist: ChecklistRow[],
  context: {
    allSeoAbove80: boolean;
    googleApisConnected: boolean;
    searchConsoleSummary: SearchConsoleSummary;
    gaSummary: GaSummary;
    settings: Awaited<ReturnType<typeof getMarketingSettings>>;
    publishedCount: number;
    memberCount: number;
  },
): DynamicChecklistRow[] {
  return checklist.map((item) => {
    const manual = (source: string): DynamicChecklistRow => ({
      ...item,
      effectiveCompleted: item.completed,
      auto: false,
      source,
    });
    const auto = (completed: boolean, source: string): DynamicChecklistRow => ({
      ...item,
      effectiveCompleted: completed,
      auto: true,
      source,
    });

    switch (item.key) {
      case 'search_console_connected':
        return auto(context.searchConsoleSummary.available, context.searchConsoleSummary.available ? 'API Search Console répond' : context.searchConsoleSummary.error ?? 'API indisponible');
      case 'google_analytics_configured':
        return auto(
          Boolean(context.settings.google_analytics_id) && context.gaSummary.available,
          context.gaSummary.available ? 'GA4 API remonte des données' : context.gaSummary.error ?? 'GA4 API indisponible',
        );
      case 'sitemap_submitted':
        return auto(
          (context.searchConsoleSummary.indexing?.submittedUrls ?? 0) > 0,
          `${context.searchConsoleSummary.indexing?.submittedUrls ?? 0} URL soumises dans le sitemap`,
        );
      case 'seo_scores_above_80':
        return auto(context.allSeoAbove80, `${context.publishedCount} articles publiés contrôlés`);
      case 'instagram_linked':
        return auto(Boolean(context.settings.instagram_handle), context.settings.instagram_handle ? String(context.settings.instagram_handle) : 'Handle Instagram absent');
      case 'tiktok_linked':
        return auto(Boolean(context.settings.tiktok_handle), context.settings.tiktok_handle ? String(context.settings.tiktok_handle) : 'Handle TikTok absent');
      case 'meta_pixel_installed':
        return auto(Boolean(context.settings.meta_pixel_id), context.settings.meta_pixel_id ? 'ID Pixel configuré et script injecté sur les pages publiques' : 'ID Pixel absent');
      case 'ten_clients_registered':
        return auto(context.memberCount >= 10, `${context.memberCount} clientes non archivées`);
      default:
        return manual('action humaine hors plateforme, à cocher manuellement');
    }
  });
}

function buildMarketingKpis({
  articlesPublished,
  searchConsoleSummary,
  gaSummary,
  subscriptionStats,
}: {
  articlesPublished: number;
  searchConsoleSummary: SearchConsoleSummary;
  gaSummary: GaSummary;
  subscriptionStats: SubscriptionStats;
}) {
  const searchClicks =
    searchConsoleSummary.overview?.clicks ?? searchConsoleSummary.topPages.reduce((sum, row) => sum + row.clicks, 0);
  const searchImpressions =
    searchConsoleSummary.overview?.impressions ??
    searchConsoleSummary.topPages.reduce((sum, row) => sum + row.impressions, 0);
  const avgPosition = searchConsoleSummary.overview?.position ?? null;
  const indexing = searchConsoleSummary.indexing;

  return [
    {
      label: 'Indexation',
      value: indexing?.indexedUrlsLabel ?? 'Non disponible',
      detail: indexing
        ? `${indexing.searchAnalyticsUrlsWithImpressions} URLs avec impressions Search`
        : searchConsoleSummary.error ?? 'Search Console indisponible',
      info:
        'Nombre de pages que Google a réellement enregistrées dans son index. Une page non indexée est invisible dans les résultats de recherche : elle ne peut générer aucune visite, quelle que soit sa qualité.',
      tone: indexing?.indexedUrlsSource === 'url_inspection' ? 'good' : indexing?.indexedUrlsSource === 'search_analytics_estimate' ? 'watch' : 'neutral',
    },
    {
      label: 'Clics Search 28j',
      value: formatCompact(searchClicks),
      detail: 'Search Console live',
      info:
        "Nombre de visiteurs venus depuis Google sur les 28 derniers jours. C'est le résultat concret du SEO : le trafic gratuit et régulier qui ne dépend d'aucune publicité.",
      tone: searchClicks > 0 ? 'good' : 'watch',
    },
    {
      label: 'Impressions 28j',
      value: formatCompact(searchImpressions),
      detail: 'Search Console live',
      info:
        "Nombre de fois où le site est apparu dans les résultats Google, même sans clic. Mesure la visibilité : beaucoup d'impressions mais peu de clics = les titres et descriptions ne donnent pas envie de cliquer.",
      tone: searchImpressions > 0 ? 'good' : 'watch',
    },
    {
      label: 'Position moyenne',
      value: avgPosition == null ? 'Non disponible' : avgPosition.toFixed(1),
      detail: avgPosition == null ? 'donnée Search Console absente' : 'Search Console global 28j',
      info:
        "Position moyenne dans les résultats Google. Environ 98% des clics se font sur la 1re page (positions 1 à 10). Au-delà de 20, le site est en page 3 ou plus : quasi invisible, d'où très peu de clics malgré les impressions.",
      tone: avgPosition == null ? 'neutral' : avgPosition <= 10 ? 'good' : avgPosition <= 30 ? 'watch' : 'bad',
    },
    {
      label: 'Articles publiés',
      value: String(articlesPublished),
      detail: "status='published' uniquement",
      info:
        "Nombre d'articles de blog en ligne. Chaque article est une porte d'entrée supplémentaire vers le site depuis Google, sur un mot-clé différent. Plus il y a de contenu de qualité, plus la surface de captation augmente.",
      tone: articlesPublished >= 20 ? 'good' : 'watch',
    },
    {
      label: 'Visiteurs GA4 30j',
      value: gaSummary.users30d == null ? 'Non disponible' : formatCompact(gaSummary.users30d),
      detail: gaSummary.available ? `${formatCompact(gaSummary.pageViews30d ?? 0)} pages vues` : gaSummary.error ?? 'GA4 indisponible',
      info:
        "Nombre de personnes uniques venues sur le site sur 30 jours, toutes sources confondues (Google, Instagram, direct, etc.). C'est le haut de l'entonnoir : sans visiteurs, pas d'inscriptions.",
      tone: gaSummary.available ? 'good' : 'neutral',
    },
    {
      label: 'Conversions GA4',
      value: gaSummary.keyEvents30d == null ? 'Non disponible' : formatCompact(gaSummary.keyEvents30d),
      detail: gaSummary.conversionRatePercent == null ? 'taux non disponible' : `${gaSummary.conversionRatePercent}% key events / sessions`,
      info:
        "Nombre d'actions clés réalisées par les visiteurs (inscription, clic sur On démarre, etc.). Sans conversions configurées dans GA4, impossible de savoir ce qui transforme un visiteur en cliente : on pilote à l'aveugle.",
      tone: gaSummary.available ? 'watch' : 'neutral',
    },
    {
      label: 'Abonnés actifs',
      value: String(subscriptionStats.activeSubscribers),
      detail: `MRR calculé : ${subscriptionStats.mrrEur} €`,
      info:
        "Nombre de clientes avec un abonnement Stripe actif ou en essai. C'est le KPI de survie de la plateforme : tout le reste (trafic, SEO, contenu) n'existe que pour faire monter ce chiffre.",
      tone: subscriptionStats.activeSubscribers > 0 ? 'good' : 'watch',
    },
    {
      label: 'Paiements échoués',
      value: String(subscriptionStats.failedPayments),
      detail: 'past_due / unpaid synchronisés',
      info:
        "Clientes dont le prélèvement a échoué (carte refusée, expirée). Ce sont des abonnées qui VEULENT payer mais dont le paiement bloque : chaque ligne ici est du chiffre d'affaires récupérable en un simple message. À traiter en priorité.",
      tone: subscriptionStats.failedPayments > 0 ? 'bad' : 'good',
    },
  ] satisfies Array<{ label: string; value: string; detail: string; info: string; tone: KpiTone }>;
}

type SeoExcellencePlan = {
  score: number;
  level: string;
  summary: string;
  milestones: Array<{ label: string; current: string; target: string; done: boolean; tone: KpiTone }>;
  pillars: Array<{ title: string; goal: string; actions: string[] }>;
};

function buildSeoExcellencePlan({
  articlesPublished,
  searchConsoleSummary,
  gaSummary,
  subscriptionStats,
}: {
  articlesPublished: number;
  searchConsoleSummary: SearchConsoleSummary;
  gaSummary: GaSummary;
  subscriptionStats: SubscriptionStats;
}): SeoExcellencePlan {
  const overview = searchConsoleSummary.overview;
  const avgPosition = overview?.position ?? null;
  const impressions = overview?.impressions ?? 0;
  const clicks = overview?.clicks ?? 0;
  const keyEvents = gaSummary.keyEvents30d ?? 0;
  const completedChecks = [
    articlesPublished >= 40,
    articlesPublished >= 80,
    impressions >= 500,
    clicks >= 50,
    avgPosition != null && avgPosition <= 10,
    keyEvents > 0,
    subscriptionStats.activeSubscribers >= 10,
    subscriptionStats.failedPayments === 0,
  ].filter(Boolean).length;
  const score = Math.round((completedChecks / 8) * 100);

  const level =
    score >= 80
      ? 'Excellence en approche'
      : score >= 55
        ? 'Accélération'
        : score >= 30
          ? 'Fondations solides'
          : 'Démarrage SEO';

  return {
    score,
    level,
    summary:
      "Objectif réaliste : devenir une référence sur les requêtes longues autour du Pilates en ligne avant de viser les mots ultra concurrentiels comme \"Pilates\" seul.",
    milestones: [
      {
        label: 'Bibliothèque éditoriale',
        current: `${articlesPublished} articles`,
        target: '60 à 100 articles experts',
        done: articlesPublished >= 60,
        tone: articlesPublished >= 60 ? 'good' : articlesPublished >= 30 ? 'watch' : 'bad',
      },
      {
        label: 'Visibilité Google',
        current: `${formatCompact(impressions)} impressions / 28j`,
        target: '500+ impressions / 28j',
        done: impressions >= 500,
        tone: impressions >= 500 ? 'good' : impressions > 0 ? 'watch' : 'bad',
      },
      {
        label: 'Trafic SEO',
        current: `${formatCompact(clicks)} clics / 28j`,
        target: '50+ clics / 28j',
        done: clicks >= 50,
        tone: clicks >= 50 ? 'good' : clicks > 0 ? 'watch' : 'bad',
      },
      {
        label: 'Position moyenne',
        current: avgPosition == null ? 'Non disponible' : avgPosition.toFixed(1),
        target: 'Top 10 stable',
        done: avgPosition != null && avgPosition <= 10,
        tone: avgPosition == null ? 'neutral' : avgPosition <= 10 ? 'good' : avgPosition <= 30 ? 'watch' : 'bad',
      },
      {
        label: 'Conversions mesurées',
        current: `${formatCompact(keyEvents)} key events GA4`,
        target: 'Inscription + abonnement suivis',
        done: keyEvents > 0,
        tone: keyEvents > 0 ? 'good' : 'watch',
      },
    ],
    pillars: [
      {
        title: '1. Pages piliers',
        goal: 'Les 3 pages existent déjà : les renforcer et les faire indexer.',
        actions: [
          'Demander l’indexation GSC de /pilates-en-ligne, /cours-pilates-visio et /pilates-debutant-maison.',
          'Partager chaque page pilier sur Instagram / Stories avec un lien clair.',
          'Relier chaque page pilier à 8-12 articles du blog (maillage interne).',
          'Suivre impressions + clics de ces 3 URLs dans Search Console chaque mois.',
        ],
      },
      {
        title: '2. Doubler puis tripler le contenu',
        goal: 'Couvrir toutes les recherches longues avant les mots génériques.',
        actions: [
          'Passer de 21 à 60 articles de qualité, puis viser 100.',
          'Faire des séries : respiration, posture, dos, débutant, barre, mobilité, ventre plat sans promesse médicale.',
          'Mettre à jour chaque mois les articles qui ont des impressions mais peu de clics.',
        ],
      },
      {
        title: '3. Autorité externe',
        goal: 'Google doit voir que d’autres sites fiables parlent de FitMangas.',
        actions: [
          'Obtenir des liens depuis partenaires bien-être, studios, annuaires locaux qualitatifs et articles invités.',
          'Publier des contenus invités sur Pilates, posture, visio et routine maison.',
          'Transformer Instagram/YouTube/Pinterest en portes d’entrée vers les pages piliers.',
        ],
      },
      {
        title: '4. Conversion et preuve',
        goal: 'Transformer le trafic en clientes, pas seulement faire des vues.',
        actions: [
          'Configurer les conversions GA4 : inscription, clic “On démarre”, checkout, abonnement.',
          'Ajouter FAQ, avis clientes, bénéfices concrets et captures de l’expérience visio.',
          'Tester Google Ads sur les mots-clés qui convertissent, sans croire que payer améliore le SEO naturel.',
        ],
      },
      {
        title: '5. Routine mensuelle',
        goal: 'Gagner par régularité, pas par action unique.',
        actions: [
          'Chaque mois : analyser Search Console, améliorer 5 articles, publier 4 nouveaux contenus.',
          'Demander l’indexation des pages importantes après gros changements.',
          'Suivre les requêtes où FitMangas est positions 11-30 : ce sont les victoires les plus proches.',
        ],
      },
    ],
  };
}

function SeoExcellencePlanCard({ plan }: { plan: SeoExcellencePlan }) {
  return (
    <section className="rounded-[2rem] border border-[#C45D3E]/20 bg-[#fffaf5]/90 p-5 shadow-[0_18px_42px_rgba(120,80,20,0.08)] backdrop-blur-xl md:p-6">
      <div className="grid gap-5 lg:grid-cols-[0.85fr_1.4fr]">
        <div className="rounded-[1.6rem] border border-white/70 bg-white/70 p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-luxury-soft">Objectif SEO excellence</p>
          <div className="mt-4 flex items-end gap-3">
            <p className="text-5xl font-semibold leading-none text-luxury-ink">{plan.score}%</p>
            <p className="pb-1 text-sm font-semibold text-[#C45D3E]">{plan.level}</p>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-brand-sand/70">
            <div className="h-full rounded-full bg-[#C45D3E]" style={{ width: `${plan.score}%` }} />
          </div>
          <p className="mt-4 text-sm leading-6 text-luxury-muted">{plan.summary}</p>
          <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-950">
            Payer peut aider à tester et vendre plus vite via Google Ads, mais ne fait pas monter directement le SEO naturel.
            Pour “top partout”, il faut surtout contenu + pages piliers + liens externes + patience.
          </p>
        </div>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {plan.milestones.map((item) => (
              <div key={item.label} className="rounded-[1.35rem] border border-white/70 bg-white/65 p-4">
                <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-luxury-soft">{item.label}</p>
                <p className="mt-2 text-lg font-semibold text-luxury-ink">{item.current}</p>
                <p className="mt-1 text-xs leading-5 text-luxury-muted">Cible : {item.target}</p>
                <span className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${item.done ? 'bg-white text-luxury-ink ring-1 ring-[#C45D3E]/20' : item.tone === 'bad' ? 'bg-[#f4d4c8] text-[#7a2e1a]' : 'bg-amber-100 text-amber-950'}`}>
                  {item.done ? '✅ Atteint' : item.tone === 'bad' ? '🔴 À construire' : '⚠️ En cours'}
                </span>
              </div>
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {plan.pillars.map((pillar) => (
              <article key={pillar.title} className="rounded-[1.35rem] border border-white/70 bg-white/65 p-4">
                <h3 className="text-sm font-semibold text-luxury-ink">{pillar.title}</h3>
                <p className="mt-2 text-xs leading-5 text-luxury-muted">{pillar.goal}</p>
                <ul className="mt-3 space-y-2 text-xs leading-5 text-luxury-muted">
                  {pillar.actions.map((action) => (
                    <li key={action}>• {action}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function formatCompact(value: number): string {
  return new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

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
  const score = Math.round((checks.filter((check) => check.ok).length / checks.length) * 100);
  return { id: article.id, title, score, checks };
}

function aggregateNotifications(rows: Array<{ channel: string | null; created_at: string }>): NotificationPoint[] {
  const map = new Map<string, NotificationPoint>();
  for (let i = 29; i >= 0; i -= 1) {
    const day = new Date();
    day.setDate(day.getDate() - i);
    const key = day.toISOString().slice(0, 10);
    map.set(key, { date: key.slice(5), email: 0, push: 0, inApp: 0 });
  }
  rows.forEach((row) => {
    const key = new Date(row.created_at).toISOString().slice(0, 10);
    const item = map.get(key);
    if (!item) return;
    if (row.channel === 'email') item.email += 1;
    else if (row.channel === 'push') item.push += 1;
    else item.inApp += 1;
  });
  return Array.from(map.values());
}

function formatSeconds(seconds: number) {
  if (!seconds) return '—';
  const minutes = Math.round(seconds / 60);
  return `${minutes} min`;
}

function publicSeoPages(t: (typeof copy)['fr']) {
  return [
    {
      path: '/',
      title: 'FitMangas — Cours de Pilates & Barre en visio avec Alejandra',
      description: t.landingDescription,
      complete: true,
    },
    {
      path: '/blog',
      title: 'Blog Pilates — Conseils, techniques et inspiration | FitMangas',
      description: t.blogDescription,
      complete: true,
    },
    ...SEO_PILLAR_PAGES.map((page) => ({
      path: `/${page.slug}`,
      title: `${page.shortTitle} — FitMangas`,
      description: page.description,
      complete: true,
    })),
    { path: '/blog/[slug]', title: t.articleMeta, description: t.articleMetaDescription, complete: true },
    { path: '/privacy', title: 'Politique de confidentialité — FitMangas', description: t.privacyDescription, complete: true },
    { path: '/terms', title: 'Conditions générales — FitMangas', description: t.termsDescription, complete: true },
  ];
}

function SectionTitle({ icon, eyebrow, title }: { icon: React.ReactNode; eyebrow: string; title: string }) {
  return (
    <div>
      <p className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-luxury-soft">{icon}{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-luxury-ink md:text-3xl">{title}</h2>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[2rem] border border-white/65 bg-white/60 p-5 shadow-[0_18px_42px_rgba(15,23,42,0.08)] backdrop-blur-xl">
      <h3 className="mb-4 text-lg font-semibold text-luxury-ink">{title}</h3>
      {children}
    </div>
  );
}

function StatusCard({ title, value, ok, href }: { title: string; value: string; ok: boolean; href?: string }) {
  return (
    <div className="rounded-[1.6rem] border border-white/65 bg-white/60 p-5 shadow-[0_12px_30px_rgba(15,23,42,0.07)] backdrop-blur-xl">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-luxury-soft">{title}</p>
      <p className={`mt-2 flex items-center gap-2 text-lg font-semibold ${ok ? 'text-emerald-700' : 'text-orange-700'}`}>
        {ok ? <CheckCircle2 size={18} /> : <Circle size={18} />} {value} {ok ? '✅' : ''}
      </p>
      {href ? <a href={href} className="mt-2 block text-xs text-luxury-muted underline underline-offset-2">{href}</a> : null}
    </div>
  );
}

function KpiSummaryCard({
  label,
  value,
  detail,
  info,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  info: string;
  tone: KpiTone;
}) {
  const toneClass =
    tone === 'bad'
      ? 'border-[#C45D3E]/35 bg-[#f4d4c8]/70 text-[#7a2e1a]'
      : tone === 'watch'
        ? 'border-amber-300/70 bg-amber-50/75 text-amber-950'
        : tone === 'good'
          ? 'border-[#C45D3E]/25 bg-[#fffaf5] text-luxury-ink'
          : 'border-white/65 bg-white/60 text-luxury-ink';
  const status =
    tone === 'bad'
      ? { label: 'Problème', emoji: '🔴', className: 'bg-[#f4d4c8] text-[#7a2e1a] ring-1 ring-[#C45D3E]/25' }
      : tone === 'watch'
        ? { label: 'À surveiller', emoji: '⚠️', className: 'bg-amber-100 text-amber-950 ring-1 ring-amber-300/70' }
        : tone === 'good'
          ? { label: 'Bon', emoji: '✅', className: 'bg-white text-luxury-ink ring-1 ring-[#C45D3E]/20' }
          : { label: 'Info', emoji: 'ℹ️', className: 'bg-white/80 text-luxury-muted ring-1 ring-black/10' };

  return (
    <article className={`relative flex h-[140px] flex-col rounded-[1.6rem] border p-4 shadow-[0_12px_28px_rgba(15,23,42,0.07)] backdrop-blur-xl md:h-[152px] ${toneClass}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="pr-8 text-[10px] font-semibold uppercase tracking-[0.18em] text-luxury-soft">{label}</p>
        <div className="group absolute right-3 top-3 z-20">
          <button
            type="button"
            className="flex h-7 w-7 cursor-pointer list-none items-center justify-center rounded-full border border-black/10 bg-white/75 text-[13px] font-bold text-luxury-muted shadow-sm transition hover:bg-white hover:text-luxury-ink [&::-webkit-details-marker]:hidden"
            aria-label={`Pourquoi suivre le KPI ${label}`}
          >
            i
          </button>
          <div className="invisible absolute right-0 top-9 w-[min(18rem,calc(100vw-2rem))] rounded-2xl border border-white/70 bg-white/95 p-4 text-xs font-medium leading-5 text-luxury-muted opacity-0 shadow-[0_18px_42px_rgba(15,23,42,0.16)] transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
            {info}
          </div>
        </div>
      </div>
      <p className="mt-3 break-words text-3xl font-semibold leading-none md:text-[2.55rem]">{value}</p>
      <div className="mt-auto flex items-end justify-between gap-2">
        <p className="line-clamp-2 text-xs leading-5 text-luxury-muted">{detail}</p>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${status.className}`}>
          <span aria-hidden>{status.emoji}</span> {status.label}
        </span>
      </div>
    </article>
  );
}

function Field({ label, name, defaultValue, placeholder }: { label: string; name: string; defaultValue?: string; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-luxury-soft">{label}</span>
      <input
        name={name}
        defaultValue={defaultValue ?? ''}
        placeholder={placeholder}
        className="mt-2 w-full rounded-2xl border border-white/65 bg-white/80 px-4 py-3 text-sm text-luxury-ink outline-none ring-orange-200 transition focus:ring-2"
      />
    </label>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.6rem] border border-white/65 bg-white/60 p-5 shadow-[0_12px_30px_rgba(15,23,42,0.07)] backdrop-blur-xl">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-luxury-soft">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-luxury-ink">{value}</p>
    </div>
  );
}

const copy = {
  fr: {
    title: 'SEO & Marketing',
    intro: 'Pilotage du référencement, du trafic, des pixels et de la checklist marketing avant lancement.',
    tabs: { seo: 'SEO', analytics: 'Analytics & trafic', marketing: 'Marketing & communication' },
    seoTitle: 'Fondations SEO',
    analyticsTitle: 'Trafic et performance',
    marketingTitle: 'Communication et lancement',
    seoScoreOk: 'Tous les articles > 80%',
    seoScoreTodo: 'Articles à optimiser',
    metaTags: 'Meta tags publics',
    articleScores: 'Score SEO des articles',
    article: 'Article',
    checks: 'Contrôles',
    active: 'Actif',
    notConfigured: 'Non configuré',
    saveSettings: 'Enregistrer les réglages',
    searchConsoleTitle: 'Connecter Google Search Console',
    searchConsoleDnsStatus: 'Vérifié via DNS',
    searchConsoleNote: '✅ Propriété vérifiée via DNS. Sitemap soumis.',
    blogTraffic: 'Trafic blog — articles les plus lus',
    views: 'Vues',
    avgTime: 'Temps moyen',
    scroll: 'Scroll',
    rating: 'Note',
    newsletterSubscribers: 'Abonnés newsletter',
    newsletterConfirmed: 'Confirmés',
    confirmationRate: 'Taux de confirmation',
    checklistTitle: 'Checklist marketing',
    categories: { seo: 'SEO', social: 'Réseaux sociaux', ads: 'Publicité', community: 'Communauté' },
    landingDescription: 'Cours de Pilates et Barre en visio avec Alejandra : live, replay, progression et coaching premium.',
    blogDescription: 'Conseils Pilates, techniques, respiration, posture et inspiration pour progresser avec FitMangas.',
    articleMeta: 'Titre et description dynamiques par article',
    articleMetaDescription: 'Chaque article utilise son titre, sa description, Open Graph et Twitter Card.',
    privacyDescription: 'Politique de confidentialité FitMangas et informations sur les données personnelles.',
    termsDescription: 'Conditions générales de vente et d’utilisation FitMangas.',
    gaLiveTitle: 'Google Analytics — Données en direct',
    gscLiveTitle: 'Google Search Console — Données en direct',
    editorialTitle: 'Calendrier éditorial',
    editArticle: 'Éditer',
    metaAdsTitle: 'Performances Meta Ads',
    metaAdsHelp:
      'Les performances de vos publicités Instagram et Facebook sont disponibles directement dans le gestionnaire de publicités Meta.',
    metaAdsLink: 'Voir les performances Meta Ads',
    googleAdsTitle: 'Performances Google Ads',
    googleAdsHelp: 'Les performances Google Ads se consultent dans votre compte Google Ads.',
    googleAdsLink: 'Voir les performances Google Ads',
    referralLeaderTitle: 'Classement parrainage (ambassadrices)',
    referralAmbassador: 'Ambassadrice',
    referralCount: 'Filleules enregistrées',
    referralEmpty: 'Aucune filleule enregistrée pour le moment.',
  },
  es: {
    title: 'SEO & Marketing',
    intro: 'Panel para gestionar posicionamiento, tráfico, píxeles y checklist de lanzamiento.',
    tabs: { seo: 'SEO', analytics: 'Analytics & tráfico', marketing: 'Marketing & comunicación' },
    seoTitle: 'Bases SEO',
    analyticsTitle: 'Tráfico y rendimiento',
    marketingTitle: 'Comunicación y lanzamiento',
    seoScoreOk: 'Todos los artículos > 80%',
    seoScoreTodo: 'Artículos por optimizar',
    metaTags: 'Meta tags públicos',
    articleScores: 'Score SEO de artículos',
    article: 'Artículo',
    checks: 'Controles',
    active: 'Activo',
    notConfigured: 'No configurado',
    saveSettings: 'Guardar ajustes',
    searchConsoleTitle: 'Conectar Google Search Console',
    searchConsoleDnsStatus: 'Verificado vía DNS',
    searchConsoleNote: '✅ Propiedad verificada vía DNS. Sitemap enviado.',
    blogTraffic: 'Tráfico blog — artículos más leídos',
    views: 'Vistas',
    avgTime: 'Tiempo medio',
    scroll: 'Scroll',
    rating: 'Nota',
    newsletterSubscribers: 'Suscriptoras newsletter',
    newsletterConfirmed: 'Confirmadas',
    confirmationRate: 'Tasa de confirmación',
    checklistTitle: 'Checklist marketing',
    categories: { seo: 'SEO', social: 'Redes sociales', ads: 'Publicidad', community: 'Comunidad' },
    landingDescription: 'Clases de Pilates y Barre online con Alejandra: live, replay, progresión y coaching premium.',
    blogDescription: 'Consejos de Pilates, técnica, respiración, postura e inspiración para progresar con FitMangas.',
    articleMeta: 'Título y descripción dinámicos por artículo',
    articleMetaDescription: 'Cada artículo usa su título, descripción, Open Graph y Twitter Card.',
    privacyDescription: 'Política de privacidad FitMangas e información sobre datos personales.',
    termsDescription: 'Condiciones generales de venta y uso de FitMangas.',
    gaLiveTitle: 'Google Analytics — Datos en directo',
    gscLiveTitle: 'Google Search Console — Datos en directo',
    editorialTitle: 'Calendario editorial',
    editArticle: 'Editar',
    metaAdsTitle: 'Rendimiento Meta Ads',
    metaAdsHelp:
      'El rendimiento de tus anuncios en Instagram y Facebook está disponible directamente en el administrador de anuncios de Meta.',
    metaAdsLink: 'Ver rendimiento Meta Ads',
    googleAdsTitle: 'Rendimiento Google Ads',
    googleAdsHelp: 'El rendimiento de Google Ads se consulta en tu cuenta de Google Ads.',
    googleAdsLink: 'Ver rendimiento Google Ads',
    referralLeaderTitle: 'Ranking de referidos (embajadoras)',
    referralAmbassador: 'Embajadora',
    referralCount: 'Referidas registradas',
    referralEmpty: 'Todavía no hay referidas registradas.',
  },
};
