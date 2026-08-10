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

## Animations LMDM DE FOND (STANDARD — tout Reel, y compris témoignage)

**INTERDIT : tout gros texte qui répète ou résume la voix** (hors hook 0–2,8 s et sous-titres).
Un « mot-clé animé » n'est **PAS** du motion design — c'est l'erreur n°1 LMDM (la même info une 3e fois : voix + sous-titres + gros texte → le viewer se perd). Incident réel : « LE DÉCLIC » / « SANS MATÉRIEL » en texte statique sur trop-tard → rejeté.

**Règle d'or LMDM** — pour chaque section du discours se demander :
> « Comment je rends cette idée **VISUELLE** au lieu de l'écrire en gros ? »

Réf. obligatoire @lemondedumarketing : **fenêtres/cartes ANIMÉES au-dessus de la tête** — navigateur avec timeline qui défile, cartes comparatives qui apparaissent, logos qui glissent dans un dossier, **checklist qui se coche item par item**, surlignages qui se dessinent. Chaque animation **illustre la phrase dite à ce moment**.

**Les animations VIVENT** : elles bougent à l'intérieur (défilement, coche qui se dessine, glissement, zoom, pulsation) — jamais une carte statique posée.

**Écriture du prompt motion** : décrire le **MOUVEMENT**, pas le contenu — **ce qui bouge, dans quel ordre, à quel moment, avec quel accent**.

**Templates HyperFrames d'abord** (hyperframes.heygen.com/catalog) : partir d'un template proche, copier son prompt, rebrand FitMangas (cream `#FFFAF5`, terracotta `#C45D3E`, Inter, logo flamme). From scratch seulement s'il n'y a pas de template proche — toujours en décrivant le mouvement.

**BRUITAGES (checklist LMDM « LES BRUITAGES ✓ ») : chaque apparition/transition d'animation a son SFX** (whoosh, pop, tick ~−20 dB). Tick sonore sur **chaque** coche de checklist. **Pas d'animation muette.**

**Anti-surcharge** : une animation par phrase/idée max, jamais 3 effets/seconde. Face cam dominant, zones mortes IG.

**Vrais logos SVG officiels** quand une marque est citée (jamais redessinés).

### FORMAT SPLIT SCREEN (le vrai format LMDM — obligatoire pour les grosses animations)

Quand une grosse animation arrive, **l'écran SE PARTAGE** :
- **Zone haute (~48 %)** : l'animation sur un **fond dédié pleine largeur** (sombre `#1a1a1a` ou cream selon l'animation) — **PAS une petite carte flottante au-dessus de la tête**. L'animation est **GRANDE et lisible**, pas un timbre-poste.
- **Zone basse** : la personne **recadrée** (technique `clip-path:inset(48%)` + `translateY`, seek-safe — même mécanique que le CTA).
- **Sous-titres à la JONCTION** des deux zones pendant le split (pas en bas sur elle) — déplacer le conteneur subs (`y`), le remettre après.
- Option : l'animation peut prendre **l'écran entier** quelques secondes (la personne disparaît), puis retour face cam.

### DENSITÉ — une animation par phrase (règle LMDM exacte)

> « Une animation par phrase, oui. Trois effets par seconde, non. Les plus efficaces sont souvent les plus simples : un surlignage posé au bon moment. »

**Passe la transcription phrase par phrase et assigne à CHACUNE** : grosse animation (split) / micro-animation / punch-in. **Aucune phrase sans beat visuel.** Sur ~80 s : 2–4 splits (temps forts) + **une majorité de micro-animations** :
- **surlignage terracotta** qui se dessine sous le mot-clé du sous-titre au moment où il est dit
- cercle / soulignement animé, flèche qui pointe, **petit pictogramme qui pop** à côté d'elle
- ~~punch-in (zoom léger sur le visage)~~ → **NE PAS UTILISER** : la coach n'aime pas le zoom sur elle (préférence FitMangas validée). Remplacer par un autre micro (soulignement, picto, soulignement d'un mot fort) — jamais un zoom sur la personne

### TRANSITIONS — cut sec uniquement

**INTERDIT : volets, wipes, sweeps colorés** (incident sweep diagonal orange trop-tard → rejeté). Chez LMDM les transitions sont quasi inexistantes : **cut sec + apparition de l'élément**. Les entrées/sorties de split se font en `tl.set` instantané (pas de fondu de zone).

### SOUND DESIGN LMDM (palette par TYPE d'élément — pas que des whoosh)

| Élément | Son |
|---|---|
| Apparition UI / carte / split | **clic de souris** (`click`) |
| Texte qui s'écrit | **frappe clavier** (`typing` / `key-press`) |
| Coche de checklist | **tick** (`click-soft`) |
| Pictogramme qui pop | **pop** discret |
| Soulignement / surlignage | **chime / ping** léger |
| Apparition d'image/photo | obturateur si dispo |

**Chaque micro-animation a son micro-son ~−20 dB** (sons fins un peu plus haut). Pas d'animation muette.

### MUSIQUE — lounge légère

Bed **lounge/hôtel très léger** (~−15 dB sous la voix), présent mais **presque subliminal**, fondu de sortie en fin. Jamais une piste qui s'entend « comme une musique ».

Motifs validés (Reel trop-tard) :
- « ça m'a fait mal (dos, chevilles) » → split sombre : **grande silhouette, zones douleur qui pulsent** l'une après l'autre
- « à la maison, sans matériel » → split cream : **grande checklist, coches une à une** + tick
- « un coach qui te guide » → split sombre : **grande fenêtre visio**, avatar coach + ondes de parole

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
