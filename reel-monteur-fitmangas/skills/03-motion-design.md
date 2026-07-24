# Skill FitMangas — Motion design (guide LMDM + catalog HyperFrames)

Source : guide Alex / LeMondeDuMarketing « Motion design avec Claude + HyperFrames »  
+ catalog https://hyperframes.heygen.com/catalog  
+ branding FitMangas.

**Ce skill est NON NÉGOCIABLE.** À relire avant chaque section motion.  
Les prompts Claude Code doivent décrire le **mouvement**, pas seulement le thème.

---

## Phase tournage

**Face cam uniquement** (téléphone à la main). Pas de plan exercice filmé.

Réglages iPhone Reels (défaut FitMangas) :
- Vidéo **SDR / Normal** — **pas HDR**, **pas ProRes Log** (défaut)
- HD 1080p · 30 fps · vertical 9:16  
→ Voir skill 01 pour Log (option avancée) et photos.

---

## Les 2 outils (LMDM)

1. **Claude Code** (agent) — écrit le motion en HTML/CSS  
2. **HyperFrames** local — preview + export MP4 (**jamais** cloud HeyGen pour le final)

---

## Workflow templates (LMDM — priorité)

Catalog : https://hyperframes.heygen.com/catalog  

1. Choisir un template / block proche de l’idée  
2. `npx hyperframes add …` (ou copier le prompt du template)  
3. **Personnaliser** en une ligne (obligatoire) :

```
Adapte cette animation au branding FitMangas :
couleurs cream #FFFAF5 + terracotta #C45D3E, police sous-titres intangible
(blanc + contour noir, mot-clé terracotta), logo assets/logo.png.
Remplace le texte d’exemple par : [texte].
Garde le rythme ; style wellness premium (pas violet IA, pas néon).
```

Références uploadables : logo, dashboard, captures site.

**Blocks FitMangas standards (chaque Reel pertinent) :**
- `instagram-follow` → @fit.mangas + badge bleu + avatar hero centré + Seguir fixe  
- CTA fin : pile 3 cartes desktop (dashboard / blog / replays) — skill section CTA  
- Composants utiles vus : vignette, shimmer-sweep (rebrand terracotta)

Ne **pas** forcer un block 3D / hors sujet.

---

## From scratch — LA règle LMDM (la plus importante)

> **Décris le mouvement, pas juste le contenu.**

| Interdit (générique) | Obligatoire (précis) |
|----------------------|----------------------|
| « Animation sur le mal de dos » | « Affiche [asset]. Zoom 1,2 s vers X. Surlignage terracotta gauche→droite. Tiens 2 s. Pan vers Y. Fond #312720. » |
| « Montre la croissance » | Ordre + durée + quoi bouge + couleur d’accent |

Exemple LMDM (à imiter pour FitMangas) :

```
Affiche cette capture [image jointe].
Zoome progressivement vers [élément précis]
et surligne-le en terracotta #C45D3E, comme un coup de feutre
qui se dessine de gauche à droite. Reste dessus 2 secondes,
puis déplace le cadrage vers [2e élément] et surligne-le
de la même façon. Format vertical 1080x1920, fond #312720.
```

Logos de marques : SVG officiels si tu cites un outil tiers — jamais un logo IA approximatif.

---

## Rythme (erreur LMDM #3)

- **Une animation / idée visuelle par phrase** (ou section courte calée sur la voix)  
- **Pas** trois effets par seconde  
- Le motion **sert** le discours ; s’il devient le spectacle → simplifier  
- Souvent le plus efficace = le plus simple (un surlignage / un trait / une carte au bon moment)

---

## Règle d’or images

Avant tout scindé / photo :

> Cette image **illustre clairement** ce qui est dit **maintenant** ?

- Non / doute → **pas d’image** (face cam + sous-titres + picto OK)  
- Oui → overlay / scindé / carte flottante  

Jamais remplir le haut « parce qu’il faut une image ».

---

## 3 erreurs LMDM « ça sent l’IA » (interdites)

1. **Gros texte qui répète la voix** (+ sous-titres déjà là) → rendre l’idée **visuelle**, pas la réécrire en énorme  
2. **Zéro branding** / violet-bleu IA → cream + terracotta FitMangas à **chaque** prompt  
3. **Tout animer** → une idée / phrase, pas un feu d’artifice

---

## Branding FitMangas

- Cream `#FFFAF5`, terracotta `#C45D3E`, fonds motion sombres `#241d18` / `#312720`  
- Logo : `assets/logo.png` (PNG transparent)  
- Sous-titres : style **intangible** (blanc + contour noir, mot-clé terracotta, 2–3 mots) — ne pas changer  

### Hook (0–2,8 s)

Gros titre Explore. Sous le titre : **logo transparent** (pas pastille blanche) **ou** durée **vraie** seulement.

### Labels / schémas pédago (4–6 s max)

Carte cream + picto terracotta épais + label — calé sur la phrase. Lisibilité mobile obligatoire.

### Layout type LMDM Instagram

Haut zone graphique (fond sombre) · label / sous-titre · bas face cam.  
UI / dashboard = **cartes flottantes** (coins, ombre, marges) — jamais screenshot mobile plein cadre coupé.

### Instagram Follow (STANDARD)

`npx hyperframes add instagram-follow`  
Avatar crop **centré visage** `hero.jpg` · FitMangas · badge vérifié bleu · `@fit.mangas` · **Seguir** fixe · ~4–5 s avant CTA.

### CTA pile 3 cartes (STANDARD)

Zone haute sombre uniquement (pas à cheval sur le visage) :
- Centre : `dashboard-desktop.png`  
- Gauche derrière : `blog-desktop.png`  
- Droite derrière : `replays-desktop.png`  
Lockup logo + pill `fitmangas.com` dans la zone sombre. Visage en bas.

### Logo

CTA fin (+ hook discret). **Pas** logo coin permanent toute la vidéo.

---

## Checklist avant de valider une section motion

- [ ] Prompt décrit **mouvement + ordre + timing** (pas seulement le sujet)  
- [ ] Une idée visuelle pour cette phrase / section  
- [ ] Branding cream/terracotta  
- [ ] Pas de pavé texte qui répète la voix  
- [ ] Image pertinente ou pas d’image  
- [ ] Snapshot section OK
