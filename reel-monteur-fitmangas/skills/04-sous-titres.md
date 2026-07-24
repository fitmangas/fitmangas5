# Skill FitMangas — Sous-titres (voix réelle + règles LMDM)

Source : skill sous-titres LMDM (Alex) + style intangible FitMangas.

## Source unique

**Uniquement** la transcription Whisper de ce qui a été **prononcé**.  
Interdit : coller le brief / script s’il n’a pas été dit.

Si le brief dit « respiration costale » mais elle a dit « respire sur les côtés » → sous-titrer **sa** formulation.

## Découpage (LMDM — strict)

1. Viser **2 à 3 mots** par sous-titre. Court = lisible ; long = raté.  
2. Ne **jamais** finir sur un mot faible : « le », « de », « et », « qui », « un », « une », « en », « à ».  
   → Il s’accroche au mot suivant = démarrer le bloc d’après.  
3. Nom + adjectif **ensemble** (« prompts secrets » ne se coupe pas).  
4. Groupe verbal **ensemble** (« vient de te donner » = un bloc).  
5. Mot fort de fin de phrase → **seul** pour l’emphase.

Exemple LMDM (à imiter) — phrase orale :  
« Ils ont partagé ça dans leur documentation officielle. »  
→ `ILS ONT PARTAGÉ ÇA` · `DANS LEUR DOCUMENTATION` · `OFFICIELLE`

## Position (LMDM)

- Écran scindé : pile à la **jointure** animation / visage  
- Plein écran : plus bas, sans couvrir le visuel important  
- Fin **pile** à la frontière de section — **interdit** de déborder 0,2 s sur le plan suivant (look amateur)

## Style FitMangas (intangible — ne pas changer)

- Blanc + **contour noir**  
- Mot-clé fort en **terracotta** `#C45D3E` (1 max par bloc)  
- 2–3 mots, mobile-first  

## Orthographe post-Whisper

Corriger les **fautes évidentes** de transcription (ex. « Pues venid » → « Puedes venir »)  
sans réécrire le discours ni coller le brief.
