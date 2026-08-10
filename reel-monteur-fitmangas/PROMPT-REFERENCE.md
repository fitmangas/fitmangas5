# Prompt de référence — Montage Reel FitMangas (Claude Code)

Colle ce prompt à chaque nouvelle vidéo. Remplace uniquement les `{{…}}`.
Tout le reste (style, pipeline, motion LMDM, audio, export) est figé et renvoie à mes skills.

---

## PROMPT (à copier)

```
Monte un nouveau Reel FitMangas au STANDARD VALIDÉ (réf. dolor-espalda + trop-tard).
Ne me redemande pas le style : il est figé dans mes fichiers.

AVANT TOUT — lis et applique STRICTEMENT, dans l'ordre :
1. FitMangas-Reels/STRATEGY.md
2. TOUS les FitMangas-Reels/skills/ (01-derush → 08-audio) — surtout 03 (motion LMDM)
4. Ta mémoire « Standard de production FitMangas »

════════ ENTRÉES (les SEULS éléments variables) ════════
- Vidéo brute .................. {{CHEMIN_MP4}}
- Langue parlée ................ {{LANGUE}}
- Hook (gros titre 0–2,8 s) .... {{HOOK}}   (toujours affiché même si non prononcé)
- 3 idées / sujet du brief ..... {{IDEE_1}} | {{IDEE_2}} | {{IDEE_3}}   (intention, PAS la source des sous-titres)
- Légende Instagram ............ {{LEGENDE}}   (ou « génère-la » : 70–150 car. + 3–5 hashtags, sur ce qui est VRAIMENT dit)
- Overlay / exception .......... {{OVERLAY_OU_EXCEPTION}}   (sinon : standard)

════════ PIPELINE (FIXE) ════════
1. Projet HyperFrames « reel-{{SLUG}} », portrait 1080×1920.
2. COULEURS : si HDR/HLG ou Log → VRAI tonemap SDR Rec.709 via LUT `assets/hlg2709.cube` + `lut3d`
   (jamais un retag ; jamais un grade « curves »). Si la prise est sombre, RELEVER l'expo :
   `curves` shadow-lift + `eq` après le LUT (visage bien éclairé, noirs conservés). cara.mp4 taggé bt709.
3. DÉRUSH : Whisper LOCAL ({{LANGUE}}) → voix RÉELLE ; couper dans les silences MESURÉS ; garder ~60–90 s
   cohérents (problème → solution → accompagnement → CTA), couper répétitions/hésitations. C'est TOI qui
   décides quoi garder, sans me demander. Concat des blocs gardés.
4. SOUS-TITRES = ce qu'elle DIT (verbatim, accent authentique assumé). Retouche « légère » UNIQUEMENT si
   une phrase n'a vraiment aucun sens. Style INTANGIBLE : Inter 800, 74 px, blanc + contour noir 6 px,
   mot-clé terracotta #e8894f, 2–3 mots, fins fortes. Conteneur unique + autoAlpha (seek-safe).
5. HOOK : gros titre blanc+contour noir tiers sup. + logo flamme PNG TRANSPARENT dessous (pas de pastille).
6. MOTION LMDM — LE CŒUR (skill 03). Passe la transcription PHRASE PAR PHRASE : à CHAQUE phrase un beat
   visuel, aucune phrase sans rien.
   - Grosses animations (2–4) en SPLIT SCREEN plein largeur : zone haute = fond DÉDIÉ bord à bord
     (#1a1a1a sombre ou cream selon l'animation, jamais une petite carte flottante), animation GRANDE
     et lisible ; visage recadré moitié basse (clip-path inset 48% + translateY, seek-safe) ; sous-titres
     déplacés à la JONCTION des deux zones pendant le split, remis en bas après. Entrée/sortie = CUT SEC
     (tl.set instantané, jamais de fondu de zone). Occasionnellement l'animation peut prendre l'écran
     ENTIER quelques secondes (la personne disparaît), puis retour cut sec au face cam.
   - Majorité de MICRO-animations qui VIVENT (une par phrase, entre les splits) : soulignement terracotta
     qui se dessine sous un mot-clé du sous-titre au moment où il est dit, cercle/pictogramme qui pop à
     côté d'elle, checklist qui se coche item par item, éléments qui glissent/s'alignent.
   - INTERDIT : gros texte qui répète/résume la voix (hors hook+sous-titres — c'est l'erreur n°1 LMDM,
     la même info 3 fois) ; wipes/volets/sweeps colorés (CUT SEC uniquement, jamais de transition
     diagonale ou colorée) ; ZOOM punch-in sur la personne (la coach n'aime pas cette action — jamais
     de scale sur le visage). Templates catalog HyperFrames en priorité, rebrand cream/terracotta ;
     from scratch sinon, toujours en décrivant le mouvement (quoi bouge, ordre, timing, accent) avant de coder.
7. BLOCK INSTAGRAM FOLLOW (standard, ~4,5 s avant le CTA) : avatar crop CARRÉ centré visage `hero.jpg`,
   FitMangas + badge vérifié BLEU, @fit.mangas, bouton « Seguir » FIXE, « Pilates · Barre en vivo ».
8. CTA = PILE 3 CARTES desktop en zone sombre haute (dashboard centre / blog gauche / replays droite),
   lockup pastille+logo + pill fitmangas.com, visage recadré bas. Jamais de screenshot mobile plein cadre.
9. AUDIO :
   - Voix STABLE ~−16 dB de bout en bout. Débruitage MINIMAL (highpass + loudnorm) — JAMAIS `arnndn`/RNNoise,
     JAMAIS `anlmdn` (effet « tunnel/caverneux »). Vérifier RMS par fenêtres.
   - Musique = bed LOUNGE très léger (~−15 dB sous la voix, presque subliminal), fondu d'entrée court,
     fondu de sortie seulement en toute fin.
   - SFX = palette VARIÉE PAR TYPE d'élément (skill 05), jamais juste des whoosh : clic de souris
     (apparition UI/carte/split), frappe clavier (texte qui s'écrit), obturateur photo (apparition
     d'image si dispo), tick (chaque coche de checklist), pop discret (picto), chime/ping léger
     (soulignement), whoosh (Follow/CTA uniquement). Chaque animation a son micro-son ~−20 dB sous
     la voix (sons fins un peu plus haut si besoin). Pas d'animation muette.
   - Exception « son d'origine seul » si {{OVERLAY_OU_EXCEPTION}} le demande (voix brute -16, aucun musique/SFX).
10. `npm run check` = 0 erreur. Snapshots de PREUVE à chaque étape (couleurs, hook, chaque animation, Follow, CTA).
11. Studio localhost (`npm run dev`), ATTENDS mon OK visuel. Sur mon OK : `npm run render` LOCAL (jamais cloud) →
    copie H.264 SDR Rec.709 (bt709, faststart, audio inchangé) dans le VRAI dossier local
    FitMangas-Reels/exports/ : « reel-{{SLUG}}_1080x1920_30fps.mp4 ». Donne le chemin.
12. Propose la légende. Zones mortes IG respectées (150/400/100 px). Face cam dominant.
```

