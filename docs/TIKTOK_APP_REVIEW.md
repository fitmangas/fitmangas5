# TikTok App Review — FitMangas (Content Posting / Direct Post)

> Objectif : même flux que IG / FB / YouTube Shorts — publier un Reel monté **directement** sur le TikTok du créateur connecté (`video.publish`), pas seulement un brouillon inbox.

## Ce que le refus signifie vraiment

Message reviewer :

> Applications intended for **personal use** or **internal company use** are not eligible for approval.

Ce n’est **pas** « pro vs perso » au sens marque / facture.  
Chez TikTok, « personal / internal » = **outil limité à toi / ton équipe pour gérer vos comptes**.  
« Publier de l’interne vers mon compte TikTok public » = exactement ce cas interdit (guidelines Content Sharing).

Ce qu’ils veulent : une app **ouverte à des créateurs** qui publient **leur** contenu original sur **leur** TikTok via OAuth.

Référence : [Content Sharing Guidelines](https://developers.tiktok.com/doc/content-sharing-guidelines) — *Not acceptable: A utility tool to help upload contents to the account(s) you or your team manages.*

## État technique FitMangas (réel)

| Élément | État |
|---|---|
| Clés `TIKTOK_CLIENT_KEY` / `SECRET` | Présentes |
| App Production | **Live depuis le 12/10/2026** (app `7685356596200900629`) |
| OAuth `@fit.mangas` | **Reconnecté 12/10/2026** — scopes `video.publish` + `video.upload` + `user.info.basic` |
| `TIKTOK_REQUEST_VIDEO_PUBLISH` | **=1** (local + Vercel) |
| Code publish Reel | Déjà dans `src/lib/admin/tiktok-social.ts` |

## Statut (13/10/2026)

**Production = Live.** OAuth `@fit.mangas` OK (`video.publish` + `video.upload`).  
**Audit Content Posting** : **soumis** le 13/10/2026 (formulaire Apply → réponse TikTok 2–4 semaines).  
**UX Direct Post** : panneau consentement CM (`TikTokDirectPostComposer`) — `creator_info`, privacy sans défaut, Comment/Duet/Stitch, disclosure, Music Usage. Obligatoire avant publish (`tiktokDirectPost` sur le post).  
**Filet auto** : si Direct Post public échoue (unaudited) → upload **Inbox**.  
**Bug corrigé** : chunking MP4 (`total chunk count is invalid` sous 64 Mo → 1 chunk).  
**Après approve audit** : republier un Reel avec settings Direct Post → public sans inbox.

## Démarche resoumission (faite / référence)

### 1. Return to Draft
Bouton **Return to Draft** → corriger textes + produits + scopes **avant** de resoumettre.

### 2. Produits / scopes
- Content Posting API : **Direct Post = ON**
- Scopes demandés : `user.info.basic` + `video.upload` + **`video.publish`**
- Redirect URI (prod) : `https://fitmangas.com/api/admin/community/tiktok/callback`

### 3. Textes à coller (anglais — reviewers TikTok)

**App name :** FitMangas

**Category :** Health & Fitness

**Description (remplace l’ancienne si elle parlait d’outil interne / admin) :**

```
FitMangas is a fitness creator platform for Pilates & Barre coaches.
Creators connect their own TikTok account with OAuth, then publish original
vertical workout videos they filmed and edited — directly to their TikTok
profile via the Content Posting API (Direct Post).

The integration is for authentic creator content only (no scraping, no
cross-posting arbitrary third-party videos). Each creator authorizes their
own account and chooses when to publish.

Website: https://fitmangas.com
Privacy policy: https://fitmangas.com/privacy
Terms: https://fitmangas.com/terms
```

**Intended use / review notes (si champ libre) :**

```
We enable fitness creators on FitMangas to publish their original Reels to
TikTok with explicit OAuth consent (video.publish). This is a creator-facing
publish flow, not an internal-only marketing utility. Demo account: contact
info@casamangas.com for reviewer credentials if needed.
```

### 4. Vidéo démo (obligatoire en pratique)
Enregistrer 60–90 s montrant :
1. Page FitMangas / admin CM  
2. Clic **OAuth TikTok** → écran consentement TikTok (scopes visibles)  
3. Retour app « TikTok connecté »  
4. Publication d’un Reel (ou tentative Direct Post)  

Ne **pas** dire dans la vidéo : « outil interne pour notre Page ».  
Dire : « un créateur FitMangas connecte son TikTok et publie son contenu original ».

### 5. Après approbation Production
1. Dans le CM : **Reconnecter TikTok** (pour obtenir le scope `video.publish` — l’ancien token n’a que `video.upload`).  
2. Vérifier qu’un Reel avec « Aussi TikTok » publie en public (pas SELF_ONLY / privé).  
3. Si posts encore privés : lancer l’**audit** Content Posting (étape séparée après tests).

### 6. Si refus encore
Options réalistes :
- Outil tiers déjà audité (Buffer / Later / Metricool) pour TikTok seulement  
- Publication manuelle du MP4  
- Ne **pas** resoumettre le même texte « admin / notre compte »

## Variable optionnelle

`TIKTOK_REQUEST_VIDEO_PUBLISH=1` (Vercel + `.env.local`) → l’URL OAuth demande aussi `video.publish`.  
À activer **après** que le scope soit ajouté / approuvé sur l’app TikTok (sinon l’écran OAuth peut échouer).
