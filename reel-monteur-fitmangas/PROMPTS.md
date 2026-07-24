# Prompts Claude Code — FitMangas

**Parole naturelle :** pas de lecture de script à l’écran.  
Sous-titres = transcription de la voix réelle (Whisper local).

---

## A — Install HyperFrames (1×)

```
Installe HyperFrames sur ma machine et crée-moi un projet vidéo
vertical 1080x1920 pour des Reels Instagram FitMangas (Pilates premium).
Ouvre le studio de prévisualisation en local et dis-moi quand
c'est prêt. Si quelque chose bloque, répare-le toi-même.
N'utilise JAMAIS le rendu cloud HeyGen : uniquement local.
```

---

## B — Charger les skills (1× après install)

```
Lis tous les fichiers du dossier skills/ de ce projet.
Ce sont mes règles de montage FitMangas.
Garde-les en mémoire et transforme-les en compétences réutilisables
pour toutes les prochaines vidéos.
Confirme la liste des skills chargés.

Règle d'or FitMangas :
- La coach ne LIT PAS un script à l'écran.
- Elle parle naturellement (aide-mémoire hors caméra OK : 3 mots max).
- Sous-titres = ce qui a vraiment été dit (transcription Whisper), jamais un texte prompteur.
```

---

## C — Montage d’un Reel (chaque fois)

```
Méthode LMDM / FitMangas — monte cette vidéo en suivant STRICTEMENT mes skills (dossier skills/).

Vidéo brute : [CHEMIN_COMPLET_VERS_LE_MP4]

Brief FitMangas (AIDE-MÉMOIRE de tournage UNIQUEMENT — ce n'est PAS un script à coller en sous-titres) :
- Hook / sujet : [HOOK]
- 3 idées max qu'elle voulait aborder : [IDEES]
- Plans tournage : [PLANS]
- Légende cible (réseau) : [CAPTION]

RÈGLE PAROLE NATURELLE (prioritaire) :
- Ne force AUCUN sous-titre depuis le brief.
- Transcris la VOIX RÉELLE (Whisper local).
- Les sous-titres suivent exactement ce qui a été prononcé.
- Si elle a bafouillé / recommencé : dérush = garder la meilleure prise orale.

Pipeline obligatoire :
0) Dérush : Whisper local + ffmpeg silencedetect.
   Coupes DANS les silences. Toi = quoi garder ; outils = où couper.
1) Sections logiques à partir de la transcription réelle.
2) Motion — STRICT skill 03 (guide LMDM) :
   - Catalog HyperFrames d’abord (add + rebrand cream/terracotta), sinon from scratch.
   - Chaque section : décrire le MOUVEMENT (quoi bouge, ordre, timing, couleur),
     PAS juste le thème. Ex. : zoom → surlignage feutre terracotta → hold 2s → pan.
   - Une idée visuelle par phrase — pas 3 effets/seconde.
   - Zéro gros texte qui répète la voix. Image seulement si pertinente.
   - Standards : Follow @fit.mangas + CTA pile 3 cartes desktop (zone sombre).
3) Sous-titres 2–3 mots, sync sur la transcription réelle (style intangible).
4) Attends mon OK section par section avant export final.
5) SFX puis musique (~15 dB sous la voix) — sauf si je demande son d’origine.
6) Export MP4 1080x1920 30fps LOCAL H.264 SDR — INTERDIT HeyGen cloud.

Si quelque chose bloque, répare-toi-même. Dis-moi quand l'aperçu local est prêt.
```

---

## D — Revue

```
Sur la section [NOM], [consigne].
Garde ça en mémoire si le résultat me plaît.
```

---

## E — Export

```
Tout est validé. Exporte le MP4 final en local 1080x1920 30fps.
Copie aussi le fichier dans exports/.
Donne-moi le chemin. Pas de cloud HeyGen.
Propose une légende Instagram courte (70–150 car.) basée sur ce qui a VRAIMENT été dit dans la vidéo + 3–5 hashtags.
```

---

## F — Mot magique (persistance)

```
Garde ça en mémoire. Transforme cette règle en skill réutilisable
et mets à jour le fichier skill concerné + STRATEGY.md + CLAUDE.md
à la racine FitMangas-Reels. Recopie aussi skills/ vers
/Users/kevinpicard/Projets/fitmangas5/reel-monteur-fitmangas/skills/
pour que le prochain Reel n’ait pas à réapprendre.
```

---

## G — Relire standards avant un nouveau Reel (chaque session)

