# Lot 2a — Notifications : moteur

Date : 19/10/2026. Branche `chantier-oct-2026` (commit local uniquement, pas de push).

## Items non faits ou partiels

- **Écriture `group_key` / `category` / `action_url` dans `user_notifications`** : colonnes proposées en SQL, helper `contentGroupKey` testé. Le dispatcher n’écrit **pas** ces champs tant que la migration n’est pas appliquée (sinon insert cassé). Branchement HTML / centre = lot 2b.
- **« Ta semaine » et e-mails A01–A06** : textes et données côté moteur (sujets, lien `/live/[id]`, hint « Le lien est déjà ouvert… ») ; HTML = lot 2b. La route `/api/admin/cron/hourly` appelle le flush digest (bloqué si drapeau off + cutoff) ; le contenu A04/A06 arrivera au 2b.
- **Colonne `courses.live_style`** : SQL proposé, **non écrite** par le code. Style = type de cours admin (Pilates, Barre, Fit-Dance, Boot Camp, Stretching, Booty ajoutés à la liste).
- **cron-job.org** : `vercel.json` ne contient **pas** `course-reminders`. `CRON_SETUP.md` le documente comme filet ~10 min (GET). L’API logs Vercel a répondu **403** sur 7 jours : pas de preuve runtime ici. Option prudente : **on garde** la publication sociale **aussi** dans `course-reminders` jusqu’à ce que Kevin coupe cron-job.org et allume pg_cron `/social`.
- **pg_cron / Vault / `NOTIF_V2_CUTOFF`** : SQL rédigé, **non appliqué**.
- **Visites live** : diagnostic seulement (0 ligne, y compris tout l’historique). `LiveVisitRecorder` et la page `/live` **non modifiés**.
- **Aucun live créé** en base. Captures = `/dev/apercu` données fictives.

## Décisions prudentes (SPEC, sans question)

- Drapeau `NEXT_PUBLIC_FEATURE_NOTIF_V2` **off** : comportement actuel conservé (rappels visio toujours via `enrollments`, donc 0 destinataire aujourd’hui).
- Flush digest retiré de `daily-jobs` **même drapeau off** (protection backlog 8 850). `processDigestQueue` refuse tout envoi si drapeau off.
- Social : verrou JSON `scheduled → publishing` + save avant publish ; filet double déclencheur conservé dans `course-reminders`.
- Rappels / annulation / changement d’horaire : traités comme **critiques** seulement si v2 allumé (silence + plafond ignorés). Replay ready : pas critique.
- `live_other_language` : lecture profils avec repli si la colonne n’existe pas encore (tout le monde = false).
- Présence live = `created_at` entre 15 min avant `starts_at` et `ends_at`, **à la lecture**.

---

## 1. Migrations (Lot 2, non appliquées)

`PROPOSITIONS_MIGRATIONS.md` section **Lot 2** : préférences §3.8, colonnes centre, `cron_heartbeats`, `live_style`, cutoff, comptage backlog, archivage sans envoi (GO), SQL `pg_cron` + `pg_net` POST vers `https://fitmangas.com/api/admin/cron/{course-reminders,social,hourly}` (timeout 60000, Bearer Vault `cron_secret`). Anti-doublon : `notification_log.idempotency_key` **déjà unique**.

## 2. Protection du backlog

- `filterDigestRowsForFlush` : drapeau off → 0 envoi ; cutoff ignore les lignes trop vieilles.
- `runPhase3DailyJobs` : plus de flush (`moved_to_hourly`).
- Test : « élément antérieur au cutoff jamais envoyé ».

## 3. Lives récurrents

Admin création : « Répéter chaque semaine jusqu’au » + aperçu des dates, **visible seulement si drapeau on**. `weeklyOccurrences` (max 52). Capture : `/dev/apercu/admin-live-recurrent`.

## 4. Destinataires et rappels

`src/lib/notifications/v2/` : accès visio (`isOnlineCustomerTier` actuel) **et** (locale du live **ou** `live_other_language`). Veille ≥ 18:00 locale ; 1 h = `0 < min ≤ 75` ; « Dans X min » si < 50. Jumeaux ≤ 20 min. Annulation immédiate (`dispatchVisioCancelledV2`, « dernière minute » si < 24 h). Changement d’horaire après rappel de veille : e-mail + appli, **remet à zéro** les clés `reminder_H-1`. Plus de « Tu as manqué le cours » visio si v2. Lots Resend 100 ; anti-doublon e-mail **après** succès. Lien Rejoindre = `/live/[id]`. Aucun texte « salle d’attente ».

