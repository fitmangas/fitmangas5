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
2) Motion design : illustrer l'idée (charte cream/terracotta FitMangas).
   Zéro gros texte qui répète la voix.
   Écran scindé par défaut (visuel haut / visage bas).
3) Sous-titres 2–3 mots, sync sur la transcription réelle.
4) Attends mon OK section par section avant export final.
5) SFX puis musique (~15 dB sous la voix).
6) Export MP4 1080x1920 30fps LOCAL uniquement — INTERDIT HeyGen cloud.

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

## F — Mot magique

```
Garde ça en mémoire. Transforme cette règle en skill réutilisable
et mets à jour le fichier skill concerné.
```
