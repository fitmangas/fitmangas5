# Configuration webhook Vimeo

1. Créer un endpoint public : `https://<domaine>/api/webhooks/vimeo`.
2. Dans le tableau Vimeo Developer / Webhooks : coller l’URL, même secret que `VIMEO_WEBHOOK_SECRET` dans `.env`.
3. Définir `VIMEO_DEFAULT_COACH_ID` = UUID Supabase (`profiles.id`, identique à `auth.users.id`) pour attacher les nouvelles vidéos sans session.
4. Tester en local avec [ngrok](https://ngrok.com/) ou équivalent pour exposer `localhost`.

## Sécurité

- La signature est vérifiée avec `verifyVimeoWebhookSignature` (HMAC).
- Un rate limit fenêtre glissante par IP évite les floods (réponse HTTP 429).

## Dépannage

| Symptôme | Piste |
|----------|-------|
| 503 | `VIMEO_WEBHOOK_SECRET` absent |
| 400 Signature | Body brut vs secret mal copié ; vérifier que le proxy ne modifie pas le corps |
| 500 upsert colonne | Migration `coach_id`, `scheduled_publication_at`, etc. non appliquée |
