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

## Règles opérationnelles

1. Couper dans les silences mesurés par l’outil, jamais estimés par l’IA.
2. Plusieurs prises de la même idée → garder la **dernière** prise complète et fluide.
3. ~0,10 s de souffle entre prises (un peu plus d’air au début qu’à la fin).
4. Attention aux attaques voyelle (« Et », « En ») : ne pas manger le premier mot.
5. Contrôle final : re-transcrire le montage et vérifier qu’aucun mot réel n’a sauté.
   Ne « corrige » pas le discours pour le faire ressembler au brief écrit.

## Audio

Adobe Podcast Enhance (gratuit) recommandé si micro téléphone faible :
https://podcast.adobe.com/enhance
