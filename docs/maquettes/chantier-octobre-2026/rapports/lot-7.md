# Lot 7 — Croissance : améliorer sans rien supprimer

Date : 19/10/2026. Branche `chantier-oct-2026` (commit local, pas de push).

## Items non faits ou partiels

- **`CROISSANCE_V2` éteint** (vide dans `.env.local`). Couper le drapeau = comportement actuel. Aucun message réel envoyé (`EMAIL_SAFE_MODE=on`, sandbox acquisition, aucune route cron appelée).
- **Table `acq_team_accounts`** : SQL dans `PROPOSITIONS_MIGRATIONS.md` (Lot 7), **non appliqué**. Sans elle, l’interrupteur « Inclure les tests » n’est qu’un rappel visuel : il ne recalcule pas encore GA4 / Stripe / tous les KPI. Le filtre « Afficher les tests » masque bien les fils démo dans Conversations.
- **Alerte de doublon au clic « Programmer »** : similarité Jaccard câblée et listée sur le bandeau Publications ; le bouton « Programmer quand même » (`A_VALIDER_LOT7.scheduleAnyway`) n’est pas encore un dialogue de confirmation sur l’action de programmation. Option prudente : on n’a pas touché au flux de publication existant.
- **Guides par thème** : pages `/blog/guides/respiration`, `/seances-courtes`, `/progresser` listent les articles. Les articles eux-mêmes n’affichent pas encore un lien retour vers le guide (aucun HTML d’article modifié).
- **160 €** : marqué « à sourcer » dans l’UI, **pas sourcé**.
- **Règle 01f** : reste `enabled: false` (inchangée, RÈGLE N° 1).
- **Onglets admin réels** : pas de session de test → captures via `/dev/apercu/croissance-v2` (données fictives) + page guide publique. Pas de capture avant/après de `/admin/croissance`.
- **Relecture Alejandra** de `croissance-messages.md` : à faire avant d’allumer le drapeau.
- **« Inclure les tests » sur tous les compteurs** : partiel jusqu’au GO de la table équipe.

## Décisions prudentes

- Overlay **en mémoire à la lecture** : le catalogue DB (43 identifiants) n’est pas réécrit. Drapeau off → mots-clés et textes actuels.
- Test « prix = 1 règle par canal » : on ignore le catch-all DM sans mot-clé (concierge, priorité 0). Ce n’est pas une règle « prix ».
- Nantes : l’action `book_session_intent` reste dans le code ; en V2, l’exécution de **cette règle** envoie le texte perso + escalade, sans lien d’essai. La fonction de réservation n’est pas retirée du moteur.
- Fenêtre d’envoi : 9:00 inclus, 20:00 exclus ; fuseau FR = `Europe/Paris`, MX = `America/Mexico_City` (changement d’heure 25/10 couvert par les tests).
- Aucune campagne ads créée. Idée « avant / après » remplacée dans le plan par le témoignage vidéo (item additif).

## Preuve : 43 règles

`WORKFLOW_CATALOG_COUNT` = 43 avant et après overlay. Les identifiants overlayés = les identifiants du catalogue (test unitaire). 01f reste désactivée.

Tests lot 7 : `send-window` + `croissance-v2` + `follow-gate` → **18/18**.

## 12.1 Vue d’ensemble

- Entonnoir de référence en tête (visites GA4 → clics essai → essais Stripe → payantes `active` hors essai → rétention 90 j). Les deux entonnoirs existants restent dessous.
- « Rétention 90 j » : `X % · n sur prev`.
- Accroches : 1 ligne par `post_id` (dernier `fetched_at`) ; graphemes via `Array.from`.
- Checklist technique repliée si tout vert (« Tout est connecté »).
- Définition unique `isPaidSubscriptionStatus` (`active` seulement) + hint ARPU. SEO MRR existant compte encore essai + actif (partiel).

## 12.2 Conversations

- Étiquette « Test » + filtre « Afficher les tests » (off par défaut).
- Story émoji / émotionnel : texte chaleureux sans essai + escalade + annulation des relances (V2).
- Tags `equipe` / `équipe` / `prestataire` / `vendor` exclus des leads chauds (V2).
- Liste : waiting/open en haut.

