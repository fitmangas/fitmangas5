# Planning éditorial — 104 articles (gabarit)

Remplace ce fichier par ton export réel. Format attendu par `scripts/seed-blog-articles.ts` :

```markdown
## 1
Titre: Mon premier article pilates
Date: 2026-05-12
Catégorie: technique
Description: Courte accroche pour la carte article.

Contenu:
Premier paragraphe.

Deuxième paragraphe après ligne vide.
```

- **Catégorie** : une des slugs seedées (`technique`, `respiration`, `posture`, `renforcement`, `bien-etre`, `nutrition`) ou slug personnalisé (création auto si absent).
- **Date** : `YYYY-MM-DD` — sert à `scheduled_publication_at` (midi UTC) et au regroupement mensuel (8 articles / mois).

Si le fichier contient moins de 104 entrées, le script complète avec des articles génériques pour atteindre 104 lignes.
