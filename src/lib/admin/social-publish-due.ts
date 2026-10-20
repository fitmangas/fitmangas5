import { revalidatePath } from 'next/cache';

import {
  facebookMirrorMediaReady,
  probeMetaToken,
  publishFacebookPost,
  publishInstagramWithResume,
  verifyFacebookPublishId,
} from '@/lib/admin/meta-social';
import { getMetaSocialConnection, getSocialCommsBoard, saveSocialCommsBoard, type SocialPost } from '@/lib/admin/social-comms';
import {
  getTikTokSocialConnection,
  publishTikTokReel,
  saveTikTokSocialConnection,
  tiktokConnectorStatusMessage,
} from '@/lib/admin/tiktok-social';
import {
  getYouTubeSocialConnection,
  publishYouTubeReel,
  saveYouTubeSocialConnection,
  youtubeConnectorStatusMessage,
} from '@/lib/admin/youtube-social';

/**
 * Publication des posts Instagram programmés (+ miroirs FB / TikTok / YouTube).
 * Appelée par les routes cron (CRON_SECRET) et, côté admin, par l’action
 * `processDueSocialPostsAction` (requireAdmin). Ne jamais exporter depuis un fichier « use server ».
 */

function revalidateCommunity() {
  revalidatePath('/admin/community');
  revalidatePath('/admin/croissance');
  revalidatePath('/admin');
}

async function syncAdsPipelineFromCmPost(post: Pick<SocialPost, 'status' | 'sourceRef'>) {
  try {
    const { syncPipelineFromSocialPost } = await import('@/lib/acquisition/ads/pipeline-sync');
    await syncPipelineFromSocialPost(post);
  } catch (e) {
    console.error('[cm] ads pipeline sync', e);
  }
}

