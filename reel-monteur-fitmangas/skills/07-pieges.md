# Skill FitMangas — Pièges (LMDM + incidents FitMangas)

## Pièges LMDM (Alex)

1. **HDR** : filmer en mode **Normal / SDR**, jamais HDR — visage terne / délavé une fois monté.  
2. **Zones mortes Instagram** :  
   - haut ~**150 px** (pseudo / photo profil)  
   - bas ~**400 px** (légende / likes)  
   - côtés ~**100 px**  
   → texte, schémas, chiffres = **zone centrale**  
3. **Coupes** : jamais laisser l’IA inventer les timestamps (dérive 1–2 s). Whisper + ffmpeg silencedetect ; l’IA décide **quoi** garder.  
4. **Sous-titres qui bavent** : fin pile à la frontière de section — pas de débordement sur le plan suivant.  
5. **Gros texte** qui répète la voix = look « vidéo IA générique » (skill 03).  
6. **Rendu** : HyperFrames **local** uniquement — pas de cloud HeyGen pour le final.

## Pièges FitMangas (appris en prod)

7. **ProRes Log / HDR sans tonemap** : si tu filmes Log ou HDR → **obligatoire** convertir en SDR Rec.709 (LUT / tonemap) **avant** HyperFrames. Retag seul = image fade horrible.  
8. **RNNoise (`arnndn`)** : peut écraser la voix progressivement (−16 → −50 dB). Interdit si la voix s’affaiblit (skill 08).  
9. **Screenshot mobile plein cadre** en scindé : dashboard coupé / illisible. CTA = desktop en **cartes flottantes**.  
10. **Pastille « 30 SEG » fausse** : durée uniquement si vraie ; sinon logo transparent sous le hook.  
11. **exports alias iCloud** : utiliser le dossier **local** `FitMangas-Reels/exports/` (vrai dossier, pas raccourci).  
12. **« Garde en mémoire »** seulement après OK humain sur le rendu — pas avant.

## Mot magique (LMDM)

Après une règle validée :  
« Garde ça en mémoire. Transforme en skill. Mets à jour le fichier skill concerné. »
