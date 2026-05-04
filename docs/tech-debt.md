# Dette technique (suivi hors lots fonctionnels)

Ce fichier recense des problèmes connus à traiter dans un lot dédié, pour ne pas les perdre ni les mélanger aux chantiers en cours.

## TypeScript — `CompteSidebar.tsx`

- **Symptôme :** `npx tsc --noEmit` échoue avec `TS2339` sur une propriété `exact` absente du type union des entrées de navigation (vers la ligne 50 du fichier).
- **Contexte :** détecté lors du Lot 1 notifications ; pas corrigé dans ce lot pour respecter le périmètre.
- **Piste :** aligner le typage des items de sidebar avec les props attendues par `Link` / Next (`exact` si utilisé, ou retirer la propriété si elle ne correspond pas au schéma).
