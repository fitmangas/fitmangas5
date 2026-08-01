# AUDIT ÉTAT PLATEFORME FitMangas

Date : 2026-07-26  
Méthode : lecture seule (code + `.env.local` + `vercel env ls` + `scripts/diag-connections.ts`)  
Aucune valeur de secret n’est reproduite (au pire 4 derniers caractères).

---

## PARTIE 5 — SYNTHÈSE (lire en premier)

**Ce qui marche**
- Stack cœur OK en local : Supabase, Stripe (mode **test**), Vimeo (quota upload OK), Resend, Printful, Mistral, Groq, Unsplash, Gemini **TEXTE**.
- CM texte : génération FR/ES par réseau, Reels face-cam + import MP4, FB miroir IG (si Meta connecté), WA/LI en **copie manuelle**.
- Gemini TEXTE répond 200 avec `GEMINI_MODEL=gemini-2.5-flash` (clé `…4cmA`).

**Ce qui est cassé**
- **Gemini IMAGE (Nano Banana) = 429 RESOURCE_EXHAUSTED** sur tous les modèles image testés. Message exact : quota `generate_content_free_tier_*`, **`limit: 0`** pour les modèles image. La clé est bien là ; le **plan free n’autorise pas** (ou plus) la génération d’images. D’où les badges POLLINATIONS / fallbacks sur les posts existants.
- Meta OAuth : `META_APP_ID` / `META_APP_SECRET` **absents** local **et** Vercel → publish IG/FB via OAuth app non bootstrappable depuis cet environnement (token manuel éventuel ailleurs).
- Cascade image actuelle : Pollinations **retiré du code de génération** mais type/badge/pollutions historiques restent ; sans Gemini Image payant, carrousels retombent biblio/Unsplash.
- Titres CM : consignes « soft/mignon » + polish fallbacks → peu bankables ; `whyItWorks` souvent hors-langue.

**5 corrections à plus fort impact (CM utilisable)**
1. **Activer la facturation Gemini / plan payant image** (ou clé projet avec quota image > 0) — sans ça Nano Banana ne marchera jamais, clé ou pas.
2. **Logger en clair dans le CM** le status/modèle/erreur Gemini Image (429/quota) au lieu d’un silence → Pollinations/biblio.
3. **Décider le filet image** (biblio only vs Pollinations conditionnel) et l’aligner code + UI (badge + message).
4. **Refonte titres/hooks bankables** (prompt + polish) ; supprimer fallbacks « geste doux ».
5. **Ranger dette UI** : panneau PHOTA standby, badge Pollinations orphelin, notes playbook obsolètes ; Meta vars si publish prod requis.

---

## PARTIE 1 — INVENTAIRE INTÉGRATIONS & ENV

Légende présence : **Local** = `.env.local` (merge `.env`) · **Vercel** = `vercel env ls` (Production/Preview/Development listés).

