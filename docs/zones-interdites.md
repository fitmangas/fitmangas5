# Zones interdites (chantier octobre 2026 — SPEC §7.14 et §9)

Aucun lot du chantier ne modifie ces fichiers. Seule exception : l’**habillage** de la page du live (maquette D03, lot 5) — l’apparence autour du cadre vidéo dans `src/app/live/[courseId]/page.tsx`, sans toucher aux vérifications d’accès, à la bascule replay ni au cadre Jitsi.

Contrôle avant chaque commit :

```bash
git diff --name-only main...HEAD | grep -F -f <(sed -n 's/^- `\(.*\)`.*/\1/p' docs/zones-interdites.md)
```

(aucune ligne attendue, sauf `src/app/live/[courseId]/page.tsx` au lot 5, habillage seulement).

## (a) Circuit replay — ingest, Jibri, Vimeo, statuts, compteurs

### Ingest et enregistrement
- `src/app/api/internal/recordings/ingest/route.ts`
- `src/app/api/video/process-recording/route.ts`
- `src/app/api/live/end/route.ts`
- `src/components/Live/EndLiveControls.tsx`
- `src/lib/course-recording-upsert.ts`
- `src/lib/jibri-recording-filename.ts`
- `scripts/vps/finalize.sh`
- `scripts/vps/watch-stuck-recordings.sh`
- `scripts/vps/install-auto-finalize.sh`
- `scripts/vps/deploy-from-mac.sh`
- `scripts/vps/pull-all-jibri-mp4.sh`
- `scripts/vps/audit-vps-recovery.sh`
- `scripts/recover-jibri-stuck-replays.sh`
- `scripts/recover-dead-replays-from-mp4.ts`
- `scripts/reupload-stuck-course-replays.ts`
- `scripts/audit-recover-course-replays.ts`

### Vimeo (upload, webhook, synchronisation, validation, publication)
- `src/app/api/webhooks/vimeo/route.ts`
- `src/app/api/admin/vimeo/[id]/remove/route.ts`
- `src/app/api/admin/vimeo/[id]/schedule/route.ts`
- `src/app/api/admin/vimeo/[id]/validate/route.ts`
- `src/app/api/admin/vimeo/[id]/visibility/route.ts`
- `src/app/api/admin/vimeo/cron/publish-scheduled/route.ts`
- `src/app/api/admin/vimeo/sync-all/route.ts`
- `src/app/api/admin/vimeo/sync-new/route.ts`
- `src/lib/vimeo.ts`
- `src/lib/vimeo-tus-chunked.ts`
- `src/lib/vimeo-webhook-parse.ts`
- `src/lib/vimeo-webhook-verify.ts`
- `src/lib/vimeo-sync-standalone.ts`
- `src/lib/vimeo-standalone-guard.ts`
- `src/lib/vimeo-validation-service.ts`
- `src/lib/vimeo-scheduling-service.ts`
- `src/lib/vimeo-folder.ts`
- `src/lib/vimeo-coach-env.ts`
- `src/lib/vimeo-playback.ts`

### Statuts, récupération, compteurs
- `src/app/api/admin/cron/replay-recover/route.ts`
- `src/app/api/admin/course-replays/pending-count/route.ts`
- `src/app/admin/replays/actions.ts`
- `src/lib/replay-admin.ts`
- `src/lib/replay-availability.ts`
- `src/lib/replay-recovery.ts`
- `src/lib/replay-recover-orphans.ts`
- `src/lib/replay-library.ts`
- `src/lib/replay-cover.ts`
- `src/lib/replay-brand-cover.ts`
- `src/lib/replay-course-type.ts`
- `src/components/Admin/AdminDeadReplaysBanner.tsx`
- `src/components/Admin/AdminRecoverOrphanReplaysButton.tsx`
- `src/components/Admin/VimeoSyncAllButton.tsx`
- Fonction SQL `increment_replay_view()`, table `replay_playback_progress`, table `video_recordings` (aucune migration du chantier ne les modifie).

Note : `src/lib/notifications/phase2.ts` (notification « replay prêt ») lit `video_recordings` ; le lot 2a n’y change **que le calcul des destinataires**.

## (b) Construction des lives

- `src/app/live/[courseId]/page.tsx` — **sauf l’habillage autorisé au lot 5** (D03). Interdits même au lot 5 : vérifications d’accès, bascule vers le replay, props et emplacement de `JitsiRoomLoader`.
- `src/components/Jitsi/JitsiRoomLoader.tsx`
- `src/components/Jitsi/JitsiRoom.tsx`
- `src/lib/jitsi/embed-config.ts`
- `src/lib/jitsi/embed-from-room-url.ts`
- `src/lib/jitsi/jwt.ts`
- `src/app/api/jitsi/token/route.ts` (et tout `/api/jitsi/*`)
- `src/components/Live/LiveVisitRecorder.tsx`
- `src/lib/live/replay-switch.ts`
- `src/lib/live/live-back-url.ts`
- Configuration du serveur `live.fitmangas.com` (Hetzner `178.104.206.202`) et de Jibri (hors dépôt).
