# Rapport bibliothèque 1.7 — pipeline photo CM

Date : 2026-07-27

## Poids

| | Mo |
|---|---|
| `public/` **AVANT** | **1752,9** |
| `public/` **APRÈS** | **~78** |
| `public/library/` après | **~74** |
| `library-originals/` (hors dépôt) | **~1,9 Go** |

**Fichiers > 1 Mo dans `public/` : 0** (confirmé).

## Tableau dossiers publiés

| dossier | nb fichiers web (unique) | cible | manquant | 4:5 | 1:1 |
|---|---|---|---|---|---|
| portraits | 17 | 12 | 0 | oui | oui |
| pilates-mat | 27 | 12 | 0 | oui | oui |
| barre | 17 | 8 | 0 | oui | oui |
| renfo-core | 18 | 8 | 0 | oui | oui |
| coaching-visio | 9 | 6 | 0 | oui | oui |
| lifestyle-coulisses | 14 | 6 | 0 | oui | oui |
| ambiance-studio | 5 | 5 | 0 | oui | oui |
| produit-captures | 6 | 3 | 0 | oui | oui |

Chaque photo : `.webp` + `.jpg` fallback + `-4x5.webp` + `-1x1.webp`.

## Écartés / déplacés hors dépôt (`library-originals/`)

- **119** fichiers `._*` AppleDouble : **supprimés** (seule exception).
- **Doublons** (~21) : gardé meilleure résolution, originaux déplacés.
- **Non-web** : 1× MOV (79 Mo), 1× DNG (64 Mo), HEIC convertis puis originaux conservés.
- **Basse rés / `_low` / UUID 828×1242 / IMG_4060** : déplacés, non publiés.
- Dossier entier `Bibliothèque Fitmangas/` + lourds racine / ancien `library/` : déplacés puis versions web régénérées.

Log réversible : `library-originals/ops-log.jsonl`  
Rapport brut : `library-originals/pipeline-report.json`  
Manifest : `public/library/manifest.json`

## Scripts

- `scripts/run-library-pipeline.mjs` (one-shot)
- `scripts/optimize-library.ts` (rejouable)
- `scripts/extract-frames.ts` (ffmpeg → variantes)
