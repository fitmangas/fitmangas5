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

### 2026-09-21 — Moteur connaissance de soi (remplace quiz public)
- Archive code legacy : `_archive/quiz-legacy-2026-09-21/` (inerte, non importée). `quiz_leads` **intact**.
- Moteur neuf : IPIP-50 Big Five + ECR-S attachement (`src/lib/self-knowledge/`), scoring serveur + tests.
- Public `/quiz` : teaser + lead → `self_test_results` + tags `test:big-five` / `test:attachement` sur `acq_contacts`.
- Analyse Claude si `ANTHROPIC_API_KEY`, sinon template (badge mode). Pont Stripe `checkout.session.completed` → `attachSelfTestResultsToProfile`.
- Compte `/compte/connaissance-de-soi` (+ santé + club lecture) : VisioLock active/trialing. Nav sidebar/bottom + i18n.
- Tables additives : `self_test_results`, `health_consents`, `health_score_entries`, `reading_resources`. Wearables v2 flag OFF.
- Tests : 39 self-knowledge + suite complète 277 verts.

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
- Dossier canonique figé : `Projets/fitmangas5` (pas la copie iCloud). Routine journal = **auto agent**.
- WA carte Meta : Kevin demain (carte bancaire).

### 2026-09-21 — OAuth YouTube Google Cloud OK
- Projet GCP `fitmangas-509316` : YouTube Data API v3 + écran consent FitMangas + client Web **FitMangas YouTube**.
- Redirects : `https://fitmangas.com/.../youtube/callback` + `http://localhost:3000/.../youtube/callback`.
- `YOUTUBE_CLIENT_ID` + `YOUTUBE_CLIENT_SECRET` écrits dans `.env.local` **et** Vercel (prod/preview/dev).
- **OAuth terminé** : chaîne `Alejandra Mangas` (`UCHkmseevG7-gcLcQZS5xVkQ`) → `admin_settings.youtube_social_connection` (access + refresh token).
- Deploy prod : bloqué puis corrigé (TS `conversationExternalId` dans `lead-nurture.ts`).

### 2026-09-21 — Audit YouTube + biblio CM
- YouTube : Reels only auto (défaut `alsoPublishYouTube`), description Shorts avec CTA essai 7j + UTM ; idempotence + erreurs miroir visibles au cron ; carousel/feed = pas YT (format vidéo).
- Biblio : plus de ban global « une fois utilisée = jamais ». Cover carousel ≠ future cover ; feed publié ≠ futur feed ; cover peut servir en slide 2–5.
- Manifest : +3 `produit-mobile` (pool 116). Cover reste `portraits` (identité Alejandra).
- Tests : `library-path-utils.test.ts`, `youtube-social.test.ts`.

### À faire (bloquants externes)
- [ ] **Demain** : carte Meta Billing Hub → template `quiz_essai_fitmangas` → brancher nurture WA
- [x] OAuth client Google YouTube → secrets + connexion chaîne OK
- [ ] Brancher PAT `fitmangas` en CLI git (optionnel : MCP marche)
