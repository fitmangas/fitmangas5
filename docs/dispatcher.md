# Dispatcher de notifications (Lot 1)

## Point d’entrée

- **Fichier** : `src/lib/notifications/dispatcher.ts`
- **Fonction** : `dispatch(supabase, input, deps?)`
- **Client Supabase** : utiliser la **clé service_role** côté serveur uniquement (inserts sur `notification_log`, `user_notifications`, `notification_frequency_cap` avec RLS restrictive pour les rôles client).

## Interface `DispatchInput`

| Champ | Description |
|--------|-------------|
| `event_type` | Identifiant stable de l’événement (ex. `community.birthday`, `subscription.payment_failed.invoice`). Sert au routage **catégorie** et aux règles **critique / silence**. |
| `user_id` | `uuid` profil, ou **`null`** pour événement anonyme (log analytics uniquement). |
| `payload` | Données libres ; pour l’in-app : recommander `title`, `body`, `kind` (sinon dérivés de `event_type`). |
| `channel_hints` | Optionnel ; sous-ensemble de canaux à considérer (`in_app`, `email`, `push`, `digest`). Si absent, tous les canaux éligibles selon préférences. |
| `idempotency_key` | Optionnel ; unique globalement dans `notification_log`. Deuxième appel avec la même clé → `{ skipped: 'duplicate' }` sans effet. |

## Règles métier (v1)

1. **Doublon** : si `idempotency_key` existe déjà dans `notification_log`, retour immédiat.
2. **Anonyme** (`user_id === null`) : un insert `notification_log` (`channel: log`), pas de canaux cliente.
3. **Préférences** : lecture `notification_preferences` ; si absent, défauts alignés migration Phase 1 (`defaults.ts`).
4. **Profil** : `preferred_locale` (`fr` \| `es`), `display_timezone` (IANA ; défaut `Europe/Paris`).
5. **Silence** : si `silence_mode_enabled` et événement **non critique** → un seul log `_silence_skip`, pas d’in-app ni email.  
   **Critique** (contourne le silence) : préfixe `subscription.payment_failed`, ou motif `course.<segment>.cancelled`.
6. **Catégories** × canaux : `category.ts` (`courses` \| `content` \| `shop` \| `community`) × colonnes `*_inapp_enabled` / `*_email_enabled`.
7. **Caps** : max **2 emails / jour / utilisatrice** (scope `email:YYYY-MM-DD` fuseau cliente dans `notification_frequency_cap`) ; max **5 notifications in-app non lues** (`user_notifications.read_at IS NULL`) avant de bloquer de **nouveaux** inserts in-app.
8. **Email** : `sendEmailPlaceholder` (Lot 8 : Resend) — noop par défaut.
9. **Push / digest** : non envoyés au Lot 1 (lots ultérieurs).
10. **Journal** : une ligne `notification_log` par livraison effective (`channel`: `email` ou `log` avec `_delivered`), ou ligne `_no_client_delivery` si tout est bloqué par préfs/caps. La clé `idempotency_key` n’est posée que sur **la première** ligne créée pour l’appel (contrainte unique).

## Tests

```bash
npm run test
```

Fichier : `src/lib/notifications/dispatcher.test.ts`.

## Évolutions prévues

- Lot 4 : push web  
- Lot 5 : Realtime  
- Lot 6 : caps admin  
- Lot 8 : Resend réel + audit expéditeur  

Les producteurs existants (replay, blog, etc.) **ne sont pas** branchés sur ce dispatcher au Lot 1.
