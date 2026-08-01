# AUDIT v4 — FitMangas Community Manager (images / texte / Meta / perf)

Date : 2026-07-26 · Lecture seule (sauf règle Cursor, `/tmp/audit-images/`, ce fichier) · Aucun commit / deploy / migration.

## Synthèse (≤20 lignes)

| provider | modèle | qualité (1-5) | résolution max | coût/image | anatomie | verdict |
|---|---|---|---|---|---|---|
| Gemini API | gemini-2.5-flash-image | — | — | free_tier **limit:0** | NT | **JETER** (jusqu’à billing) |
| Gemini API | gemini-3.1-flash-image | — | — | free_tier **limit:0** | NT | **JETER** (jusqu’à billing) |
| Gemini API | gemini-2.0-flash-preview-image-generation | — | — | 404 not found | NT | **JETER** |
| Gemini API | gemini-3-pro-image(-preview) | — | — | free_tier **limit:0** | NT | **JETER** (paywall free) |
| Imagen `:predict` | imagen-3.0 / 4.0-* | — | — | 404 « no longer available to new users » | NT | **JETER** |
| Vertex AI | flash-image (projet `fitmangas`) | — | — | 403 API désactivée / 401 clé | NT | **JETER** (pas exploitable) |
| Cloudflare | flux-1-schnell | — | — | env absentes | NT | **GARDER en option** (à activer) |
| Bibliothèque | photos Alejandra | 4–5 | jusqu’à 3712×5568 | 0 € | OUI (réel) | **GARDER** (fallback #1) |

**Cascade image recommandée (preuves)** : 1) **biblio Alejandra** (seule source qui produit vraiment une image aujourd’hui) → 2) **activer facturation Gemini AI Studio** puis Nano Banana Flash (`gemini-2.5-flash-image` / `3.1-flash-image`) avec prompt cadrage partiel → 3) **Cloudflare FLUX** si clé Workers AI → 4) jamais Pollinations. Vertex non exploitable tant que `aiplatform.googleapis.com` n’est pas activé + billing. Aucune image sauvée dans `/tmp/audit-images/*.png` : **0 provider OK**.

**Cascade texte recommandée** : 1) **Gemini `gemini-2.5-flash`** (200 OK, titres FR/ES générés ; `thinkingBudget:0` sinon MAX_TOKENS) → 2) Claude si `ANTHROPIC_API_KEY` un jour → **absente aujourd’hui**. Titres Gemini encore trop « lyrical / guerrière » vs brief bankable — prompt à resserrer, pas de changement de provider tant que Claude n’est pas là.

---

## ÉTAPE 0 — Règle Cursor

- Source lue : `~/Downloads/fitmangas-source-de-verite-v4.md`
- Créé : `.cursor/rules/fitmangas-source-de-verite.mdc` (**273 lignes**, `alwaysApply: true`)
- Anciennes v2/v3 : aucune trouvée (seul autre fichier : `fitmangas-community-reels.mdc`, conservé)

---

## 1) Facturation Google

| Question | Résultat |
|---|---|
| Projet rattaché à `GEMINI_API_KEY` | **Non lisible via la clé AI Studio** (pas de project id dans ListModels / headers). |
| Projet Cloud connu (SA analytics) | **`fitmangas`** · project number **`347088365316`** · SA `fitmangas-analytics@fitmangas.iam.gserviceaccount.com` (GA4/GSC — **pas prouvé** = projet de la clé Gemini). |
| Compte de facturation / free / Prepay | **Non confirmable** : Cloud Billing API **403** (API non activée / droits SA insuffisants). |
| Signal quota | Tous les modèles **image** Gemini : `429` · `generate_content_free_tier_*` · **`limit: 0`**. Texte Flash : OK sur `gemini-2.5-flash` (tier `standard` dans usageMetadata). |
| 2e clé API | Inutile : limites au **compte de facturation / projet**, pas à la clé. |

**Action humaine** : Google AI Studio → projet de la clé → Billing / Paid tier ; ou Cloud Console projet Gemini → lier un billing account et créditer.

---

## 2) Modèles image — résultats bruts

Prompt de référence validé (editorial Pilates, 4:5, mains + épaule, terracotta, etc.) — identique pour tous.

### Flash (gratuits annoncés)

| modèle | HTTP | message exact (extrait) | résolution |
|---|---|---|---|
| `gemini-2.5-flash-image` | **429** | Quota exceeded … `free_tier_requests, limit: 0, model: gemini-2.5-flash-preview-image` (+ input_token_count limit:0) | — |
| `gemini-3.1-flash-image` | **429** | … `limit: 0, model: gemini-3.1-flash-image` | — |
| `gemini-2.0-flash-preview-image-generation` | **404** | `models/… is not found for API version v1beta` | — |

