# Monteur Reel FitMangas — guide pas à pas (très détaillé)

Méthode : Claude Code + HyperFrames **local** (guide LMDM / Alex), adaptée FitMangas.

**Règle FitMangas :** on **ne lit PAS** un script à l’écran.  
Tu parles **naturellement** (comme à une cliente).  
Les sous-titres viennent de la **transcription de ta voix** (Whisper local), pas d’un texte lu.

Le brief dans FitMangas = **aide-mémoire avant de filmer** (sujet, hook, 3 idées), **pas** un prompteur.

---

## PARTIE 0 — Ce dont tu as besoin avant de commencer

### Compte / abo
- Un abonnement **Claude Pro** (~20 €/mois) sur le site Anthropic / Claude.
- Ce n’est **pas** la page “acheter des crédits API” (console.anthropic.com). Tu peux ignorer/fermer cette page.
- Tu as besoin de **Claude Code** (version agent), pas seulement le chat Claude classique.

### Matériel
- Ton **Mac**
- Ton **téléphone** pour filmer (vertical 9:16)
- Une connexion internet
- ~1 après-midi libre pour le **premier** setup

### Où sont les fichiers FitMangas
Sur ton Mac, le projet est ici (Finder) :

`/Users/kevinpicard/Projets/fitmangas5/reel-monteur-fitmangas/`

À l’intérieur :
- `README.md` (ce guide)
- `PROMPTS.md` (textes à copier-coller)
- `skills/` (règles pour Claude Code)

---

## PARTIE 1 — Installer Claude Code (une seule fois)

### Étape 1.1 — Ouvrir le bon site
1. Ouvre Safari ou Chrome.
2. Va sur : **https://claude.com/claude-code**
3. Connecte-toi avec le **même compte** que ton Claude habituel.

### Étape 1.2 — Vérifier l’abonnement
1. Tu dois être sur un plan **Pro** (ou supérieur).
2. Si on te propose d’upgrader pour Claude Code → accepte le plan Pro.
3. Si tu es déjà Pro → continue.

### Étape 1.3 — Installer l’app
1. Sur la page Claude Code, clique sur le bouton pour **télécharger / installer** l’app **Mac**.
2. Ouvre le fichier téléchargé (comme pour toute app Mac).
3. Glisse Claude dans **Applications** si demandé.
4. Ouvre **Claude** / **Claude Code** depuis Applications.
5. Connecte-toi si on te le demande.

### Étape 1.4 — Comment savoir que c’est bon
Tu dois voir une interface où tu peux **écrire un message** et où Claude peut **faire des actions** (créer des fichiers, lancer des commandes), pas seulement discuter.

Si tu n’as que le chat web classique sans possibilité d’agir sur ton Mac → ce n’est pas encore Claude Code. Reviens sur https://claude.com/claude-code et suis “Desktop app”.

**Dis-moi “Étape 1 OK” quand l’app est ouverte et connectée.**

---

## PARTIE 2 — Créer un dossier de travail Reels (une seule fois)

### Étape 2.1 — Créer le dossier
1. Ouvre le **Finder**.
2. Va dans **Documents**.
3. Clic droit → **Nouveau dossier**.
4. Nomme-le exactement : `FitMangas-Reels`

### Étape 2.2 — Sous-dossiers
Dans `Documents/FitMangas-Reels`, crée encore :
- `brutes` → tu y mettras les vidéos filmées
- `exports` → tu y mettras les MP4 finis
- `assets` → logo, musique, sons (plus tard)

### Étape 2.3 — Copier le kit skills FitMangas
1. Ouvre un **deuxième** Finder.
2. Va dans : `Projets` → `fitmangas5` → `reel-monteur-fitmangas`
3. Copie le dossier **`skills`** (Cmd+C).
4. Colle-le **dans** `Documents/FitMangas-Reels` (Cmd+V).

Tu dois avoir :
`Documents/FitMangas-Reels/skills/` avec des fichiers `.md` dedans.

**Dis-moi “Étape 2 OK” quand c’est fait.**

---

## PARTIE 3 — Installer HyperFrames via Claude Code (une seule fois)

Tu **ne tapes pas** de commandes techniques toi-même.

### Étape 3.1 — Ouvrir le projet dans Claude Code
1. Ouvre Claude Code.
2. Dis-lui (ou utilise “Open folder” si tu vois ce bouton) d’ouvrir le dossier :

`/Users/kevinpicard/Documents/FitMangas-Reels`

Si tu ne sais pas comment ouvrir un dossier :
1. Dans Claude Code, cherche un menu du type **File → Open Folder**
2. Choisis `Documents` → `FitMangas-Reels` → Ouvrir

### Étape 3.2 — Coller le prompt d’installation
1. Dans FitMangas admin (Community) sur un Reel, clique **Copier prompt install (1×)**  
   **OU** ouvre `reel-monteur-fitmangas/PROMPTS.md` section A et copie le bloc.
2. Colle dans Claude Code.
3. Envoie.
4. **Laisse-le travailler.** Il peut demander “Allow” / “Autoriser” pour lancer des commandes → clique **Allow** / **Oui**.
5. Attends qu’il dise que le **studio de prévisualisation local** est prêt.

### Étape 3.3 — Si ça bloque
Dis-lui exactement :
```
Répare l'erreur toi-même. Toujours rendu HyperFrames LOCAL, jamais cloud HeyGen.
Dis-moi quand le studio tourne.
```

### Étape 3.4 — Charger les skills FitMangas
Quand l’install est OK, colle ceci :

