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

### 2026-09-23 — TikTok Live + WhatsApp paiement (en cours)

- TikTok app **Fitmangas** validée / Live (Sep 22). Clés `TIKTOK_CLIENT_*` déjà en `.env.local` + Vercel. Manque encore **OAuth compte @fit.mangas** → `tiktok_social_connection` absent en DB.
- Redirect URI attendue : `https://fitmangas.com/api/admin/community/tiktok/callback` (scopes `user.info.basic`, `video.upload`, `video.publish`).
- WhatsApp WABA toujours **BLOCKED 141006** (pas de moyen de paiement) + téléphone **DISCONNECTED** + 0 templates. Formulaire carte ouvert dans Billing Hub. Script prêt : `scripts/create-wa-template-quiz-essai.ts` (API refuse encore « non autorisé à gérer les modèles » tant que paiement/connexion OK).

### 2026-09-23 — Hub membre : passe design (DA quiz + empty engageants)

- Dashboard « Progression mensuelle » → `/compte/connaissance-de-soi/progression` (page `/compte/progression` redirige).
- DA immersive type `/quiz` : `HubSectionHero`, `HubEmptyState`, `ConsistencyChain`, `HubMilestones` ; portraits `public/library/`.
- États vides engageants (tests / progression / corps / journal / lecture) + micro-victoire / jalons.
- Affiliation : badge « Lien affilié » + tracking ; doc `docs/AFFILIATION_DEMARCHE.md` (Amazon/Fnac/Decathlon à faire côté Kevin).
- Captures UX hub membre : `/quiz/hub-membre-capture` (flag `NEXT_PUBLIC_UX_CAPTURE`, hors layout auth `/compte`).
- Logique inchangée : VisioLock, INSERT daté, banque, wearable OFF.

### 2026-09-23 — Hub membre cerveau 5 sections + progression DA + wearable stub + journal

- Hub `/compte/connaissance-de-soi` : 5 onglets (évolution · progression · tests · corps · développement). Sidebar Brain inchangé.
- Progression : DA cream/terracotta, `member_progress_monthly` + courbe recharts, cron 1er du mois. `/compte/progression` aligné.
- Tests : compare radar T0/T1 (OceanRadar dual), fix label IPIP-50/120.
- Corps : historique health en courbe ; OAuth Strava/Fitbit prêt, `WEARABLES_V2_ENABLED=false`.
- Dev perso : journal 3 champs, défis, reading + affiliate_url + « Lien affilié » + `affiliate_clicks`.
- Quiz publics : switcher FR/ES dans `SelfTestShell`.
- Migration additive `self_knowledge_member_hub_v2`. Fichiers clés sous `src/components/SelfKnowledge/compte/*`, `progress-monthly.ts`, `TrendLineChart`.

### 2026-09-22 — Self-knowledge : hub aéré corrigé (pas hyper-compact)

- Erreur : sur-compaction (photos ~96px). Corrige : layout aéré V1 restauré (FacesCloud 8 orbes, typo, paddings, textes complets) ; **seule** hauteur photo cartes = 144/160px pour CTA above fold.
- E2E desktop+mobile verts. Fichiers : `FacesCloud`, `SelfTestCardGrid`, `SelfTestHub`.

### 2026-09-22 — Self-knowledge : hub compact CTA + fond + radar + mobile

- Hub `/quiz` : photos cartes ~96–112px + FacesCloud réduit → CTA « Je commence » visibles sans scroll (desktop 1280×900) ; textes inchangés.
- Fond questions : `public/tests/questions-bg.jpg` = pièce jointe user (salle boiserie).
- PDF : padding contenu 18/16/24mm + footer/header Chromium plus généreux.
- Radar OCEAN : labels loin des points (`Stabilité` court) + pad SVG 84.
- E2E desktop + mobile (Chromium 390×844) : `e2e/self-knowledge-ux.spec.ts` + captures 01–18.
- Fichiers : `FacesCloud`, `SelfTestCardGrid`, `SelfTestHub`, `OceanRadar`, `SelfTestShell`, `SelfTestRunner`, `render-report-pdf`, `playwright.config`.

### 2026-09-22 — Self-knowledge : hub aéré + PDF serveur full-bleed + fond questions
- Hub : respiration V1 (nuage dispersé, titres/cartes espacés, portraits plus hauts).
- PDF unifié : `/quiz/print-report` + `/api/self-knowledge/pdf` (Playwright local / Sparticuz Vercel) — fond crème full-bleed `@page margin:0` ; bouton client = même moteur.
- Fond questions : `public/tests/questions-bg.jpg` (101 710 o) + voile cream ~36 % sur toute la page.
- Label Extraversion radar décalé ; capture `14-pdf-print-report-preview` + `rapport-client-api-ipip50.pdf`.

### 2026-09-22 — Self-knowledge : PDF print + questions 5/écran + fond
- PDF = print headless / html2canvas de la **vraie page rapport** (plus de jspdf texte) ; 3 fichiers `_captures/tests-ux/rapport-*.pdf`.
- Hub : cartes verticales V1 élancées côte à côte ; carrousel sous le fold.
- Questions : 5/écran desktop (2 mobile), sous-titres sur chaque bouton échelle, fond `public/tests/questions-bg.jpg` + voile cream.
- Banque : coquilles « tu n’ignores pas » / « Tu honores » ; Claude toujours OFF.