---

## Les SEULS trous à remplir

| Token | Ce que c'est | Exemple |
|-------|--------------|---------|
| `{{CHEMIN_MP4}}` | chemin de la brute | `FitMangas-Reels/brutes/mon-reel.MOV` |
| `{{SLUG}}` | nom court projet/export | `trop-tard` |
| `{{LANGUE}}` | langue parlée (Whisper) | `français` |
| `{{HOOK}}` | gros titre 0–2,8 s | `On t'a dit que c'était trop tard` |
| `{{IDEE_1..3}}` | 3 idées du brief (intention) | 45+ / bouger seule / rendez-vous fixe |
| `{{LEGENDE}}` | légende IG (ou « génère-la ») | … |
| `{{OVERLAY_OU_EXCEPTION}}` | exception audio/overlay | `standard` |

Fixe et jamais réexpliqué : style sous-titres intangible, cream/terracotta, tonemap LUT + relève expo si
sombre, motion LMDM (split screen fond dédié + une animation/phrase + cut sec uniquement + jamais de
punch-in + SFX variés par type + musique lounge subliminale), Follow @fit.mangas, CTA pile 3 cartes en
zone sombre, audio −16 dB stable sans RNNoise/anlmdn, zones mortes IG, export H.264 SDR Rec.709 local.

Validé sur : dolor-espalda (premier Reel, ES) et trop-tard (témoignage FR, format split screen LMDM
complet — référence motion actuelle).
