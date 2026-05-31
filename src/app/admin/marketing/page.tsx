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
import { hasGoogleServiceAccountJson } from '@/lib/google/service-account';
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

  const nowIsoMarketing = new Date().toISOString();
  const { data: scheduledRaw } = await admin
    .from('blog_articles')
    .select('id, title_fr, scheduled_publication_at, status')
    .gte('scheduled_publication_at', nowIsoMarketing)
    .in('status', ['draft', 'validated'])
    .order('scheduled_publication_at', { ascending: true })
    .limit(8);

  const { data: suggestionsRaw } = await admin
    .from('marketing_editorial_suggestions')
    .select('id, suggestion_fr, suggestion_es, topics_hint, created_at')
    .order('created_at', { ascending: false })
    .limit(12);

  const { data: referralRows } = await admin.from('referrals').select('referrer_user_id');
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
  const checklistForAdvisor = checklist.map((item) => ({
    key: item.key,
    label: lang === 'es' ? item.label_es : item.label_fr,
    category: item.category,
    completed: item.completed,
  }));

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
          <StatusCard title="Google Analytics" ok={Boolean(settings.google_analytics_id)} value={settings.google_analytics_id ? t.active : t.notConfigured} />
          <StatusCard title="Google Search Console" ok value={t.searchConsoleDnsStatus} />
          <StatusCard title="Meta Pixel" ok={Boolean(settings.meta_pixel_id)} value={settings.meta_pixel_id ? t.active : t.notConfigured} />
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

        <BusinessCharts data={businessData} />
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
                  mrr: latestBusiness.mrr,
                  activeSubscribers: latestBusiness.activeSubscribers,
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
              completed: checklistForAdvisor.filter((i) => i.completed).map(({ key, label, category }) => ({ key, label, category })),
              pending: checklistForAdvisor.filter((i) => !i.completed).map(({ key, label, category }) => ({ key, label, category })),
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
                  {checklist
                    .filter((item) => item.category === category)
                    .sort((a, b) => a.sort_order - b.sort_order)
                    .map((item) => (
                      <form key={item.key} action={toggleMarketingChecklist}>
                        <input type="hidden" name="key" value={item.key} />
                        <input type="hidden" name="completed" value={String(!item.completed)} />
                        <button type="submit" className="flex w-full items-start gap-2 rounded-xl px-2 py-2 text-left text-sm text-luxury-muted transition hover:bg-white/70">
                          {item.completed ? <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={17} /> : <Circle className="mt-0.5 shrink-0 text-luxury-soft" size={17} />}
                          <span>{lang === 'es' ? item.label_es : item.label_fr}</span>
                        </button>
                      </form>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </section>
    </main>
  );
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