```
Lis tous les fichiers du dossier skills/ de ce projet.
Ce sont mes règles de montage FitMangas.
Garde-les en mémoire et transforme-les en compétences réutilisables
pour toutes les prochaines vidéos.
Confirme la liste des skills chargés.
Important FitMangas : on ne lit PAS de script à l'écran.
La coach parle naturellement ; sous-titres = transcription de la vraie voix.
```

**Dis-moi “Étape 3 OK” + ce qu’il a répondu (même en résumé).**

---

## PARTIE 4 — Préparer les assets (une seule fois, peut être plus tard)

Pas bloquant pour un premier test, mais mieux avant la 2ᵉ vidéo.

Dans `Documents/FitMangas-Reels/assets/` mets :
1. Logo FitMangas (PNG transparent si possible)
2. Une musique douce (mp3) — wellness, calme
3. 5–10 petits sons CapCut (whoosh, pop, riser…) exportés en fichiers audio

Puis dis à Claude Code :
```
Voici mon dossier assets/. Utilise-les pour les prochains montages FitMangas.
Garde le mapping en mémoire.
```

---

## PARTIE 5 — Filmer (à chaque Reel) — SANS lire un script

### Étape 5.1 — Dans FitMangas admin
1. Va sur l’admin Community.
2. Ouvre le Reel du jour.
3. Lis le **hook** + les **idées** (3 points max).
4. **Ferme le téléphone / l’écran de script** avant de filmer.
5. Optionnel : note 3 mots sur un papier hors caméra (pas un texte à lire).

### Étape 5.2 — Réglages téléphone
1. Caméra en **vertical** (9:16).
2. Mode **Normal** / Standard — **PAS HDR** (très important).
3. Lumière douce face à toi.
4. Micro : écouteurs avec micro ou micro-cravate si tu as ; sinon téléphone assez près.

### Étape 5.3 — Comment parler
- Parle comme à une amie / une cliente.
- Tu peux te tromper, recommencer une phrase, laisser des blancs → **normal**.
- Claude Code **dérushera** (enlèvera blancs et mauvaises prises).
- **Interdit** : coller un long texte et le lire à l’écran (ça se voit et ça sonne faux).

### Étape 5.4 — Durée
Vise 45 s à 2–3 min de **brut** (avec reprises). Le montage final sera plus court.

### Étape 5.5 — Transférer sur le Mac
1. Airdrop / câble : envoie la vidéo dans  
   `Documents/FitMangas-Reels/brutes/`
2. Renomme-la simplement, ex. : `2026-07-21-dos.mp4`

### Étape 5.6 — (Optionnel mais recommandé) Améliorer la voix
1. Va sur https://podcast.adobe.com/enhance
2. Upload ta vidéo ou l’audio
3. Télécharge la version améliorée
4. Remplace / ajoute le fichier dans `brutes/`

---

## PARTIE 6 — Monter avec Claude Code (à chaque Reel)

### Étape 6.1 — Copier le prompt depuis FitMangas
1. Admin → Reel → **Copier prompt montage**
2. Colle dans un Note temporaire
3. Remplace la ligne  
   `[COLLE ICI LE CHEMIN DU FICHIER .mp4]`  
   par le vrai chemin, ex. :

`/Users/kevinpicard/Documents/FitMangas-Reels/brutes/2026-07-21-dos.mp4`

Astuce pour trouver le chemin :
1. Clic droit sur le fichier dans Finder
2. Maintiens **Option (⌥)**
3. Clique **Copier “… ” en tant que chemin d’accès**
4. Colle dans le prompt

### Étape 6.2 — Lancer dans Claude Code
1. Vérifie que Claude Code est bien sur le dossier `FitMangas-Reels`
2. Colle le prompt complet
3. Envoie
4. Autorise les commandes si demandé
5. Attends le dérush + aperçu

### Étape 6.3 — Ce qui doit se passer (ordre)
1. Transcription de **ta vraie voix** (Whisper local)
2. Coupe des blancs / mauvaises prises (ffmpeg)
3. Découpe en sections
4. Motion design (sans gros texte qui répète ce que tu dis)
5. Sous-titres **2–3 mots**, calés sur ce que tu as **vraiment dit**
6. Tu valides section par section
7. SFX + musique
8. Export MP4 **local**

### Étape 6.4 — Pendant la revue
Parle-lui en français, comme à un monteur, ex. :
```
Sur la section démo, mets mon visage plus grand en bas.
Le sous-titre est trop long ici, coupe en 2–3 mots.
Garde ça en mémoire.
```

### Étape 6.5 — Export
Quand tu es contente :
```
Exporte le MP4 final en local 1080x1920 30fps.
Donne-moi le chemin du fichier. Pas de cloud HeyGen.
Mets aussi une copie dans le dossier exports/.
```

---

## PARTIE 7 — Remettre dans FitMangas (à chaque Reel)

1. Admin Community → le même Reel
2. Clique **Importer le MP4 monté**
3. Choisis le fichier dans `exports/`
4. Vérifie l’aperçu
5. Ajuste la légende si besoin
6. **Programmer** ou **Publier**

---

## Rappels coûts

| Élément | |
|---------|--|
| Claude Pro (Claude Code) | ~20 €/mois — obligatoire pour cette méthode |
| HyperFrames local | Gratuit |
| HeyGen cloud | Non |
| Crédits API Anthropic Console | Non |

---

## En cas de blocage

Envoie-moi une capture avec :
1. Le numéro d’étape (ex. 3.2)
2. Ce que tu vois à l’écran
3. Le message d’erreur s’il y en a un
