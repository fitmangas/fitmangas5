# Configuration Google Cloud — Analytics Data API & Search Console API

Ce guide permet à Kevin de connecter FitMangas à **Google Analytics 4 (données en direct)** et **Google Search Console** via un **compte de service**, puis de coller le JSON des clés dans Vercel (`GOOGLE_SERVICE_ACCOUNT_JSON`).

## 1. Ouvrir Google Cloud Console

1. Aller sur [https://console.cloud.google.com](https://console.cloud.google.com).
2. Se connecter avec le compte Google qui administre GA4 et Search Console.

## 2. Créer ou choisir un projet

1. En haut à gauche, menu déroulant des projets → **Nouveau projet**.
2. Nom suggéré : **FitMangas** (ou réutiliser un projet existant dédié à la prod).
3. Attendre la création, puis sélectionner ce projet.

## 3. Activer les APIs nécessaires

1. Menu **APIs et services** → **Bibliothèque**.
2. Rechercher **Google Analytics Data API** → **Activer** (c’est l’API GA4 pour lire les rapports).
3. Revenir à la bibliothèque, rechercher **Google Search Console API** → **Activer**.

## 4. Créer un compte de service (Service Account)

1. Menu **APIs et services** → **Comptes de service**.
2. **Créer un compte de service**.
3. Nom : par ex. `fitmangas-analytics`.
4. ID du compte : laisser la proposition ou l’ajuster ; l’e-mail final sera du type  
   `fitmangas-analytics@PROJECT_ID.iam.gserviceaccount.com`.
5. Rôle sur le projet (optionnel pour la lecture des APIs) : **Lecteur** ou aucun rôle supplémentaire si vous préférez gérer tout via GA / GSC (voir ci-dessous).
6. **Terminer**, puis ouvrir le compte de service créé.

## 5. Télécharger la clé JSON

1. Onglet **Clés** → **Ajouter une clé** → **Créer une nouvelle clé** → type **JSON** → **Créer**.
2. Le fichier `.json` est téléchargé : **le conserver précieusement** (ne pas le committer dans Git).

## 6. Autoriser le compte de service dans Google Analytics (GA4)

1. Aller sur [https://analytics.google.com](https://analytics.google.com).
2. **Admin** (roue dentée) → colonne **Propriété** → **Gestion des accès à la propriété**.
3. **+** → **Ajouter des utilisateurs**.
4. Coller l’e-mail du compte de service : `fitmangas-analytics@PROJECT_ID.iam.gserviceaccount.com`.
5. Rôle : **Lecteur** (suffit pour l’API Data).
6. Enregistrer.

## 7. Autoriser le compte de service dans Google Search Console

1. Aller sur [https://search.google.com/search-console](https://search.google.com/search-console).
2. Sélectionner la propriété FitMangas (domaine ou préfixe d’URL, selon votre configuration).
3. **Paramètres** → **Utilisateurs et autorisations** (ou **Gestion des utilisateurs** selon l’interface).
4. **Ajouter un utilisateur** avec l’e-mail du compte de service.
5. Rôle : **Complet** (recommandé pour l’API Search Console : inspection d’URL, sitemaps, données de performance).
6. Valider.

## 8. Variables d’environnement sur Vercel

1. Dashboard Vercel → projet FitMangas → **Settings** → **Environment Variables**.
2. Ajouter :
   - **`GOOGLE_SERVICE_ACCOUNT_JSON`** : ouvrir le fichier JSON téléchargé, **copier tout le contenu** (une seule ligne ou multiligne selon ce que Vercel accepte ; en pratique coller le JSON brut complet).  
     - Ne pas mettre de guillemets autour du JSON entier sauf si votre outil d’export l’exige.
   - **`GA4_PROPERTY_ID`** : l’identifiant numérique de la propriété GA4 (ex. `14875490391`). On le trouve dans GA4 → **Admin** → **Détails de la propriété** → **ID de la propriété**.

3. Redéployer l’application pour prendre en compte les variables.

## 9. Vérification locale (optionnel)

Dans `.env.local` (non versionné), ajouter les mêmes clés qu’en production, puis relancer `npm run dev` et ouvrir `/admin/marketing` : les sections **Google Analytics** et **Google Search Console** doivent afficher des données (ou des erreurs explicites si l’ID propriété ou l’URL Search Console ne correspond pas).

## Dépannage rapide

| Symptôme | Piste |
|----------|--------|
| Permission denied GA4 | Vérifier l’e-mail du compte de service dans **Gestion des accès** GA4 (rôle Lecteur). |
| Search Console 403 | Vérifier que la propriété GSC ajoutée correspond à l’URL utilisée dans le code (ex. `https://fitmangas.com/` avec slash final, ou `sc-domain:fitmangas.com`). |
| JSON invalide | Vérifier que `GOOGLE_SERVICE_ACCOUNT_JSON` est le JSON complet (clés `type`, `project_id`, `private_key`, `client_email`, etc.). |