## 5. Contenus

Helper `contentGroupKey` (`content-AAAA-MM-JJ` fuseau cliente) + `replayLanguageAllowed`. `replay ready` / cours annulé visio → abonnées éligibles (plus les inscriptions) **si drapeau on**. Écriture `group_key` différée (migration).

## 6. Routes

| Route | Méthodes | Rôle |
|---|---|---|
| `/api/admin/cron/course-reminders` | GET + POST | rappels + **filet social** + heartbeat + alerte retard |
| `/api/admin/cron/social` | GET + POST | publication seule, verrou publishing |
| `/api/admin/cron/hourly` | GET + POST | digest (bloqué si flag off) + lag |
| `/api/admin/cron/daily-jobs` | GET + POST | jobs quotidiens **sans** flush digest + lag |

Alerte `ADMIN_ALERT_EMAIL` 1/jour max (`admin.cron_lag:{job}:{jour}`).

## 7. `admin.replay_missing`

1 notification par cours, admins seulement, cours terminés depuis > 24 h et ≤ 7 jours (`runMissingReplayAlertsV2` si flag on).

## 8. Visites de live — diagnostic (SELECT)

| Mesure | Valeur |
|---|---|
| Lignes `live_course_daily_visits` (tout l’historique) | **0** |
| Inscriptions `enrollments` | **0** |
| Lives visio publiés 30 j | **33**, tous `course_category = group` |

**Pourquoi 0 visite**

1. `LiveVisitRecorder` appelle `record_live_course_visit` et **avale** toute erreur.
2. La RPC exige `auth.uid()`, cours publié, et `course_access_level = full`. Sans inscription, le niveau vient de `access_policies` : abo **groupe** → `full` sur visio collectif ; abo **individuel** → **`locked`** sur visio collectif (les 33 lives). Échec `forbidden` silencieux pour l’offre individuelle.
3. Si la cliente ouvre seulement `live.fitmangas.com` (Jitsi) sans la page Next `/live/[id]`, aucune visite.
4. Table RLS sans policy SELECT cliente : une lecture session verrait 0 **même si** des lignes existaient. Ici le `service_role` voit aussi 0 → **aucune écriture n’a jamais réussi**.

**Correctif proposé (non appliqué, RPC / recorder en zone interdite)** : assouplir la RPC pour aligner sur `hasVisioClientAccess` (abo visio actif), et/ou journaliser l’erreur hors `LiveVisitRecorder`. Présence ensuite = `created_at` dans [début − 15 min, fin]. Tant que 0 visite, « tu y étais » reste masqué (lot 3b).

## 9. Tests

`src/lib/notifications/v2/v2.test.ts` : destinataires, jumeaux, veille Paris/Mexico + DST 25/10/2026, fenêtre 1 h, cutoff, `group_key`, récurrence, présence, événements critiques v2.

Ciblés lot 2a + voisins : **65/65 verts**.

## Captures

- `rapports/captures/lot-2a/admin-live-recurrent.png` — aperçu `/dev/apercu/admin-live-recurrent`

## Tests / build

Build production : **vert** (~3 min 45 s, Next.js 15.5.15). Routes nouvelles : `/api/admin/cron/hourly`, `/api/admin/cron/social`.

## Mise en production

**Sans ces prérequis, ce lot ne casse rien** : drapeau off → anciens rappels visio (inscrites) ; digest quotidien plus flushé (file intacte, pas d’avalanche) ; crons existants inchangés pour Kevin.

Ordre :

1. **GO écrit** Lot 2 SQL (`PROPOSITIONS_MIGRATIONS.md`) **sauf** archivage backlog et pg_cron.
2. Appliquer colonnes + `cron_heartbeats` + `profiles.live_other_language`.
3. Poser `NOTIF_V2_CUTOFF` (env + éventuellement `admin_settings`) = horodatage du déploiement.
4. Déployer le code (drapeau **off**).
5. Vérifier / couper **cron-job.org** le jour de la bascule pg_cron (un seul déclencheur par tâche). Mettre `CRON_SECRET` dans Vault.
6. Allumer `NEXT_PUBLIC_FEATURE_NOTIF_V2=1` (Vercel + `.env.local`).
7. **GO séparé** pour l’archivage `archived_backlog`.
8. GO séparé plus tard pour le correctif visites live (zone interdite).