| Intégration | Var(s) attendue(s) | Local | Vercel | Fichiers principaux |
|---|---|---|---|---|
| Supabase | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | OUI / OUI / OUI | OUI | `src/lib/supabase/*`, admin clients |
| Stripe | `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, price IDs | OUI / OUI / **NON** / OUI | OUI (webhook + prices présents) | `src/lib/stripe/*`, `api/webhooks/stripe`, checkout |
| Vimeo | `VIMEO_ACCESS_TOKEN`, `VIMEO_CLIENT_ID`, `VIMEO_CLIENT_SECRET` | OUI | OUI | `src/lib/vimeo.ts`, `vimeo-playback.ts`, admin replays |
| Jitsi/Jibri | `JITSI_APP_ID`, `JITSI_APP_SECRET`, `JITSI_JWT_*`, `NEXT_PUBLIC_JITSI_DOMAIN`, `VIDEO_RECORDINGS_DIR`, `RECORDING_INGEST_SECRET` | OUI (JWT + domain) | OUI | `src/lib/jitsi/*`, ingest recording |
| Resend | `RESEND_API_KEY`, `NEWSLETTER_FROM_EMAIL` | OUI | OUI | `src/lib/notifications/email.ts`, newsletter |
| Meta IG/FB | `META_APP_ID`, `META_APP_SECRET` (+ token Page stocké admin_settings) | **NON** / **NON** | **NON** (absent de `vercel env ls`) | `src/lib/admin/meta-social.ts`, `api/admin/community/meta/callback` |
| Printful | `PRINTFUL_API_TOKEN`, `PRINTFUL_STORE_ID` | OUI / **NON** | OUI token (store non listé) | `src/lib/printful.ts`, webhook Printful |
| Gemini TEXTE | `GEMINI_API_KEY`, `GEMINI_MODEL` | OUI (`…4cmA`, model flash) | OUI | `ai-providers.ts`, blog, marketing, translate, SEO |
| Gemini IMAGE | **même** `GEMINI_API_KEY` ; modèles hardcodés `NANO_BANANA_MODELS` | OUI clé | OUI clé | `social-ai-image.ts`, `services/geminiService.ts` |
| Mistral | `MISTRAL_API_KEY`, `MISTRAL_MODEL` | OUI | OUI | cascade blog `ai-providers.ts` |
| Groq | `GROQ_API_KEY`, `GROQ_MODEL` | OUI | OUI | cascade blog |
| Anthropic/Claude | `ANTHROPIC_API_KEY` / `CLAUDE_API_KEY` | **NON** | **NON** | `social-reel-montage.ts` (montage serveur) |
| OpenAI | `OPENAI_API_KEY` | **NON** | **NON** | dernier fallback cascade blog |
| GA4 | `GA4_PROPERTY_ID`, `GOOGLE_SERVICE_ACCOUNT_JSON` | OUI | OUI | marketing / scripts GA |
| Search Console | `GOOGLE_SERVICE_ACCOUNT_JSON`, `GSC_SITE_URL` | SA OUI / GSC_SITE **NON** | SA OUI / GSC non listé | scripts `add-sa-to-search-console`, debug GSC |
| Pollinations | aucune clé | N/A (public) | N/A | **était** dans cascade image ; fonction retirée, type/badge encore présents |
| Unsplash | `UNSPLASH_ACCESS_KEY` | OUI | OUI | `social-ai-image.ts`, blog images |
| PHOTA (standby) | `PHOTALABS_API_KEY` | **NON** | **NON** | `phota-client.ts`, `alejandra-double.ts`, UI Double |

---

## PARTIE 2 — TESTS DE CONNEXION

Script : `scripts/diag-connections.ts`  
Commande : `npx tsx scripts/diag-connections.ts`  
Exécuté le 2026-07-26 (local, env `.env.local`).

| Intégration | Statut | HTTP | Détail |
|---|---|---|---|
| Supabase | OK | 200 | REST joignable |
| Stripe | OK | 200 | mode **test** (`sk_test…3HJW`) |
| Vimeo | OK | 200 | account standard ; quota free ≈ 4.31e12 video_size units |
| Jitsi/Jibri | PARTIEL | — | creds OK, pas de ping JWT HTTP |
| Resend | OK | 200 | domains listables |
| Meta (IG/FB) | ÉCHEC | — | `META_APP_ID` / `META_APP_SECRET` absents local |
| Printful | OK | 200 | token OK ; storeId absent local |
| Gemini TEXTE | OK | 200 | **model=`gemini-2.5-flash`** ; réponse « OK » |
| Gemini IMAGE | **ÉCHEC** | **429** | voir § critique ci-dessous |
| Mistral | OK | 200 | models list |
| Groq | OK | 200 | models list |
| Anthropic/Claude | SKIP | — | pas de clé |
| GA4 / GSC | PARTIEL | — | creds présents, pas d’appel Data API dans ce diag |
| Pollinations | OK | 200 | endpoint public répond (1584 bytes test) |
| Unsplash | OK | 200 | random photo OK |
| PHOTA | SKIP | — | pas de clé |

### Point critique — Gemini IMAGE (Nano Banana)

Appels : `POST …/v1beta/models/{model}:generateContent` avec `responseModalities: ["TEXT","IMAGE"]`.

| Modèle demandé (code exact) | HTTP | Message |
|---|---|---|
| `gemini-3.1-flash-image-preview` | 429 | `RESOURCE_EXHAUSTED` — quota `generate_content_free_tier_requests` **limit: 0**, model `gemini-3.1-flash-image` |
| `gemini-3.1-flash-image` | 429 | idem, limit: 0 |
| `gemini-2.5-flash-image` | 429 | idem, model résolu `gemini-2.5-flash-preview-image`, limit: 0 |
| `gemini-3-pro-image-preview` | 429 | idem, model `gemini-3-pro-image`, limit: 0 |

**Pourquoi ça échoue en prod alors que la clé est présente**  
La clé fonctionne pour le **texte**. Les modèles **image** renvoient explicitement un dépassement de quota **free tier avec limite 0** (= pas de capacité image sur ce plan / cette clé). Ce n’est pas un oubli de variable Vercel. En génération CM, `generateWithGeminiImageModel` échoue en silence (`continue` / return null) → bascule historique vers Pollinations (posts déjà générés) ou biblio/Unsplash (code actuel).

---

## PARTIE 3 — CONSO / QUOTA GEMINI

### Points d’appel Gemini (texte)

| Zone | Fichier | Modèle |
|---|---|---|
| Cascade blog titres/contenu | `src/lib/blog/ai-providers.ts` | `GEMINI_MODEL` défaut code `gemini-2.0-flash` ; **local réel = `gemini-2.5-flash`** |
| Traduction blog | `src/lib/blog/translate.ts` | idem |
| Topics éditoriaux | `src/lib/blog/editorial-topics.ts` | idem |
| SEO article admin | `src/app/admin/blog/actions-article-seo.ts` | idem |
| Marketing AI advisor / editorial / diagnostic | `actions-ai-advisor.ts`, `actions-editorial.ts`, `actions-global-diagnostic.ts` | idem |
| Business AI admin | `src/app/admin/actions-ai-business.ts` | idem |
| CM génération posts JSON | `src/app/admin/community/actions.ts` → `runBlogAiCascade` | texte via cascade |

### Points d’appel Gemini (image)

| Zone | Fichier | Modèles |
|---|---|---|
| CM stills / carrousels / bouton Visuel | `src/lib/admin/social-ai-image.ts` | `gemini-3.1-flash-image-preview`, `gemini-3.1-flash-image`, `gemini-2.5-flash-image`, `gemini-3-pro-image-preview` |
| Service legacy | `src/services/geminiService.ts` | `gemini-3.1-flash-image-preview` (+ analyse `gemini-3.1-flash-preview`) |

### Même clé texte + image ?

**Oui.** Une seule `GEMINI_API_KEY` pour tout.  
Risque : le quota **free** image est déjà à 0 ; le texte peut encore passer (observé). Saturation croisée possible sur un projet facturé (RPM/RPD partagés), mais le symptôme actuel CM n’est pas « blog a mangé le quota texte » — c’est **image free tier = 0**.

### Modèles : existent-ils encore ?

- Texte `gemini-2.5-flash` : **oui**, 200 OK au diag.
- Image listés ci-dessus : l’API les **reconnaît** (pas 404 modèle inexistant) mais refuse avec **429 free_tier limit 0**. Donc « existent » côté routing Google, **non utilisables** sur cette clé/plan.

---

## PARTIE 4 — PAGE COMMUNITY MANAGER (état réel)

Fichiers lus : `social-comms.ts`, `social-cm-playbook.ts`, `social-week-planner.ts`, `social-ai-image.ts`, `meta-social.ts`, `alejandra-double.ts`, `phota-client.ts`, `actions.ts`, `CommunityManagerBoard.tsx`, routes `api/admin/community/*`.

### Réseaux : câblés vs factices

| Réseau | Génération slots | Publish auto | Réalité |
|---|---|---|---|
| **Instagram** | OUI (reels, carousel, feed) | OUI via Graph API si Meta token | **Câblé** (dépend Meta) |
| **Facebook** | PAS de slots ; miroir `alsoPublishFacebook` | OUI miroir après IG | **Câblé miroir** (pas de contenus FB séparés) |
| **WhatsApp** | OUI (text teasers blog) | NON — message « copie manuelle » | **Semi** : contenu oui, API publish non |
| **LinkedIn** | OUI + toggle adaptation | NON — copie manuelle | **Semi** |
| **TikTok** | slots si filtre TikTok | NON — « arrive plus tard » | **UI + slots, publish mort** |

Routes API community :
- `meta/callback` — OAuth Meta
- `cron/publish-scheduled` — due posts Meta
- `upload-reel` / `render-reel` — média Reel

### Cascade image — flux réel (code actuel)

Ordre dans `generateSocialPhotoForPost` :
1. Si PHOTA READY → `/generate` PhotoLabs (clé absente → jamais en pratique)
2. Gemini Nano Banana (`forceNanoBanana` pour carousel / bouton Visuel)
3. Bibliothèque (si `preferLibrary`)
4. Gemini à nouveau si pas forcé avant
5. Unsplash (si autorisé)
6. Bibliothèque même déjà utilisée
7. Échec

**Pollinations** : fonction de génération **retirée** du fichier ; le type `SocialImageProvider` / badge UI / mapping `pollinations` **restent**. Les posts déjà générés peuvent encore afficher le badge POLLINATIONS (données historiques).

Badge provider : `socialImageProviderLabel` + pastilles dans `PostCard` (`ai` → « Nano Banana 2 / Double », `pollinations`, `library`, `unsplash`).

### Code mort / contradictoire (prompts empilés)

| Élément | État réel |
|---|---|
| Anti-nudité dans `SOCIAL_EDITORIAL_IMAGE_BASE_PROMPT` | Présent (« FULLY CLOTHED… ») — **hors brief user** (vrai problème = anatomie cassée) |
| Double filtre LANGUE Toutes/FR/ES | **Retiré** de l’UI ; reste **Générer FR/ES** |
| Panneau Double / PHOTA | **Toujours dans l’UI** alors que produit en standby + clé absente |
| Refs « Double » Gemini (4 portraits) | Code actif si `enabled` ; inutile tant que Gemini Image 429 |
| Fallbacks titres mignons | `polishPostTitle` → « Un geste doux… » / ES « Un gesto suave… » |
| `whyItWorks` anglais | Prompt dit « langue du post » ; pas d’enforcement post-parse |
| Playbook `CM_STRATEGY_NOTES` | Dit encore « Gemini → Pollinations » alors que Pollinations retiré du générateur |
| TikTok onglet | Générable en slots mais publish refusé |
| Meta OAuth | Code prêt ; **env absente** local + Vercel |

### À GARDER / À SUPPRIMER / SE CONTREDIT

**À GARDER**
- Génération par réseau + locales FR/ES
- Miroir FB, Reels face-cam + import MP4, calendrier multi-couleurs
- Cascade blog texte Gemini→Mistral→Groq
- Structure Meta publish (une fois env/billing OK)
- Biblio photos Alejandra comme filet fiable

**À SUPPRIMER (ou masquer jusqu’à décision)**
- Panneau PHOTA/Double en standby (ou le cacher derrière flag)
- Badge/provider Pollinations orphelin + notes playbook obsolètes
- Fallbacks titres « geste doux »
- Prompt anti-nudité non demandé (ou le remplacer par contrainte **anatomie complète / membres visibles**)
- Onglet TikTok publish mort (ou le marquer explicitement « bientôt »)

**SE CONTREDIT**
- « Nano Banana 2 » présenté comme moteur CM vs réalité **429 free image**
- Playbook « Pollinations filet » vs code sans Pollinations
- UI Double « entraînement visage » vs pas de clé PHOTA + Gemini image mort
- Titres « Instagrammables » vs polish qui pousse soft/mignon
- TikTok dans le filtre réseau vs « arrive plus tard » au publish

---

## ANNEXES

### Comment rejouer le diag
```bash
npx tsx scripts/diag-connections.ts
```

### Build
`NODE_OPTIONS=--max-old-space-size=4096 npm run build` — **OK** (exit 0, 2026-07-26).  
Le script `scripts/diag-connections.ts` est isolé et n’entre pas dans le bundle Next.
