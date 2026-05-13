# Dette technique (suivi hors lots fonctionnels)

Ce fichier recense des problèmes connus à traiter dans un lot dédié, pour ne pas les perdre ni les mélanger aux chantiers en cours.

## TypeScript — `CompteSidebar.tsx` (résolu le 2026-05-06)

- **Symptôme :** `TS2339` sur `exact` dans la boucle `links.map(...)`.
- **Résolution :** l'entrée `/compte#planning` déclare désormais `exact: false`, ce qui homogénéise la forme du tableau `links`.
- **Vérification :** `npx tsc --noEmit` (projet complet) + `npm run build` passent.

## Audit pré-lancement — classement

### Bloquants corrigés avant lancement

- Mentions légales : pages `/privacy` et `/terms` créées avec les informations publiques Mangas Alejandra EI, SIREN 947964508, 17 Passage Leroy 44300 Nantes.
- Footer landing : année dynamique et liens légaux réels.
- Accès serveur blog/replays : routes blog réservées aux membres Visio, overlay VisioLock sur les zones compte pour les autres offres.
- Sync Vimeo : masquage réversible et synchronisation incrémentale ajoutés.
- Webhooks / sécurité : Stripe refuse les événements non signés en production, route avatar admin protégée, RLS ajoutée sur tables internes.

### Importants à corriger dans la semaine

- Studio Nantes : compléter les instructions d’accès détaillées et les informations parking.
- Printful : vérifier la configuration du webhook dans le dashboard Printful en production.
- `boutique.order_delivered` : dépend de la disponibilité réelle du webhook delivered Printful ; sinon prévoir estimation/polling.
- Optimisations images : remplacer progressivement les `<img>` marketing par `next/image` dimensionné.
- Admin i18n complet : traduire l’ensemble des pages internes si Alejandra utilise l’admin en ES.

### Améliorations non bloquantes

- Templates email luxury : remplacer les HTML simples par le design avancé Phase 4.
- CI footer / vérification continue : ajouter un check de non-régression documentaire et email sender.
- Présence cours Nantes : le statut `enrollments.status = attended` existe ; prévoir une UX plus robuste si nécessaire.
