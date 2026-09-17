# Module Acquisition — Configuration & passage SANDBOX → LIVE

Ce document décrit comment activer le module `/admin/croissance` (onglets Acquisition), les permissions Meta, et le passage sandbox → live.

## Capacité conversion (à jour)

- Relances **J+1 / J+3 / J+7** (rappel → preuve sociale → dernier message)
- Catalogue **IG + Messenger + WhatsApp** (opt-out inclus)
- Poll IG de secours **déclenche les workflows** (messages < 2h)
- Score lead 0–100 + sync Stripe trial/paid sur e-mail / profil
- Récolte auto d’e-mail si la prospecte le tape dans un DM

---

## 1. Activer le module en local

Dans `.env.local` :

```env
ACQUISITION_MODULE_ENABLED=true
MESSAGING_MODE=sandbox
```

Puis redémarrer le serveur Next.js et ouvrir `/admin/croissance?tab=overview`.

- **SANDBOX** : badge orange visible. Aucun appel Meta/WhatsApp réel. Journal sandbox (onglet Workflows).
- **LIVE** : à n’activer qu’après validation Meta (voir §3).

---

## 2. Variables d’environnement

| Variable | Défaut | Rôle |
|---|---|---|
| `ACQUISITION_MODULE_ENABLED` | `false` | Affiche les onglets Acquisition dans Croissance |
| `MESSAGING_MODE` | `sandbox` | `sandbox` ou `live` |
| `ACQUISITION_AI_DISCLOSURE_FR` | `false` | Préfixe « Assistant IA FitMangas » (marché FR/UE) |
| `ACQUISITION_AI_DISCLOSURE_MX` | `false` | Idem marché MX |
| `ANTHROPIC_API_KEY` | — | Concierge IA (sinon règles fallback keyword) |

Le lien d’essai Stripe **n’utilise aucune écriture Stripe** : il pointe vers `/connexion?course=v-coll&utm_source=…`.

---

## 3. Permissions Meta (App Review)

Messaging Acquisition **séparé** de la publication CM.

### Instagram Messaging

- `instagram_basic`, `instagram_manage_messages`, `pages_manage_metadata`, `pages_read_engagement`, `pages_show_list`

### Facebook Messenger

- `pages_messaging`, `pages_manage_metadata`, `pages_read_engagement`, `pages_show_list`

### Webhooks LIVE

| Plateforme | Champs |
|---|---|
| Instagram | `messages`, `messaging_postbacks`, `message_reactions` |
| Page | `messages`, `messaging_postbacks`, `feed` |

URL : `{NEXT_PUBLIC_APP_URL}/api/acquisition/webhooks/meta`  
Verify token : `ACQUISITION_META_VERIFY_TOKEN`

### WhatsApp Business API

- WABA + numéro vérifié + templates hors fenêtre 24h
- `whatsapp_business_messaging`

---

## 4. Passer SANDBOX → LIVE

1. Tables `acq_*` en prod (+ colonne `lead_score`).
2. Token Page avec scopes messaging.
3. `admin_settings.acquisition_meta_connection` (Page ID, IG User ID, token).
4. Webhooks Meta branchés.
5. `MESSAGING_MODE=live` sur Vercel après un test réel.
6. Hors fenêtre 24h IG = templates uniquement.

---

## 5. Conformité IA

- `ACQUISITION_AI_DISCLOSURE_FR` / `_MX` = `false` par défaut.
- Si `true` : préfixe « Assistant IA FitMangas — » sur la 1re réponse.
