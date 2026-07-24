# Skill FitMangas — Dérush (parole naturelle)

## Contexte FitMangas

La coach **ne lit pas** un prompteur. Elle parle naturellement.
Le brief FitMangas (hook / 3 idées) est un **aide-mémoire de tournage**, pas la source des sous-titres.

## Principe clé (à ne jamais oublier)

Un LLM ne donne JAMAIS de timestamp de coupe fiable.
Le « où couper » vient d’outils déterministes :
- Whisper **local** → transcription de la **voix réelle** + timings
- ffmpeg silencedetect → vrais silences

Le « quoi garder » = raisonnement sur le discours **tel qu’il a été dit**
(et optionnellement l’intention du brief : sujet / idées), **sans coller un script non prononcé**.

Les coupes se font DANS les silences, jamais sur un mot.

## Règles opérationnelles (extraites du skill dérush LMDM)

Chacune vient d’un montage raté — une fois écrites, ne plus les refaire :

1. Couper dans les silences **mesurés par l’outil**, jamais estimés par l’IA (timestamps Whisper dérivent 1–2 s).  
2. Plusieurs prises de la même idée → garder la **dernière** prise complète et fluide.  
3. ~**0,10 s** de souffle entre prises (un peu plus d’air au **début** qu’à la fin — c’est la fin des cuts qui traîne à l’oreille).  
4. Phrases qui attaquent sur une voyelle (« Et », « En ») : ne pas manger le premier mot (« Et tout » → « Tout »).  
5. Contrôle final : **re-transcrire** le montage et vérifier qu’aucun mot réel n’a sauté / qu’aucune mauvaise prise n’a survécu.  
6. FitMangas : ne « corrige » pas le discours pour le faire ressembler au brief écrit.

## Tournage (prévention) — réglages iPhone FitMangas

### Vidéo Reels — DÉFAUT (recommandé)

| Réglage | Choix | Pourquoi |
|---------|--------|----------|
| Mode | **Vidéo** | — |
| Format | **Normal / SDR** | Couleurs OK dans HyperFrames sans tonemap |
| | **Pas HDR** | HDR a déjà cassé un Reel (fade) |
| Résolution | **HD 1080p** (ou 4K) | IG sort en 1080×1920 |
| IPS | **30** | Aligné export |
| Cadre | **Vertical 9:16** face cam | Phase actuelle |

### ProRes Log — possible MAINTENANT (avancé), pas « magique »

Log n’est pas interdit « pour plus tard ». C’est **meilleur pour coloriser**, mais **plus de travail** :

1. Fichiers très lourds (ProRes)  
2. Étape **obligatoire** avant HyperFrames : Log → SDR via LUT / tonemap (`lut3d` — déjà prouvé sur HLG)  
3. Valider la peau frame par frame  

Sans l’étape 2 → même catastrophe fade que le HDR mal converti.

**Choix FitMangas :** SDR Normal pour les Reels wellness face cam.  
**Log** = si tu veux un look cinéma et que tu acceptes le pipeline LUT sur un Reel test.

### Photos (bibliothèque / carousels / Feed)

| Réglage | Choix |
|---------|--------|
| Format | **HEIF** (pas RAW au quotidien) |
| MP | **24 MP** |
| Portrait | Optionnel portraits ; inutile pour UI / écrans |

Filmer face cam. Pas de plan exercice filmé (phase actuelle).

## Audio

Adobe Podcast Enhance (gratuit) recommandé si micro téléphone faible :
https://podcast.adobe.com/enhance