## 12.3 Workflows

- Une relance à la fois : `cancelScheduledFollowups` puis insert, clamp 9–20 h.
- Textes `croissance-messages.md` via overlay + `copy-bilingual` / `trial-url` (V2). Intents / concierge / follow-gate listés dans `A_VALIDER_LOT7`.
- Gate : jamais devant prix / essai (V2). Gate avec `appendTrialLink: true`.
- Post-partum : pas de relance, pas de lien, escalade.
- Moteur : vue liste par défaut + « Voir le détail ».

## 12.4 ADS

- Plan : `create-video-temoignage-3sem` (additif). Accroches santé reformulées dans `A_VALIDER_LOT7.healthHooksPositive`.
- Bloc « Avant le premier euro » (GA4 / Pixel : reçu ou pas encore).

## 12.5 Publications

- Bandeau : À filmer, posts bloqués « en cours » (Réessayer / Remettre en brouillon), alertes doublon > 80 % / 60 j, « 160 € — à sourcer », jargon derrière « ? ».
- CTA « Essai gratuit 7 jours » : `mergeCaptionWithCta` + `stripDuplicateTrialCta` (test).

## 12.6 SEO

- Aucun article supprimé, fusionné, ni d’adresse changée.
- Alerte sujet proche dans le calendrier éditorial.
- Pages guides (liste seulement).
- Titre article : suffixe `| FitMangas` retiré avant metadata (évite le double).
- Cache 1 h GSC/GA4. Temps moyen > 30 min → « — ».
- Slugs nouveaux : `slugifyBlog` déjà lisible (existant). Adresses actuelles intactes.

### Newsletter (vérification code, pas d’envoi)

`sendNewsletterConfirmationEmail` envoie (ou journalise hors provider) un mail **« Confirme ton inscription newsletter FitMangas »** avec bouton + URL `/api/client/newsletter/confirm?token=…`. Double opt-in déjà en place. Hors prod : `EMAIL_SAFE_MODE` redirige / journalise. **Aucun mail réel envoyé pendant ce lot.** À tester après déploiement : s’inscrire avec un e-mail à toi, confirmer le lien, vérifier `newsletter_subscriptions.confirmed`.

### GA4 — trafic interne (aucun code)

1. GA4 → Admin → Flux de données → **Filtres de données** → créer « Trafic interne ».
2. Règle : IP du bureau / du Mac (et VPN si tu en as un).
3. Tester en « Test » puis passer en « Actif ».
4. Attendre 24–48 h avant de lire les conversions `trial_started` / `purchase` (lot 6).

## Captures

- `rapports/captures/lot-7/croissance-v2.png` — aperçu `/dev/apercu/croissance-v2`
- `rapports/captures/lot-7/apercu-index.png` — index des aperçus
- `rapports/captures/lot-7/guide-respiration.png` — `/blog/guides/respiration` (public)

## Build

`NODE_OPTIONS=--max-old-space-size=4096 npm run build` → **vert** (~4 min 34 s). Route `/blog/guides/[theme]` présente.

## Mise en production

Sans ces prérequis, **ce lot ne casse rien** : drapeau off = site actuel.

1. Déployer la branche **drapeaux éteints** (`CROISSANCE_V2` vide). Overlay inactif.
2. Alejandra relit `docs/maquettes/chantier-octobre-2026/croissance-messages.md` + `A_VALIDER_LOT7`.
3. GO Kevin sur SQL `acq_team_accounts` si tu veux des compteurs sans l’équipe (sinon le code marche déjà).
4. Quand les textes sont validés : `CROISSANCE_V2=1` (Vercel + `.env.local`) et **redéploiement** (pas de `NEXT_PUBLIC_`, changement runtime).
5. Vérifier un fil sandbox : prix = une réponse, story émoji sans lien d’essai, Nantes sans essai, pas d’envoi hors 9–20 h.
6. GA4 : filtre trafic interne + événements clés (lot 6). Newsletter : un opt-in test.
7. Ne pas lancer de dépense ads. Ne pas activer 01f.
