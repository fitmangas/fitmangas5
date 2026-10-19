# Lot 5 — Conversion et expérience

Date : 19/10/2026. Branche `chantier-oct-2026` (commit local, pas de push).

## Items non faits ou partiels

- **Table `client_followups` absente** (GO Lot 5) : colonnes « Dernière relance » et bouton « Relancée » **masqués**. WhatsApp (`wa.me`) et Email (`mailto`) fonctionnent sans envoi depuis la plateforme.
- **Noms boutique FR/ES** : table `printful_product_names` proposée, non appliquée. Pages `/boutique/[slug]` utilisent le slug dérivé du nom Printful actuel.
- **Téléphones dans D09** : pas de résolution batch Auth/Stripe (trop d’appels). WhatsApp n’apparaît que si un numéro est déjà connu ; l’aperçu `/dev/apercu/suivi-clientes` utilise des numéros fictifs.
- **Compteur « à relancer »** sur le tableau de bord admin : le bloc « Dernières clientes » a le titre, 4 lignes, pastille et le lien « Suivi des clientes → ». Le chiffre « à relancer » n’est pas recalculé sur `/admin` (évite un 2ᵉ passage lourd) ; il est sur `/admin/clients`.
- **Pixel-perfect D10** : info-bulles codées (150 ms, focus, Échap, `role="tooltip"`) ; capture d’aperçu sans survol réel. À vérifier à la souris après déploiement.
- **Feuille « Plus » D06** : barre haute + 5 onglets capturés ; la feuille ouverte n’est pas jointe (cookie / overlay local).
- **Modale essai jusqu’à Stripe test** : non enchaînée (pas de session de test, pas d’écriture live).
- **Page du live réelle** : **non ouverte** (écrirait une visite). Habillage vérifié uniquement via `/dev/apercu/live-habillage`. **Test réel par Kevin** après déploiement, hors horaire de live.
- **Styles D07** : textes dans `A_VALIDER_LOT5.courseStyles` (à valider par Alejandra, SPEC §10.7). Photos des 3 premiers styles = photos déjà publiques (espaces encodés).
- **FAQ caméra** : réponses encore marquées « à confirmer » (lot 1, enregistrement Jibri).

## Décisions prudentes

- Liens Programmes / Test de niveau / Offrir **masqués** tant que leur drapeau est off (`NEXT_PUBLIC_FEATURE_PROGRAMMES`, `NEXT_PUBLIC_FEATURE_GIFTS`). Menu public actuel : Les cours · Tarifs · Blog.
- Présentiel : `ONSITE_ENABLED` faux par défaut. Rien n’est supprimé. Points masqués côté cliente : offres landing déjà visio-only ; formules de la modale filtrées `v-*` ; lives `course_format=onsite` retirés du planning v3 et de « Cette semaine en direct » ; parrainage « présentiel » affiché comme visio collectif.
- Live D03 : **habillage seulement**. `JitsiRoomLoader` mêmes props, même ordre dans l’arbre (`LiveVisitRecorder` puis `JitsiRoomLoader`). `starts_at` ajouté au `select` existant (pas de nouvelle requête). Compte à rebours calculé côté navigateur.
- `resolveCode()` : cadeau → `/offrir/activer` ; sinon le checkout continue (promo / parrainage inchangés).
- Case d’accès immédiat **uniquement** pour Visio individuel (269 €).
- Aucun email, push, DM, WhatsApp réel. Aucune migration appliquée.

---

## Fichiers live (contrôle zone interdite)

Modifié : `src/app/live/[courseId]/page.tsx` (habillage D03 uniquement) + nouveau `src/components/Live/LiveHabillage.tsx`.

**Non touchés** : `JitsiRoomLoader`, `JitsiRoom`, `embed-config`, `/api/jitsi/*`, `LiveVisitRecorder`, `replay-switch`, config `live.fitmangas.com` / Jibri.

`git diff --name-only` : aucun autre fichier de `docs/zones-interdites.md`.

## Captures

`rapports/captures/lot-5/` : `modale-essai.png`, `planning-v3.png`, `live-habillage.png`, `comment-ca-marche.png`, `suivi-clientes.png`, `les-cours.png`, `nav-mobile.png`, `info-bulles.png`, `accueil.png`.

| Maquette | Aperçu |
|---|---|
| D01 | `/dev/apercu/modale-essai` |
| D03 | `/dev/apercu/live-habillage` (Jitsi fictif) |
| D04 | `/dev/apercu/planning-v3` |
| D05 | `/` (titre A, 3 162 / 180 conservés) |
| D06 | `/dev/apercu/nav-mobile` |
| D07 | `/dev/apercu/les-cours` + `/cours-pilates-visio` |
| D09 | `/dev/apercu/suivi-clientes` |
| D10 | `/dev/apercu/info-bulles` |

## Build

`NODE_OPTIONS=--max-old-space-size=4096 npm run build` → **vert** (~8 min 36 s). Routes `/boutique/[slug]`, `/cours-pilates-visio`, `/dev/apercu/*` présentes.

## Mise en production

1. Déployer le **code**, drapeaux Programmes / Gifts / Onsite **off** : menu public sans Test de niveau ni Offrir ; présentiel masqué ; D09 sans « Relancée ».
2. GO Kevin → SQL Lot 5 (`client_followups` + `printful_product_names`) **non appliqué ici**.
3. Relecture Alejandra : FAQ, conseil live, messages WhatsApp D09, descriptions des 6 styles.
4. Kevin teste un **vrai live** hors horaire : visio identique, micro coupé à l’entrée, plein écran.
5. Allumer `ONSITE_ENABLED=1` seulement si le présentiel doit réapparaître.
6. Sans ces prérequis : le lot ne casse rien (comportement actuel + habillage live derrière les heures déjà chargées ; D09 se greffe sur les mêmes sources).
