# FitMangas — Stratégie Community Manager & Reels (source de vérité)

Document vivant. À mettre à jour dès qu’une règle est validée en production (prompt F / « garde en mémoire »).  
Dupliqué opérationnellement dans : `.cursor/rules/`, `reel-monteur-fitmangas/`, `FitMangas-Reels/CLAUDE.md` + `skills/`.

---

## 1. Objectif produit

FitMangas = Pilates / Barre en visio (Alejandra).  
Les Reels servent à : hook attention → valeur pédagogique courte → invitation `fitmangas.com` / classes.

## 2. Mix publication Instagram (validé)

| Format | Part approx. | Règle média |
|--------|--------------|-------------|
| Reels vidéo | ~60 % (~3–5 / sem.) | Vidéo 9:16 réelle uniquement |
| Carousels | ~25 % (1–2) | Éducation / saves |
| Feed photo | ~15 % (1–2) | Bibliothèque réelle prioritaire |

- **Interdit** : photo Unsplash / stock présentée comme un Reel
- Chaîne photos : bibliothèque → Gemini → Pollinations → Unsplash (dernier recours)
- Légendes **par format** (pas une règle « 380 caractères » globale) — voir `CAPTION_BY_FORMAT` dans `social-cm-playbook.ts`
- Facebook : légende courte ; WhatsApp : court + photo réelle
- Horaires : fuseau Paris
- Muapi : abandonné

## 3. Pattern viral Reels (validé)

1. **Hook title** gros, 0–2 s (Explore)
2. **Sous-titres brûlés** sync voix
3. **Visage** (face cam) presque toujours visible
4. Motion / overlays **pertinents** seulement

### Parole naturelle (non négociable)

- La coach **ne lit pas** un script à l’écran
- Brief admin = **aide-mémoire** (sujet + hook + 3 idées max)
- Sous-titres = **Whisper local** sur la voix réelle (jamais le brief collé)

### Phase tournage actuelle

- **Face cam téléphone** uniquement
- Pas de plan exercice filmé pour l’instant
- Préférer HD Normal **sans HDR** (évite tone-map lourd)

## 4. Pipeline montage (Mac)

```
Admin FitMangas (brief) → filmage → brutes/
  → Claude Code + skills/ + HyperFrames local
  → preview localhost → OK humain
  → npm run render → exports/ → upload admin Community
```

- **Local uniquement** — pas de rendu cloud HeyGen pour le final
- Projet travail : `/Users/kevinpicard/Projets/fitmangas5/FitMangas-Reels/`
- Kit versionné : `reel-monteur-fitmangas/` (README, PROMPTS, skills)
- `FitMangas-Reels/` est en `.gitignore` (projet local HyperFrames)

## 5. Branding motion / sous-titres (intangible)

| Élément | Standard |
|---------|----------|
| Couleurs | cream `#FFFAF5`, terracotta `#C45D3E`, texte sombre |
| Sous-titres | blanc + contour noir, **mot-clé terracotta**, 2–3 mots |
| Logo | **CTA fin seulement** (pas permanent coin) |
| Musique | ~12–15 dB sous la voix, fade out 1–2 s finales |
| SFX | whoosh sections, soft pop CTA |

## 6. Audio (leçons dures)

- Niveau voix **stable** ~−16 dB du début à la fin
- **Interdit RNNoise (`arnndn`)** : écrase progressivement la voix (−16 → −50 dB observé)
- Débruitage stationnaire OK s’il ne mange pas la voix
- Mesurer RMS par fenêtres + **écouter la fin** (« te espero » / CTA audible)
- Pas de ducking / sidechain qui baisse la voix

## 7. Motion — style LMDM (référence Instagram @lemondedumarketing)

### Layout type

- Haut ~40–50 % : zone graphique (fond **gris / noir / cream sombre**)
- Bandeau / label central (FitMangas : cream + terracotta, **pas** jaune Hormozi tel quel sauf test)
- Bas : face cam

