# Dette technique (suivi hors lots fonctionnels)

Ce fichier recense des problèmes connus à traiter dans un lot dédié, pour ne pas les perdre ni les mélanger aux chantiers en cours.

## TypeScript — `CompteSidebar.tsx` (résolu le 2026-05-06)

- **Symptôme :** `TS2339` sur `exact` dans la boucle `links.map(...)`.
- **Résolution :** l'entrée `/compte#planning` déclare désormais `exact: false`, ce qui homogénéise la forme du tableau `links`.
- **Vérification :** `npx tsc --noEmit` (projet complet) + `npm run build` passent.

## TODOs restants après Phase 3 communications

- Templates email luxury : remplacer les HTML simples par le design avancé Phase 4.
- Studio Nantes : compléter les instructions d’accès et les informations parking.
- Printful : routes webhook prêtes ; configuration à faire dans le dashboard Printful.
- `boutique.order_delivered` : dépend de la disponibilité réelle du webhook delivered Printful ; sinon prévoir estimation/polling.
- Mentions légales : compléter les placeholders `[...]` dans les brouillons juridiques.
- CI footer / vérification continue : ajouter un check de non-régression documentaire et email sender.
- Présence cours Nantes : le statut `enrollments.status = attended` existe ; prévoir une UX plus robuste si nécessaire.
- Accès serveur blog/replays : l’overlay UI est livré ; durcir les routes/API si la beta exige un 403 strict hors visio.