```
Lis CLAUDE.md, STRATEGY.md et tous les skills/ (01–08).
Confirme les règles non négociables (audio sans RNNoise, sous-titres
intangibles, CTA desktop en carte flottante LMDM, parole naturelle).
Puis attends mon brief / vidéo brute.
```

---

## H — Correctif CTA style LMDM (dashboard desktop flottant)

```
Relis skills/03-motion-design.md et STRATEGY.md (section cartes flottantes).

Problème actuel : le CTA utilise un screenshot mobile en plein cadre scindé —
le dashboard est coupé, illisible, pas beau.

Corrige UNIQUEMENT le CTA (et le layout haut associé) comme @LeMondeDuMarketing :
1) Zone haut : fond gris/sombre (pas collage bord à bord).
2) Carte flottante (coins arrondis + ombre + marges) contenant
   assets/dashboard-desktop.png (desktop paysage) DÉZOOMÉ pour qu’on voie
   le dashboard ENTIER et lisible.
3) Lockup pastille blanche + logo + pill fitmangas.com (shimmer OK).
4) Visage reste visible en bas. Sous-titres style intangible inchangé.
5) Ne touche PAS à l’audio voix (déjà stable sans RNNoise), sauf SFX CTA.

npm run check, snapshots CTA, studio. N’exporte pas avant mon OK.
```

---

## I — Ajouter le block Instagram Follow (catalog)

Doc : https://hyperframes.heygen.com/catalog/blocks/instagram-follow

```
Relis skills/03-motion-design.md (section Instagram Follow).

1) Dans le projet HyperFrames du Reel actuel :
   npx hyperframes add instagram-follow
2) Remplace assets/avatar.jpg du block par une copie de
   assets/avatar-fitmangas.png (portrait Alejandra).
3) Dans compositions/instagram-follow.html : nom FitMangas,
   handle @fitmangas (ou le handle que je te donne),
   abonnés réalistes si le champ existe, bouton « Seguir » si Reel ES
   sinon « Follow ». Adapter couleurs cream/terracotta si besoin
   (le bleu Follow IG peut rester).
4) Monte le block en sous-composition dans index.html sur une section
   pertinente (CTA follow OU social-proof 4–5 s), visage visible en bas
   si layout scindé. Ne casse pas le CTA dashboard desktop flottant.
5) npm run check + snapshot. N’exporte pas avant mon OK.
```

---

## J — Polish standard Follow + pile CTA 3 cartes + ortho + audio

```
Relis skills/03 + STRATEGY (standards Follow + pile CTA 3 cartes).

Sur reel-dolor-espalda, applique TOUT ceci. N’exporte pas.

1) AUDIO (exception cette vidéo) :
   Remets le son d’ORIGINE de la prise (voix brute / piste source),
   sans musique bed ni SFX ajoutés. Pas de RNNoise.

2) FOLLOW (standard) :
   - Badge vérifié BLEU à côté de « FitMangas »
   - Avatar = crop CARRÉ centré sur le VISAGE depuis assets/hero.jpg
   - Handle EXACT : @fit.mangas (pas @fitmangas)
   - Bouton texte FIXE « Seguir » (ne pas afficher « Siguiendo »)
   - Ligne 3 : garde « Pilates · Barre en vivo » sauf si je fournis un vrai nb d’abonnés

3) CTA = pile 3 cartes (réf. superposition LMDM) :
   - Centre devant : assets/dashboard-desktop.png
   - Gauche derrière (tilt) : assets/blog-desktop.png
   - Droite derrière (tilt) : assets/replays-desktop.png
   Même niveau de superposition que la réf.
   Lockup + pill fitmangas.com.
   Léger float / profondeur sur la pile (une idée de mouvement, pas trois).
   Visage en bas.

4) ORTHO sous-titre : remplace « pues venid » / « PUES VENID »
   par « Puedes venir » (casse style intangible OK).
   Passe aussi un œil rapide : corrige toute autre faute Whisper évidente
   sans changer le sens ni le style des sous-titres.

5) MÉMOIRE / STANDARD :
   Mets à jour skills/03 + STRATEGY + CLAUDE.md :
   - Follow + pile 3 cartes = STANDARD chaque Reel
   - Handle @fit.mangas
   - Bouton Seguir fixe
   - Préférer tournage HD Normal sans HDR (note skill)
   Recopie skills/ vers
   /Users/kevinpicard/Projets/fitmangas5/reel-monteur-fitmangas/skills/

npm run check + snapshots Follow + CTA. Studio localhost.
```