### Cartes flottantes (OBLIGATOIRE pour UI / dashboard)

- Contenu produit (dashboard, schéma, follow card) = **fenêtre / carte** avec coins arrondis + ombre légère
- **Margins** : la carte ne touche **pas** les bords du cadre 9:16
- Screenshots **desktop / paysage** (ex. `espace cliente dashboard.png` 3830×2096) **dézoomés** dans la carte
- **Interdit** : screenshot mobile vertical collé en plein cadre scindé → crop illisible (échec gen CTA dolor-espalda)

### Règle d’or image

> L’image illustre-t-elle clairement ce qui est dit **maintenant** ?  
> Non / doute → pas d’image scindée. Face cam + sous-titres + pictogramme OK.

### Catalogue HyperFrames

- Priorité : `npx hyperframes add …` puis rebrand cream/terracotta
- Pas de block 3D / hors sujet forcé
- Composants légitimes vus : vignette, shimmer-sweep ; pictos médicaux / CTA souvent from scratch

### Block Instagram Follow (STANDARD chaque Reel)

Doc : https://hyperframes.heygen.com/catalog/blocks/instagram-follow  

- `npx hyperframes add instagram-follow`
- Avatar : crop visage centré depuis `assets/hero.jpg`
- Badge **vérifié bleu** à côté du nom (comme LMDM)
- Nom FitMangas · `@fit.mangas` · bouton **Seguir** fixe (pas Siguiendo)
- Ligne 3 : vrai nb d’abonnés si fourni, sinon `Pilates · Barre en vivo`
- ~4–5 s avant le CTA dashboard
- Badge **vérifié bleu** · avatar crop `hero.jpg`

### CTA FitMangas — pile 3 cartes (STANDARD chaque Reel)

Réf. superposition LMDM / IMG_4194 :

1. Fond zone haut sombre / gris
2. **3 cartes** : centre = `dashboard-desktop.png` · gauche derrière = `blog-desktop.png` · droite derrière = `replays-desktop.png` (même tilt / overlap que la réf.)
3. Lockup logo + pill `fitmangas.com`
4. Visage en bas · soft whoosh + pop

## 8. Assets produit utiles

| Fichier | Usage |
|---------|--------|
| `public/logo.png` | CTA / lockup |
| `public/landing/hero.jpg` | Avatar Follow (crop visage) |
| `public/espace cliente dashboard.png` | CTA centre (`dashboard-desktop.png`) |
| `public/library/espace-client/desktop/blog-desktop.png` | CTA gauche (`blog-desktop.png`) |
| `public/espace cliente replays.png` | CTA droite (`replays-desktop.png`) |
| `public/Espace client sur Mobile Dashboard.jpg` | **Éviter** en scindé plein cadre |
| `public/library/alejandra/…` | Feed photo / carousels |

## 9. Persistance multi-outils

| Où | Quoi |
|----|------|
| Cursor | `.cursor/rules/fitmangas-community-reels.mdc` + ce doc |
| Claude Code (dossier Reels) | `FitMangas-Reels/CLAUDE.md` + `skills/*.md` |
| Kit versionné | `reel-monteur-fitmangas/` (sync skills après chaque règle validée) |
| Claude Project (chat web) | Coller / uploader ce fichier dans les Knowledge du projet |

Après chaque règle validée : mettre à jour **skills** + ce doc + dire à Claude Code « garde en mémoire / mets à jour le skill ».

## 10. Checklist avant export

- [ ] `npm run check` = 0 erreur
- [ ] Voix audible jusqu’à la fin (oreille + RMS)
- [ ] Sous-titres style intangible
- [ ] Pas d’image hors sujet
- [ ] CTA desktop en carte flottante lisible
- [ ] Studio preview OK (`npm run dev`)
- [ ] Feu vert humain → `npm run render` → `exports/`
