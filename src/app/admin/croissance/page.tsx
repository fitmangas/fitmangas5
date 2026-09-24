import { Suspense, type ReactNode } from 'react';
import { redirect } from 'next/navigation';

import { CommunityManagerSection } from '@/app/admin/community/CommunityManagerSection';
import { MarketingPageContent } from '@/app/admin/marketing/MarketingPageContent';
import {
  acquisitionRunWorkflowDemo,
  acquisitionSeedDemo,
  acquisitionCreateThread,
  acquisitionSendReply,
  acquisitionSaveWorkflow,
  acquisitionDeleteWorkflow,
  acquisitionToggleWorkflow,
  acquisitionTestAction,
  acquisitionConciergeReply,
  acquisitionRunFollowupsNow,
  acquisitionEnsureMetaConnection,
  acquisitionSyncInsightsAndHooks,
  acquisitionCheckLiveReadiness,
  acquisitionEnsureWorkflowCatalog,
} from '@/app/admin/acquisition/actions';
import {
  adsActivateCampaign,
  adsBoostOrganicToPausedDraft,
  adsCreateColdQuizPausedDraft,
  adsCreateRefreshCreativeDraft,
  adsCreateStrategyDrafts,
  adsEnsureCreativeSeed,
  adsLoadCoachAdvice,
  adsRunIntelligenceSync,
  adsSyncInsights,
} from '@/app/admin/croissance/ads-actions';
import { AcquisitionBoard } from '@/components/acquisition/AcquisitionBoard';
import { AdsPilotPanel } from '@/components/Admin/croissance/AdsPilotPanel';
import { CroissanceShell } from '@/components/Admin/croissance/CroissanceShell';
import {
  resolveCroissanceTab,
  type CroissanceTabId,
} from '@/components/Admin/croissance/croissance-tabs';
import { generateCoachAdvice } from '@/lib/acquisition/ads/coach';
import { getAdsConnectionState } from '@/lib/acquisition/ads/config';
import { loadAdsIntelligenceBundle } from '@/lib/acquisition/ads/intelligence-repository';
import {
  ensureAdCreativeSeed,
  isAdsSchemaReady,
  listAdCampaigns,
  listAdCreatives,
  summarizeAdsPerformance,
} from '@/lib/acquisition/ads/repository';
import { requireAdmin } from '@/lib/auth/require-admin';
import { buildAcquisitionOverview } from '@/lib/acquisition/dashboard/build-overview';
import {
  getConversationWithMessages,
  listConversations,
  listRecentWorkflowRuns,
  listWorkflows,
} from '@/lib/acquisition/engine/repository';
import { isAcquisitionModuleEnabled } from '@/lib/acquisition/feature-flag';
import { getSandboxLog } from '@/lib/acquisition/providers';
import type { AcqMessage, AcquisitionChannel } from '@/lib/acquisition/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function acquisitionTabFromParams(tab: CroissanceTabId): 'overview' | 'conversations' | 'workflows' {
  if (tab === 'conversations' || tab === 'workflows') return tab;
  return 'overview';
}