export async function processDueSocialPostsInternal() {
  const board = await getSocialCommsBoard();
  const connection = await getMetaSocialConnection();
  const now = Date.now();
  const startedAt = now;
  /** Budget temps cron Hobby : laisser de la marge avant kill Vercel. */
  const TIME_BUDGET_MS = 90_000;
  const PER_POST_WAIT_MS = 40_000;

  let published = 0;
  let pending = 0;
  let failed = 0;
  let nextPosts = [...board.posts];
  const errors: Array<{ id: string; error: string }> = [];

  const duePosts = board.posts
    .filter((post) => {
      if ((post.status !== 'scheduled' && post.status !== 'publishing') || !post.plannedAt) return false;
      if (post.network !== 'instagram') return false;
      // Reprise conteneur même si l’heure est passée ; sinon attendre plannedAt
      if (post.igContainerId) return true;
      return new Date(post.plannedAt).getTime() <= now;
    })
    .sort((a, b) => {
      // Priorité aux reprises de conteneur, puis les plus anciens
      const aPend = a.igContainerId ? 0 : 1;
      const bPend = b.igContainerId ? 0 : 1;
      if (aPend !== bPend) return aPend - bPend;
      return String(a.plannedAt).localeCompare(String(b.plannedAt));
    });

  if (duePosts.length === 0) {
    return { ok: true as const, published: 0, pending: 0, failed: 0, due: 0, errors };
  }

  if (!connection.connected || !connection.accessToken || !connection.igUserId) {
    const msg =
      'Meta non connecté (token / Page / IG User ID). Reconnecte Meta dans Community → Connecter Instagram/Facebook.';
    for (const post of duePosts) {
      nextPosts = nextPosts.map((item) =>
        item.id === post.id
          ? {
              ...item,
              publishError: msg,
              publishAttemptAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          : item,
      );
      failed += 1;
      errors.push({ id: post.id, error: msg });
    }
    await saveSocialCommsBoard({ ...board, posts: nextPosts });
    revalidateCommunity();
    return { ok: true as const, published: 0, pending: 0, failed, due: duePosts.length, errors };
  }

  const probe = await probeMetaToken(connection);
  if (!probe.ok) {
    for (const post of duePosts) {
      nextPosts = nextPosts.map((item) =>
        item.id === post.id
          ? {
              ...item,
              publishError: probe.error,
              publishAttemptAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          : item,
      );
      failed += 1;
      errors.push({ id: post.id, error: probe.error });
    }
    await saveSocialCommsBoard({ ...board, posts: nextPosts });
    revalidateCommunity();
    return { ok: true as const, published: 0, pending: 0, failed, due: duePosts.length, errors };
  }

  for (const post of duePosts) {
    if (Date.now() - startedAt > TIME_BUDGET_MS) {
      console.warn('[processDueSocialPostsAction] time budget reached, deferring remaining posts');
      break;
    }

    // Verrou atomique (équivalent SQL scheduled → publishing) : on ne publie
    // que si le statut en mémoire est encore scheduled. Un second cron voit publishing et reprend.
    if (post.status === 'scheduled') {
      const claimed = nextPosts.find((item) => item.id === post.id && item.status === 'scheduled');
      if (!claimed) continue;
      nextPosts = nextPosts.map((item) =>
        item.id === post.id && item.status === 'scheduled'
          ? { ...item, status: 'publishing' as const, updatedAt: new Date().toISOString() }
          : item,
      );
      await saveSocialCommsBoard({ ...board, posts: nextPosts });
    }

    const attemptAt = new Date().toISOString();
    try {
      const progress = await publishInstagramWithResume(connection, { ...post, igContainerId: post.igContainerId }, {
        containerId: post.igContainerId,
        maxWaitMs: PER_POST_WAIT_MS,
      });

      if (!progress.done) {
        nextPosts = nextPosts.map((item) =>
          item.id === post.id
            ? {
                ...item,
                igContainerId: progress.containerId,
                publishError: null,
                publishAttemptAt: attemptAt,
                updatedAt: attemptAt,
              }
            : item,
        );
        pending += 1;
        await saveSocialCommsBoard({ ...board, posts: nextPosts });
        continue;
      }

      let facebookExternalId = post.facebookExternalId;
      let tiktokExternalId = post.tiktokExternalId;
      let youtubeExternalId = post.youtubeExternalId;
      const mirrorErrors: string[] = [];
      if (post.alsoPublishFacebook) {
        if (!facebookMirrorMediaReady(post)) {
          console.error('[processDueSocialPostsAction] FB mirror skipped — média manquant', post.id);
        } else {
          const fbAlreadyLive =
            facebookExternalId && (await verifyFacebookPublishId(connection, facebookExternalId, post.format));
          if (!fbAlreadyLive) {
            try {
              facebookExternalId = await publishFacebookPost(connection, post, { schedule: false });
            } catch (fbError) {
              console.error('[processDueSocialPostsAction] FB mirror', post.id, fbError);
            }
          }
        }
      }
      if (post.alsoPublishTikTok && post.format === 'reel' && post.editedVideoPath) {
        try {
          let ttConn = await getTikTokSocialConnection();
          if (!ttConn.connected || !ttConn.accessToken) {
            mirrorErrors.push(`TikTok non connecté — ${tiktokConnectorStatusMessage(ttConn)}`);
          } else {
            const remainingMs = TIME_BUDGET_MS - (Date.now() - startedAt);
            const pollAttempts = Math.max(3, Math.min(12, Math.floor(remainingMs / 2500)));
            const ttPublished = await publishTikTokReel(ttConn, post, {
              onTokenRefreshed: async (next) => {
                await saveTikTokSocialConnection(next);
                ttConn = next;
              },
              maxPollAttempts: pollAttempts,
              acceptProcessingAsSuccess: true,
            });
            tiktokExternalId = ttPublished.publishId;
            await saveTikTokSocialConnection(ttPublished.connection);
          }
        } catch (ttError) {
          console.error('[processDueSocialPostsAction] TT mirror', post.id, ttError);
          mirrorErrors.push(
            `TikTok: ${ttError instanceof Error ? ttError.message : 'échec miroir'}`,
          );
        }
      } else if (post.alsoPublishTikTok && (post.format !== 'reel' || !post.editedVideoPath)) {
        mirrorErrors.push('TikTok ignoré (Reel MP4 requis)');
      }
      if (post.alsoPublishYouTube && post.format === 'reel' && post.editedVideoPath) {
        if (post.youtubeExternalId) {
          youtubeExternalId = post.youtubeExternalId;
        } else {
          try {
            let ytConn = await getYouTubeSocialConnection();
            if (ytConn.connected && ytConn.accessToken) {
              const ytPublished = await publishYouTubeReel(ytConn, post, {
                onTokenRefreshed: async (next) => {
                  await saveYouTubeSocialConnection(next);
                  ytConn = next;
                },
              });
              youtubeExternalId = ytPublished.videoId;
              await saveYouTubeSocialConnection(ytPublished.connection);
            } else {
              mirrorErrors.push(`YouTube non connecté — ${youtubeConnectorStatusMessage(ytConn)}`);
            }
          } catch (ytError) {
            console.error('[processDueSocialPostsAction] YT mirror', post.id, ytError);
            mirrorErrors.push(
              `YouTube: ${ytError instanceof Error ? ytError.message : 'échec miroir'}`,
            );
          }
        }
      } else if (post.alsoPublishYouTube && (post.format !== 'reel' || !post.editedVideoPath)) {
        mirrorErrors.push('YouTube ignoré (Reel MP4 requis)');
      }

      nextPosts = nextPosts.map((item) =>
        item.id === post.id
          ? {
              ...item,
              status: 'published',
              metaExternalId: progress.mediaId,
              facebookExternalId,
              tiktokExternalId,
              youtubeExternalId,
              igContainerId: null,
              publishError: mirrorErrors.length ? mirrorErrors.join(' · ') : null,
              publishAttemptAt: attemptAt,
              updatedAt: attemptAt,
            }
          : item,
      );
      published += 1;
      await saveSocialCommsBoard({ ...board, posts: nextPosts });
      const publishedRow = nextPosts.find((p) => p.id === post.id);
      if (publishedRow?.status === 'published') {
        await syncAdsPipelineFromCmPost(publishedRow);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Publication Instagram échouée.';
      console.error('[processDueSocialPostsAction]', post.id, e);
      nextPosts = nextPosts.map((item) =>
        item.id === post.id
          ? {
              ...item,
              status: 'scheduled',
              publishError: message,
              publishAttemptAt: attemptAt,
              updatedAt: attemptAt,
            }
          : item,
      );
      failed += 1;
      errors.push({ id: post.id, error: message });
      await saveSocialCommsBoard({ ...board, posts: nextPosts });
    }
  }

  // Rattrapage : Reels déjà publiés IG/FB/YT mais TikTok manquant (échecs silencieux passés).
  let tiktokRetried = 0;
  if (Date.now() - startedAt < TIME_BUDGET_MS - 25_000) {
    const missingTikTok = nextPosts
      .filter(
        (p) =>
          p.status === 'published' &&
          p.network === 'instagram' &&
          p.format === 'reel' &&
          p.alsoPublishTikTok &&
          !p.tiktokExternalId &&
          Boolean(p.editedVideoPath) &&
          p.plannedAt &&
          Date.now() - new Date(p.plannedAt).getTime() < 14 * 24 * 60 * 60 * 1000,
      )
      .sort((a, b) => String(b.plannedAt).localeCompare(String(a.plannedAt)))
      .slice(0, 1);

    for (const post of missingTikTok) {
      if (Date.now() - startedAt > TIME_BUDGET_MS - 20_000) break;
      try {
        let ttConn = await getTikTokSocialConnection();
        if (!ttConn.connected || !ttConn.accessToken) {
          errors.push({
            id: post.id,
            error: `TikTok rattrapage: non connecté — ${tiktokConnectorStatusMessage(ttConn)}`,
          });
          continue;
        }
        const remainingMs = TIME_BUDGET_MS - (Date.now() - startedAt);
        const pollAttempts = Math.max(3, Math.min(12, Math.floor(remainingMs / 2500)));
        const ttPublished = await publishTikTokReel(ttConn, post, {
          onTokenRefreshed: async (next) => {
            await saveTikTokSocialConnection(next);
            ttConn = next;
          },
          maxPollAttempts: pollAttempts,
          acceptProcessingAsSuccess: true,
        });
        nextPosts = nextPosts.map((item) =>
          item.id === post.id
            ? {
                ...item,
                alsoPublishTikTok: true,
                tiktokExternalId: ttPublished.publishId,
                publishError: item.publishError?.includes('TikTok')
                  ? null
                  : item.publishError,
                updatedAt: new Date().toISOString(),
              }
            : item,
        );
        await saveSocialCommsBoard({ ...board, posts: nextPosts });
        tiktokRetried += 1;
      } catch (ttError) {
        const msg = ttError instanceof Error ? ttError.message : 'échec miroir';
        console.error('[processDueSocialPostsAction] TT catch-up', post.id, ttError);
        errors.push({ id: post.id, error: `TikTok rattrapage: ${msg}` });
        nextPosts = nextPosts.map((item) =>
          item.id === post.id
            ? {
                ...item,
                publishError: [`TikTok: ${msg}`, item.publishError].filter(Boolean).join(' · '),
                updatedAt: new Date().toISOString(),
              }
            : item,
        );
        await saveSocialCommsBoard({ ...board, posts: nextPosts });
      }
    }
  }

  if (published > 0 || pending > 0 || failed > 0 || tiktokRetried > 0) {
    revalidateCommunity();
  }
  return {
    ok: true as const,
    published,
    pending,
    failed,
    due: duePosts.length,
    tiktokRetried,
    errors,
  };
}
