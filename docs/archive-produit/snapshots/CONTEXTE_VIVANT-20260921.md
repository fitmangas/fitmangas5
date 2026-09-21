# Contexte vivant FitMangas

Document **à compléter automatiquement** à chaque étape validée (même commit que le code).  
Objectif : qu’un nouveau chat Cursor n’ait pas besoin d’un « milliard de prompts ».

## Comment Cursor garde le contexte (lire une fois)

| Couche | Où | Rôle |
|---|---|---|
| **Rules alwaysApply** | `.cursor/rules/*.mdc` | Lu à **chaque** session — faits acquis, interdits, stack |
| **Rules globs** | idem avec `globs:` | Seulement quand tu ouvres certains fichiers |
| **User rules** | Cursor Settings → Rules | Préférences Kevin (FR, git, etc.) |
| **Ce fichier** | `docs/CONTEXTE_VIVANT.md` | Journal des validations récentes |
| **Archive produit** | `docs/archive-produit/` | Copie lisible de ce qui existe (admin, cliente, quiz…) |
| **Git + GitHub** | `main` | Source de vérité code |
| **Agent transcripts** | locaux Cursor | Historique chats (pas toujours injecté) |

**Ce qui fait buguer** : nouveau chat sans rules à jour → l’agent « réinvente » et casse.  
**Remède** : figer ici + rules + ne pas refondre sans demande.

## Routine agent (obligatoire en fin de chantier réussi)

1. Mettre à jour la section **Journal** ci-dessous (date, quoi, fichiers clés).
2. Si nouveau module : ajouter une fiche dans `docs/archive-produit/`.
3. Si fait acquis durable : une ligne dans `.cursor/rules/fitmangas-source-de-verite.mdc` ou `fitmangas-inventaire-fige.mdc`.
4. Build vert + push (compte `fitmangas` / MCP si `support811` 403).

## Journal des validations

### 2026-09-21 — Acquisition + quiz nurture
- PDF quiz : logo PNG transparent, mix page 2, anti-orphelin titres
- Nurture quiz : email immédiat + J+2/J+5 ; stop si trial/paid Stripe
- WhatsApp : tentative + `awaiting_optin` + wa.me ; reprise si elle écrit
- DM : anti-doublon mid + même texte 2 min ; plus de Mangitas ; prix → groupe 39€
- Meta : tokens retestés OK (Page ≠ IG) — ne plus dire expiré sans `scripts/check-meta-tokens.ts`
- Push : PR #2 mergeée via MCP `fitmangas` (`4f69330`)

### 2026-09-21 — Contexte Cursor + archive produit
- Rules : `fitmangas-inventaire-fige.mdc` + `AGENTS.md` + `docs/CONTEXTE_VIVANT.md`
- Archive : `docs/archive-produit/` (SURFACES, ADMIN, ESPACE_CLIENTE, QUIZ, INVENTAIRE_CODE) + copie store perso `fitmangas-archive-produit`
- Diagnostic WA live : WABA APPROVED/verified mais **`can_send_message: BLOCKED`** — erreur **141006** « payment method ». UI : « Aucun moyen de paiement ajouté ». Formulaire carte ouvert (France / EUR), en attente des coords carte Kevin.
- Push code acquisition déjà sur `main` (`4f69330` via PR #2 MCP `fitmangas`). CLI `support811` = pull only.

### 2026-09-21 — Quiz reformulations + YouTube miroir CM
- Quiz `profil-discipline` : retours cliente appliqués (Q1b/c, Q2d, Q3 libellé, Q4, Q7a/c, Q8b, Q9, Q10) — FR+ES.
- CM : miroir **YouTube Shorts** sur Reels (`youtube-social.ts`, OAuth callback, toggle UI, publish now + cron) — même modèle que TikTok.
- YouTube ≠ canal DM : **pas** de workflows acquisition type IG/Messenger/WA (adaptation : publication seulement).
- OAuth Google Cloud : compte `info@casamangas.com` bloqué temporairement (« trop de tentatives ») depuis l’automate — **YOUTUBE_CLIENT_ID/SECRET** à coller dès que OAuth client Web créé (redirect `/api/admin/community/youtube/callback`).
- Dossier canonique figé : `Projets/fitmangas5` (pas la copie iCloud). Routine journal = **auto agent**.
- WA carte Meta : Kevin demain (carte bancaire).

### À faire (bloquants externes)
- [ ] **Demain** : carte Meta Billing Hub → template `quiz_essai_fitmangas` → brancher nurture WA
- [ ] Créer OAuth client Google (YouTube Data API v3) → `YOUTUBE_CLIENT_ID` + `YOUTUBE_CLIENT_SECRET` (local + Vercel) → bouton OAuth CM
- [ ] Brancher PAT `fitmangas` en CLI git (optionnel : MCP marche)