export default async function AdminCroissancePage({ searchParams }: PageProps) {
  await requireAdmin();

  const params = await searchParams;
  const showAcquisition = isAcquisitionModuleEnabled();
  const rawTab = firstParam(params.tab);
  const tab = resolveCroissanceTab(rawTab, showAcquisition);

  if (
    !showAcquisition &&
    (rawTab === 'overview' ||
      rawTab === 'conversations' ||
      rawTab === 'workflows' ||
      rawTab === 'ads')
  ) {
    redirect('/admin/croissance?tab=publications');
  }

  const channel = (firstParam(params.channel) as AcquisitionChannel | 'all' | undefined) ?? 'all';
  const selectedId = firstParam(params.conversation) ?? null;

  const needsAcquisition =
    showAcquisition && (tab === 'overview' || tab === 'conversations' || tab === 'workflows');

  let acquisitionPanel: ReactNode = null;

  if (needsAcquisition) {
    const [overview, convList, wfList, runsList] = await Promise.all([
      buildAcquisitionOverview(channel),
      listConversations(40),
      listWorkflows(),
      listRecentWorkflowRuns(20),
    ]);

    let selectedMessages: AcqMessage[] = [];
    let detailError: string | null = null;

    if (selectedId) {
      const detail = await getConversationWithMessages(selectedId);
      if (detail.ok) {
        selectedMessages = detail.messages;
      } else {
        detailError = detail.error;
      }
    }

    const conversations = convList.ok ? convList.items : [];
    const conversationsError = convList.ok ? null : convList.error;
    const workflows = wfList.ok ? wfList.items : [];
    const recentWorkflowRuns = runsList.ok ? runsList.items : [];
    const sandboxLog = getSandboxLog(30);

    acquisitionPanel = (
      <AcquisitionBoard
        embedded
        forcedTab={acquisitionTabFromParams(tab)}
        routeBase="/admin/croissance"
        overview={overview}
        conversations={conversations}
        workflows={workflows}
        recentWorkflowRuns={recentWorkflowRuns}
        conversationsError={conversationsError}
        schemaReady={overview.schemaReady}
        selectedConversationId={selectedId}
        selectedMessages={selectedMessages}
        detailError={detailError}
        sandboxLog={sandboxLog}
        onSendReply={acquisitionSendReply}
        onSeedDemo={acquisitionSeedDemo}
        onCreateThread={acquisitionCreateThread}
        onRunWorkflowDemo={acquisitionRunWorkflowDemo}
        onSaveWorkflow={acquisitionSaveWorkflow}
        onDeleteWorkflow={acquisitionDeleteWorkflow}
        onToggleWorkflow={acquisitionToggleWorkflow}
        onTestAction={acquisitionTestAction}
        onConciergeReply={acquisitionConciergeReply}
        onRunFollowupsNow={acquisitionRunFollowupsNow}
        onEnsureMetaConnection={acquisitionEnsureMetaConnection}
        onSyncInsightsAndHooks={acquisitionSyncInsightsAndHooks}
        onCheckLiveReadiness={acquisitionCheckLiveReadiness}
        onEnsureWorkflowCatalog={acquisitionEnsureWorkflowCatalog}
      />
    );
  }

  let adsPanel: ReactNode = null;
  if (showAcquisition && tab === 'ads') {
    await ensureAdCreativeSeed();
    const [schemaReady, campaignsRes, creativesRes, performance, intelligence] = await Promise.all([
      isAdsSchemaReady(),
      listAdCampaigns(),
      listAdCreatives(),
      summarizeAdsPerformance(),
      loadAdsIntelligenceBundle(),
    ]);
    const coach = await generateCoachAdvice(intelligence);
    adsPanel = (
      <AdsPilotPanel
        connection={getAdsConnectionState()}
        performance={performance}
        campaigns={campaignsRes.ok ? campaignsRes.items : []}
        creatives={creativesRes.ok ? creativesRes.items : []}
        schemaReady={schemaReady}
        intelligence={intelligence}
        coachAdvice={coach.advice}
        coachNote={coach.aiNote}
        onCreateDrafts={adsCreateStrategyDrafts}
        onSyncInsights={adsSyncInsights}
        onFullSync={adsRunIntelligenceSync}
        onSeedCreatives={adsEnsureCreativeSeed}
        onCreateColdDraft={adsCreateColdQuizPausedDraft}
        onBoostOrganic={adsBoostOrganicToPausedDraft}
        onRefreshCreative={adsCreateRefreshCreativeDraft}
        onReloadCoach={adsLoadCoachAdvice}
        onActivate={adsActivateCampaign}
      />
    );
  }

  let tabPanel: ReactNode = null;

  if (tab === 'overview' || tab === 'conversations' || tab === 'workflows') {
    tabPanel = acquisitionPanel;
  } else if (tab === 'ads') {
    tabPanel = adsPanel;
  } else if (tab === 'publications') {
    tabPanel = <CommunityManagerSection />;
  } else if (tab === 'seo') {
    tabPanel = <MarketingPageContent />;
  }

  return (
    <Suspense fallback={<div className="p-8 text-sm text-[#78716C]">Chargement Croissance…</div>}>
      <CroissanceShell activeTab={tab} showAcquisition={showAcquisition}>
        {tabPanel}
      </CroissanceShell>
    </Suspense>
  );
}
