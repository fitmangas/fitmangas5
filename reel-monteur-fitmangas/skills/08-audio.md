# Skill FitMangas — Audio (voix, musique, SFX)

## Problème fréquent à éviter

**Ne jamais laisser le volume voix baisser progressivement** jusqu’au silence en fin de Reel.  
Cause typique : normalisation / limiter / ducking musique mal calés, ou fade audio trop long sur toute la durée.

## Voix (piste principale)

- Débruitage local OK (fond terrasse), mais **ne pas écraser** la voix
- Niveau cible stable ~**−16 LUFS** / ~−16 dB RMS sur **toute** la durée
- Vérifier la waveform : amplitude **constante** du début à la fin (sauf 0,3 s fade out final max)
- Si la voix s’affaiblit après traitement → **annuler** le traitement fautif et reprendre

### Interdit — RNNoise

- **Ne jamais utiliser** `arnndn` / RNNoise en double passe (ou même simple si doute)
- Incident réel : voix stable en source, puis −34 dB à 28 s → −50 dB à 48 s après RNNoise → fin quasi muette
- Préférer un débruitage **stationnaire** (ex. `afftdn` léger) et **mesurer** RMS par fenêtres avant de garder le traitement
- Preuve d’audibilité : région CTA / « te espero » doit rester ~même niveau que le début du Reel

## Musique

- Bed wellness doux, **~12 à 15 dB sous la voix**
- Fondu d’entrée court (~0,5–1 s)
- Fondu de sortie **seulement** sur les 1–2 dernières secondes
- La musique **ne doit pas** faire baisser la voix (pas de sidechain agressif)

## SFX

- Whoosh léger sur changement de section / apparition motion
- Soft pop sur CTA / logo fin
- Volumes skill : punchy ~−20 dB sous voix ; sons fins un peu plus hauts si besoin
- Jamais de SFX qui masquent un mot

## Contrôle qualité avant export

Écouter la fin à volume normal : on doit **encore clairement** entendre « te espero » / CTA.  
Si non → corriger avant `npm run render`.