### 2026-09-22 — Self-knowledge : PDF + banque 100% + hub Typeform
- **3 PDF** générés : `_captures/tests-ux/rapport-ipip50.pdf`, `rapport-ipip120.pdf`, `rapport-attachement.pdf` (`scripts/generate-self-test-report-pdfs.ts`).
- **Analyse** : `SELF_TEST_CLAUDE_ANALYSIS` OFF par défaut → rapport 100 % banque déterministe (Claude derrière flag).
- Hub : 1er viewport = hero + cartes verticales + « Elles aussi… » vignettes ; carrousel vidéo au scroll ; 2 indicateurs (600k + ~8 min) ; sans 0,94.
- Choix profondeur : photo agrandie ; questions 1/écran Typeform ; forces attachement toujours remplies.
- Captures + MANIFEST régénérés ; Vitest self-knowledge vert.

### 2026-09-22 — Self-knowledge A–D (hub + rapports + PDF + dédup)
- **A** Hub compact (2 cartes 1er écran) ; textes bénéfice ; choix profondeur = lancement direct ; portraits `portrait-05-1x1` / `portrait-01-1x1` (object-position visage) ; questions redesign.
- **B** Phrases-clés % + pratique Pilates + micro-reco ; facettes accordéon 2 niveaux + barres (plus de /20) ; nav sticky.
- **C** PDF `build-self-test-pdf.ts` ; parrainage RGPD (`self_test_invites`, lien + email 1×) ; opt-in blog lead (double opt-in).
- **D** `promoteEmailToMemberFlow` : membre (active/trialing) > acquisition > blog_public — appelé au rattachement Stripe/checkout.
- Captures : `_captures/tests-ux/` 13 PNG (questions, PDF/parrainage). Vitest 81 ; Playwright UX vert ; build vert.

### 2026-09-22 — UX hub /quiz : grille + crédibilité + Polyvalente
- Hub : cartes **côte à côte** (`SelfTestCardGrid`) — carrousel 3D conservé mais non utilisé sur /quiz.
- Portraits coach Alejandra sur cartes/intros : `public/library/portraits/portrait-05-4x5.webp` (Big Five) + `portrait-01-4x5.webp` (Attachement). Nuage = adhérentes.
- Crédibilité positive IPIP (600 000+ / 0,94 NEO-PI-R) ; 3 indicateurs hero ; plus de « pas médical ».
- Assembleur : dédoublonnage sections ; variante **La Polyvalente** (traits ~50) FR/ES.
- Captures Playwright écrasées : `_captures/tests-ux/` (13 PNG + MANIFEST) dont profil équilibré + sans répétition.
- Fichiers : `SelfTestCardGrid.tsx`, `SelfTestHub.tsx`, `assemble-report.ts`, `banks/portraits.ts`, `e2e/self-knowledge-ux.spec.ts`.

### 2026-09-22 — UX desire hub /quiz (nuage + carrousel 3D)
- Inspirations sauvées : `docs/design-references/tests-inspiration/`
- Hub : `FacesCloud` (vraies adhérentes) + `SelfTestDepthCarousel` + `QuizVideoProof`
- Choose / intro premium ; fond cream `#FFFAF5`
- Playwright E2E + captures : `_captures/tests-ux/` (11 PNG + MANIFEST)
- Page capture `/quiz/ux-capture` (gate `NEXT_PUBLIC_UX_CAPTURE=1`)

### 2026-09-22 — Refonte résultats connaissance de soi (niveau profil-discipline)
- Banques déterministes FR/ES : 5 traits × 3 niveaux + 8 combos ; 30 facettes × 3 ; attachement anxiété/évitement + 4 styles ; portraits nommés dérivés des scores.
- Analyse : `assemble-report.ts` = source de vérité ; Claude ne fait que fluidifier (garde `assertAnalysisWithinBank`) ; sans clé = analyse **complète** (badge « Banque FitMangas »).
- Big Five au choix : IPIP-50 (~8 min) ou IPIP-NEO-120 (~20 min, 30 facettes) — écran choose + historique `test_version`.
- UI : `SelfTestReport` + `OceanRadar` (hero portrait, radar, sections, teaser public désirable, preuve sociale, export texte).
- Fichiers clés : `src/lib/self-knowledge/banks/*`, `ipip120.ts`, `assemble-report.ts`, `analyze.ts`, `SelfTestReport.tsx`, `SelfTestRunner.tsx`.
- Tests : 71 self-knowledge verts ; build prod vert. profil-discipline / Stripe / pont conversion inchangés.

### 2026-09-22 — Vérif approfondie connaissance de soi
- Pont conversion : `normalizeSelfTestEmail` + attach eq/ilike + filet `checkout-success` ; test E2E logique `conversion-bridge.test.ts` vert.
- Traductions FR/ES peaufinées (sens EN intact) — liste `docs/archive-produit/SELF_KNOWLEDGE_TRADUCTIONS.md`.
- Analyse template/Claude : cohérence ES haute ≠ anxiété ; teaser ≠ full ; cas extrêmes couverts.
- CTA teaser « Récupère ton analyse complète » → `/?offer=v-coll`.

### 2026-09-22 — Items officiels IPIP-50 + ECR-S
- Remplacé reformulations par items EN officiels + traductions FR/ES littérales (non validées).
- IPIP-50 : keying `newBigFive5broadKey.htm` (E 5− / A 4− / C 4− / ES 8− / O 3−). Facteur IV = ES (pas N).
- ECR-S : 12 items Wei 2007, Likert **1–7**, DOI `10.1080/00223890701268041`.
- Tests self-knowledge 45 + suite 283 verts.

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