### Pro (paywall)

| modèle | HTTP | message | résolution |
|---|---|---|---|
| `gemini-3-pro-image-preview` | **429** | free_tier … `limit: 0, model: gemini-3-pro-image` | — |
| `gemini-3-pro-image` | **429** | idem limit:0 | — |

### Imagen `:predict` (quota différent de generateContent)

| modèle | HTTP | message |
|---|---|---|
| `imagen-4.0-generate-001` | **404** | `This model … is no longer available to new users` |
| `imagen-4.0-fast-generate-001` | **404** | (corps vide / parse fail en 1er run ; même famille) |
| `imagen-3.0-generate-001` / `002` | **404** | not found / not supported for predict |

### Vertex AI

| essai | HTTP | détail |
|---|---|---|
| AI Studio key → Vertex | **401** | `API keys are not supported by this API` |
| SA projet `fitmangas` → `aiplatform` | **403** | `aiplatform.googleapis.com` **disabled** sur le projet |
| Express Mode gratuit 1000/j | **Non exploitable** sans activer Vertex + auth OAuth/SA | |

### Cloudflare Workers AI

- `CLOUDFLARE_ACCOUNT_ID` / `CLOUDFLARE_API_TOKEN` : **absents** (local).
- Test `@cf/black-forest-labs/flux-1-schnell` **1024×1280** : **SKIP**.

**Procédure création** :
1. Cloudflare Dashboard → Workers & Pages → Account ID (copie).
2. My Profile → API Tokens → Create Token → template **Workers AI** (ou custom : `Account` → Workers AI → Edit).
3. Ajouter dans `.env.local` + Vercel : `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`.
4. Endpoint : `POST https://api.cloudflare.com/client/v4/accounts/{id}/ai/run/@cf/black-forest-labs/flux-1-schnell` avec `{ prompt, width:1024, height:1280 }`.

Raw JSON : `/tmp/audit-images/audit-v4-raw.json`.

---

## 3) Livrable visuel

**Aucune image PNG générée** — dossier `/tmp/audit-images/` ne contient que logs/JSON/titres.

| chemin attendu | statut |
|---|---|
| `/tmp/audit-images/gemini-*-*.png` | **absent** (429/404) |
| `/tmp/audit-images/imagen-*-*.png` | **absent** (404) |
| `/tmp/audit-images/vertex-*-*.png` | **absent** (401/403) |
| `/tmp/audit-images/cloudflare-flux-1-schnell.png` | **absent** (env) |

Anatomie / temps / coût / résolution : **N/A** faute d’image.

---

## 4) Règle anatomie (cadrage serré vs full body)

**Non testable** — 0 provider image OK. Variantes (a) plank full body / (b) hands close-up **non exécutées**.  
Verdict empirique reporté : impossible de confirmer ici ; la source de vérité v4 reste la règle opérationnelle à retester dès qu’un provider image répond 200.

---

## 5) Texte — comparaison à l’aveugle

`ANTHROPIC_API_KEY` : **absente** → une seule série (Gemini). Pas de A/B marque.

### Série unique (juge la copie)

**FR**
1. Ton dos hurle après la journée ? Le canapé t'engloutit ? Libère ta colonne, deviens fluide.
2. Le ventre mou, c'est ton quotidien ? Tes muscles fantômes ? Active ton noyau, sculpte ta force invisible.
3. La raideur te guette au réveil ? Tes articulations craquent ? Déverrouille-toi, retrouve une liberté de mouvement sauvage.
4. Tu te sens lourd, engourdi par l'inactivité ? Ton corps te trahit ? Éveille ta puissance, allège-toi comme une plume de guerrière.
5. Posture affaissée, énergie en berne ? Ton corps te lâche ? Redresse-toi, rayonne d'une prestance inébranlable.

**ES**
1. ¿Tu espalda grita después del día? ¿El sofá te engulle? Libera tu columna, vuélvete fluido.
2. ¿El vientre flácido es tu día a día? ¿Tus músculos fantasma? Activa tu núcleo, esculpe tu fuerza invisible.
3. ¿La rigidez te acecha al despertar? ¿Tus articulaciones crujen? Desbloquéate, recupera una libertad de movimiento salvaje.
4. ¿Te sientes pesado, entumecido por la inactividad? ¿Tu cuerpo te traiciona? Despierta tu poder, aligérate como una pluma de guerrera.
5. ¿Postura encorvada, energía baja? ¿Tu cuerpo te falla? Endereza tu cuerpo, irradia una presencia inquebrantable.

