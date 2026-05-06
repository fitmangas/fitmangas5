# Dette technique (suivi hors lots fonctionnels)

Ce fichier recense des problèmes connus à traiter dans un lot dédié, pour ne pas les perdre ni les mélanger aux chantiers en cours.

## TypeScript — `CompteSidebar.tsx` (résolu le 2026-05-06)

- **Symptôme :** `TS2339` sur `exact` dans la boucle `links.map(...)`.
- **Résolution :** l'entrée `/compte#planning` déclare désormais `exact: false`, ce qui homogénéise la forme du tableau `links`.
- **Vérification :** `npx tsc --noEmit` (projet complet) + `npm run build` passent.
