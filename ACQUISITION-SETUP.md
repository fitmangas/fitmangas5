# Module Acquisition — Configuration & passage SANDBOX → LIVE

Ce document décrit comment activer le module `/admin/acquisition`, les permissions Meta à demander, et le passage du mode sandbox au mode live.

---

## 1. Activer le module en local

Dans `.env.local` :

```env
ACQUISITION_MODULE_ENABLED=true
MESSAGING_MODE=sandbox
```

Puis redémarrer le serveur Next.js et ouvrir `/admin/acquisition`.

- **SANDBOX** : badge orange visible en haut de page. Aucun appel Meta/WhatsApp réel. Chaque envoi est loggé dans le journal sandbox (onglet Workflows).
- **LIVE** : à n’activer qu’après validation Meta (voir §3).

---

## 2. Variables d’environnement

| Variable | Défaut | Rôle |
|---|---|---|
| `ACQUISITION_MODULE_ENABLED` | `false` | Affiche la page + lien sidebar admin |
| `MESSAGING_MODE` | `sandbox` | `sandbox` ou `live` |
| `ACQUISITION_AI_DISCLOSURE_FR` | `false` | Préfixe « Assistant IA FitMangas » (marché FR/UE) |
| `ACQUISITION_AI_DISCLOSURE_MX` | `false` | Idem marché MX |
| `ANTHROPIC_API_KEY` | — | Concierge IA (sinon règles fallback keyword) |

Le lien d’essai Stripe **n’utilise aucune écriture Stripe** : il pointe vers `/connexion?course=v-coll&utm_source=…` (checkout créé plus tard côté app existante).

---

## 3. Permissions Meta à demander (App Review)

Le messaging Acquisition est **séparé** de la publication CM (`meta-social.ts`). Il faut une app Meta Business dédiée ou étendue avec :

### Instagram Messaging

- `instagram_basic`
- `instagram_manage_messages`
- `pages_manage_metadata`
- `pages_read_engagement`
- `pages_show_list`

### Facebook Messenger (Page Fit.mangas)

- `pages_messaging`
- `pages_manage_metadata`
- `pages_read_engagement`
- `pages_show_list`

### Webhooks à configurer (LIVE)

| Plateforme | Champs webhook |
|---|---|
| Instagram | `messages`, `messaging_postbacks`, `message_reactions` |
| Page | `messages`, `messaging_postbacks`, `feed` (commentaires → private reply) |

URL callback : `{NEXT_PUBLIC_APP_URL}/api/acquisition/webhooks/meta`  
*(route implémentée — brancher dans Meta Developers une fois le verify token défini)*

Verify token : variable `ACQUISITION_META_VERIFY_TOKEN` (Vercel + `.env.local`).

### WhatsApp Business API

- Compte WABA lié à la même app Meta
- Numéro vérifié + templates approuvés (hors fenêtre 24h)
- Permission : `whatsapp_business_messaging`

---

## 4. Étapes App Review (résumé)

1. **Business Verification** Meta — entreprise FitMangas validée.
2. **Use case** : répondre aux DM Instagram/Messenger/WhatsApp pour qualifier des prospects et proposer l’essai 7 jours (pas de spam, opt-in respecté).
3. **Vidéo de démo** : parcours sandbox enregistré (inbox → réponse → lien essai → escalade humaine).
4. **Politique de confidentialité** : mentionner traitement des messages et droit de retrait.
5. **Test users** : comptes Meta de test listés dans la soumission.

---

## 5. Passer de SANDBOX à LIVE

1. Appliquer la migration SQL **§9** de `PROPOSITIONS_MIGRATIONS.md` (GO écrit Kevin).
2. Renouveler le Page Access Token avec les scopes messaging (distinct du token CM publication si possible).
3. Stocker en `admin_settings` clé `acquisition_meta_connection` (Page ID, IG User ID, token) — **ne pas réutiliser aveuglément** le token CM sans vérifier les scopes.
4. Configurer les webhooks Meta vers l’API interne.
5. Passer `MESSAGING_MODE=live` sur Vercel **uniquement** après test sur un fil réel.
6. Vérifier la fenêtre 24h Instagram : messages proactifs hors fenêtre = templates uniquement.

---

## 6. Conformité IA (câblé, éteint)

- `ACQUISITION_AI_DISCLOSURE_FR=false` et `ACQUISITION_AI_DISCLOSURE_MX=false` par défaut.
- Quand `true`, la 1re réponse du concierge est préfixée « Assistant IA FitMangas — ».
- Escalade humaine : garde-fou code — uniquement contacts `qualified`, `trial` ou `paid`.
- Broadcast : refusé si `opt_in=false` sur le contact.

---

## 7. Ce qui fonctionne déjà sans Meta LIVE

| Fonction | État |
|---|---|
| Dashboard entonnoir + KPIs | GA4, GSC, Stripe lecture, Supabase |
| Boucle performance hooks | Banque CM + table `post_metrics` si migrée |
| Inbox UI | Après migration §9 + seed démo |
| Envoi messages | SANDBOX loggé |
| Workflows + 10 actions | Exécutable en test sur fil sélectionné |
| Concierge Claude | Si `ANTHROPIC_API_KEY`, sinon fallback mots-clés + bouton « Réponse IA » |
| KPIs ARPU / LTV / churn | Stripe price_cents + business_stats_daily |
| Meta LIVE (code) | Providers Graph API + webhook + checklist admin |
| Lien essai | URL `/connexion` existante, zéro Stripe write |

---

## 8. Points bloquants connus

- **Migration §9 non appliquée** → pas de persistance inbox (message explicite en UI).
- **Meta App Review** → LIVE messaging impossible avant approbation permissions.
- **WhatsApp templates** → requis pour relances hors fenêtre 24h.
- **CAC/LTV** → proxies basés sur MRR actuel ; affinage quand budget ads branché.