Fichier : `/tmp/audit-images/titles-gemini.txt` · modèle `gemini-2.5-flash` + `thinkingBudget:0`.

---

## 6) Meta — vérification factuelle

Stockage : `admin_settings.key = meta_social_connection` · `connected: true` · token présent (`…ZDZD`).

| check | résultat |
|---|---|
| Page Access Token en base | **Oui** |
| Valide ? | **Non — expiré** le **21-Jul-26 01:00 PDT** (`OAuthException` 190 / subcode **463**) |
| Page ID | `104974608387991` |
| IG User ID | `104974608387991` |
| IDs identiques ? | **Oui — anormal** (Page Facebook ≠ IG Business User ID en Graph ; ici même valeur collée dans les 2 champs) |
| GET `/me/accounts` | **400** token expiré (message exact ci-dessus) |
| GET `/{page_id}?fields=instagram_business_account` | **400** idem |

Tant que le token n’est pas renouvelé, impossible de démêler Page ID vs IG User ID via Graph.

---

## 7) Données de performance (boucle d’apprentissage)

### Récupérable aujourd’hui (API / code)

| métrique | IG Insights Graph | GA4 | dans le CM aujourd’hui |
|---|---|---|---|
| reach | oui (media insights, token + ig media id) | non (site) | **non branché** |
| saves | oui (`saved`) | non | **non** |
| shares | partiel / selon type média | non | **non** |
| watch time / plays | oui Reels (`ig_reels_aggregated_all_plays_count`, `views`, etc. selon version Graph) | non | **non** |
| pages vues / conversions | non | oui (admin Marketing) | hors CM posts |

### Lien post généré ↔ performance

- `SocialPost.metaExternalId` / `facebookExternalId` existent (id média après publish).
- **Aucun** fetch Insights, **aucune** table/metrics snapshot, **aucun** job de sync.
- Minimum à stocker : `postId` interne · `igMediaId` · `permalink` · `publishedAt` · snapshot périodique `{ reach, saved, shares, views, avgWatchTime?, fetchedAt }` · `locale` · `format` · `imageSource`.

---

## 8) Bibliothèque `public/library/`

**Total images : 23** (+ 3 HEIC dans `raw/heic`, non comptés comme images web).

| sous-dossier | fichiers | dimensions typiques | natif 1:1 | natif 4:5 | note |
|---|---|---|---|---|---|
| `alejandra/` | **8** | 3088×2316 → 3712×5568 | **0** | **0** | 5 verticales ~2:3 **croppables → 4:5** ; 3 paysages 4:3 |
| `espace-client/` | **5** | desktop ~16:9, mobile ~9:16 | 0 | 0 | UI product — pas feed lifestyle |
| `landing/avatars/` | **3** | 256×256 | **3** | 0 | trop petits pour feed |
| `replays/captures/` | **7** | 5568×3712 | 0 | 0 | captures cours, pas 4:5 |
| `raw/heic/` | 3 HEIC | — | — | — | source brute |

**Exploitables feed (après crop)** : portraits + exercices verticaux Alejandra (min side ≥ 3656).  
**Pas exploitables tels quels en 1:1 / 4:5 natifs** : aucun fichier library n’est déjà en 4:5 ; seuls les avatars 256² sont 1:1 (insuffisants).  
Cible source de vérité « ~60 photos / 8 dossiers » : **loin** (23 fichiers, 4 dossiers utiles).

Inventaire JSON : `/tmp/audit-images/library.json`.

---

## 9) Recommandations opérationnelles (ordre)

1. **Créditer / activer billing** sur le projet Gemini de `GEMINI_API_KEY` (seule voie pour Flash image — limit:0 confirmé même hors Pro).
2. **Renouveler Meta token** + séparer Page ID ≠ IG User ID via `/me/accounts` puis `instagram_business_account`.
3. **Cloudflare FLUX** comme filet si Gemini image reste bloqué.
4. Garder **biblio Alejandra** en fallback immédiat ; enrichir library 4:5.
5. Texte : rester Gemini ; durcir prompt anti-filler (« guerrière / plume / sauvage ») ; ajouter Claude quand clé dispo pour A/B réel.
6. Perf : brancher Insights sur `metaExternalId` (minimum §7).

---

## Annexes

- Raw tests : `/tmp/audit-images/audit-v4-raw.json`
- Titres : `/tmp/audit-images/titles-gemini.txt`
- Library : `/tmp/audit-images/library.json`
- Build : voir sortie `NODE_OPTIONS=--max-old-space-size=4096 npm run build` en fin d’audit.
