# Lot 2b — Notifications : écrans et emails

Date : 19/10/2026. Branche `chantier-oct-2026` (commit local, pas de push).

## Items non faits ou partiels

- **Pixel-perfect emails A01–A06 vs JPG** : gabarit v2 (tables, fond `#F5F0EB`, carte 28px, Playfair/Georgia italique, bouton Outlook, Instagram `@fit.mangas`, pas de SVG ni `<link>`). Les maquettes HTML ont un bloc date / agenda Google-Apple-Outlook plus riche : reporté (textes et CTA « Rejoindre » / planning sont là). Images d’en-tête = photos d’assets recopiées dans `public/email/` (pas un recadrage 1:1 de chaque JPG).
- **Préférences** : matrice affichée (défauts SPEC) ; **sauvegarde des nouvelles colonnes** impossible tant que la migration Lot 2 n’est pas appliquée. Opt-in marketing = colonne existante. Section Programme **masquée** (`NEXT_PUBLIC_FEATURE_PROGRAMMES` off).
- **« Tout marquer comme lu »** : lien vers la page ; l’action serveur existante n’est pas rebranchée en bouton client (à finaliser si le drapeau s’allume).
- **Compteurs 7 jours / erreurs admin santé** : structure A10 ; totaux réels 7 j encore à 0 tant que le drapeau est off (pas d’envoi v2).
- **Barre mobile neuve** : non construite (lot 5), même si elle apparaît sur les JPG A08/A09.
- Aperçu emails `/admin/sante/apercu-emails` : **404 tant que le drapeau est off** (option prudente). Les aperçus `/dev/apercu` fonctionnent sans drapeau.

## Décisions prudentes

- Tout derrière `NEXT_PUBLIC_FEATURE_NOTIF_V2` (off) : gabarit v2, centre, préférences dédiées, `/admin/sante`. Sans drapeau : emails chrome actuel (IG déjà corrigé `@fit.mangas`), inbox actuelle, `/compte/preferences` redirige encore vers le profil.
- Désinscription signée (HMAC `CRON_SECRET` / `NOTIF_UNSUB_SECRET`) sans connexion, + `List-Unsubscribe` seulement sur les emails **non transactionnels** v2.
- Handle Instagram corrigé dans **les deux** gabarits (l’ancien `@fitmangas` était faux).

---

## 1. Gabarit email v2

`src/lib/email/base-template.ts` → `wrapResendEmailV2`. Modèles A01–A06 : `src/lib/email/v2-templates.ts`, branchés depuis `sendDispatcherEmail` si drapeau on. « Ta semaine » omet le bloc programme si lot 3 inactif.

## 2–3. Prévisualisation

`/admin/sante/apercu-emails` (admin + drapeau) : iframe desktop + 390px, FR/ES, données fictives.

## 4. Centre A08

`NotificationsCenterV2` : périodes, filtres, icônes, CTA, vignettes, colonne droite. Cloche du top bar → lien `/compte/notifications` (plus de `NotificationBell`) si drapeau on.

## 5. Préférences A09

Page `/compte/preferences` si drapeau on. Tutoiement. Téléphone = push, jamais SMS.

## 6. Santé A10

`/admin/sante` + item rail `Activity` si drapeau on. Alertes lives / backlog, heartbeats, envois 7 j, erreurs (emails masqués).

## Captures

`rapports/captures/lot-2b/` : `centre-notifications.png`, `preferences-notifications.png`, `admin-sante.png`.

## Tests / build

Tests jeton désinscription + voisins : **30/30 verts**. Build production : **vert** (~4 min, Next.js 15.5.15). Routes : `/admin/sante`, `/admin/sante/apercu-emails`, `/api/notifications/unsubscribe`.

## Mise en production

**Sans prérequis, rien ne change** (drapeau off).

1. GO SQL Lot 2 (colonnes prefs / `user_notifications` / heartbeats).
2. Déployer le code, drapeau **off**.
3. Vérifier `/dev` n’est pas exposé (déjà bloqué hors local).
4. Allumer `NEXT_PUBLIC_FEATURE_NOTIF_V2=1` (Vercel + `.env.local`).
5. Relire les 6 emails dans `/admin/sante/apercu-emails` avant d’annoncer aux clientes.
