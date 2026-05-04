# Matrice communications & produit — FitMangas5 (v1 verrouillée)

Document de référence **Phase 0** : intègre les décisions fondateur (périmètre par offre, RGPD, langue/fuseau, URL prod, blog EN, upsell, **blog public landing uniquement**).  
**Ne pas** traiter ce fichier comme avis juridique ; les modèles légaux sont dans `docs/legal-templates-fr-es-draft.md` (validation externe requise).

---

## 1. Segments & tiers techniques

| Segment métier | `CustomerTier` (RPC / profil) | Notes |
|----------------|------------------------------|--------|
| Visio collectif mensuel | `online_group_monthly` | « v-coll » |
| Visio individuel mensuel | `online_individual_monthly` | « v-ind » |
| Nantes collectif à l’unité | `onsite_group_single` | « n-coll », 10 €/séance, **pas** de cartes 5/10 |
| Nantes individuel à l’unité | `onsite_individual_single` | « n-ind », 50 €/séance, **pas** de cartes 5/10 |
| Newsletter seule | `customer_tier` null + inscription **newsletter blog** (double opt-in) | **Pas** de lecture des articles sur le **site** ; réception des **articles complets par email** (`sendPublicationNewsletter()` et flux associés). **Pas** d’in-app « blog » sans compte payant visio. |
| Visiteuse connectée sans offre | tier null | Overlay visio partout pertinent ; **pas** d’accès routes `/blog/*`. |
| Admin | `role = admin` | Hors overlay client (sauf mode démo) |

**Accès « contenu visio complet » sur le site** (blog routes, replays, progression visio, lives online, etc.)  
⇔ `online_group_monthly` **ou** `online_individual_monthly` (voir §8).

---

## 2. Blog — règle site v1 (décision fondateur)

| Sujet | Règle |
|--------|--------|
| Routes **`/blog`**, **`/blog/[slug]`** | **Réservées** aux abonnées **v-coll** et **v-ind** uniquement. **Aucune** URL publique du blog n’est accessible aux non-abonnées visio (ni anonymes, ni n-coll/n-ind, ni newsletter-only, ni connectée sans offre visio). |
| **Landing** publique (bas de page) | Nouvelle section **« Le blog »** : **aperçu** des **3 derniers** articles publiés (image de couverture, titre, extrait court 2–3 lignes max). |
| CTA sous les 3 aperçus | Texte : *« Accédez au blog complet en devenant membre Visio — à partir de 39€/mois »*. |
| Clic sur **un aperçu** d’article **ou** sur le **CTA** (sur la landing) | Redirection vers le **checkout Stripe v-coll** (price test : `price_1TTPinGe7RgAEfvcN2XTArqE` — aligné `STRIPE_PRICE_ID_VISIO_COLLECTIF`). |
| **Newsletter-only** | Le segment **existe toujours** : la newsletter blog (double opt-in) continue d’envoyer le **contenu article complet par email** ; il **n’y a pas** de lecture in-app sur la plateforme pour ce segment. L’événement métier **`blog.article_published`** (ou équivalent dans le dispatcher) reste pertinent **canal email uniquement**, pas de notification in-app « blog » sans compte payant visio. |

---

## 3. URL & domaines (Bloc D)

| Usage | Valeur v1 |
|--------|-----------|
| Plateforme web (liens emails, notifs, checkout success/cancel) | `https://fitmangas5.vercel.app` |
| Variables env | `NEXT_PUBLIC_APP_URL`, `APP_URL` = URL ci-dessus |
| Domaine `fitmangas.com` | **Uniquement** expédition email (ex. `alejandra@fitmangas.com` via Resend) — **pas** d’hébergement du site Next en v1 |

---

## 4. Langue & fuseau (Bloc C)

| Sujet | Règle |
|--------|--------|
| Signup | Langue **FR/ES** : auto-détection navigateur + **modifiable** avant validation ; valeurs par défaut **visibles** sur le formulaire. |
| Fuseau | Auto-détection navigateur + **modifiable** avant validation ; défaut visible. |
| Après inscription | À **chaque connexion** : mise à jour **silencieuse** du fuseau dérivé de `Intl.DateTimeFormat().resolvedOptions().timeZone` **sauf** si la cliente a activé un **override manuel** dans `/compte/preferences` — dans ce cas **ne plus écraser** l’override. |
| Blog UI v1 | **EN masqué** dans l’interface. En base, `preferred_blog_language = 'en'` **non destructif** : à la **lecture** pour communications / rendu, **mapper vers `fr`**. |

---

## 5. RGPD & rétention (Bloc B)

| Sujet | Décision |
|--------|----------|
| Mentions légales + politique confidentialité | Modèles **FR + ES** dans `docs/legal-templates-fr-es-draft.md` — **validation** par le fondateur / conseil. |
| Rétention logs d’envoi (email, événements dispatcher) | **24 mois** (purge ou archivage hors ligne à définir en implémentation). |
| Opt-in signup | Textes **FR + ES** dans `docs/signup-opt-in-texts-fr-es.md` — case à cocher : transactionnel obligatoire vs marketing/lifecycle **opt-in**. |
| Modèles légaux brouillon | `docs/legal-templates-fr-es-draft.md` (mentions + politique, structure FR/ES). |

---

## 6. Upsell unique (verrou UI)

| Élément | Règle |
|---------|--------|
| CTA (dashboard / compte) | **« Devenez membre complet pour 39€/mois »** |
| Action | Redirection **directe** vers checkout Stripe **v-coll** (`courseId: 'v-coll'`). |
| Après paiement | Webhook Stripe → mise à jour compte → déblocage **immédiat**, sans action manuelle cliente ni coach. |
| UX | Aperçu **réel** derrière flou/grisé ; overlay style **glass / luxury** ; badge **« Réservé aux membres Visio »** ; **pas** de pop-up automatique ; **pas** d’email upsell en v1. |
| Abandon checkout | Événement **`subscription.checkout_abandoned`** inséré dans futur `notification_log` — **pas** d’email de relance v1. |
| Couleur | **Aucune** teinte verte (règle produit globale). |
| Landing section blog | CTA dédié (libellé §2) ; mêmes principes **anti-surcharge** (pas de modale auto, pas d’email upsell v1). |

---

## 7. Paiement Nantes (Bloc A — rappel)

- **Uniquement** à l’unité (prix fixés : n-coll 10 €, n-ind 50 €).  
- **Pas** de système de cartes 5/10 séances.  
- **Pas** de notification métier du type « il vous reste X séances ».

---

## 8. Matrice d’accès par offre (synthèse opérationnelle)

Légende : **✅** accès / envoi prévu · **❌** pas d’accès · **🔒** visible en aperçu verrouillé + CTA upsell (espace compte) · **🛒** ouvert sans condition d’abonnement · **—** non applicable en v1 · **📧** canal email uniquement · **🏠** section landing (aperçus) sans lecture article sur site.

| Canal / fonctionnalité | v-coll | v-ind | n-coll | n-ind | newsletter-only | Invitée connectée sans offre | Public non connecté |
|-------------------------|--------|-------|--------|-------|-----------------|------------------------------|----------------------|
| **Blog** — lecture sur le site (`/blog`, `/blog/[slug]`, `/compte/blog`) | ✅ | ✅ | 🔒 / ❌ routes | 🔒 / ❌ routes | ❌ site ; **📧** article complet email | 🔒 / ❌ routes | ❌ routes |
| **Blog** — section **« Le blog »** en bas de **landing** (3 aperçus) | 🏠 | 🏠 | 🏠 | 🏠 | 🏠 | 🏠 | 🏠 |
| **Blog** — clic aperçu ou CTA **sur la landing** | → checkout v-coll | idem | idem | idem | idem | idem | idem |
| **Boutique Printful** | 🛒 | 🛒 | 🛒 | 🛒 | 🛒 | 🛒 | 🛒 |
| **Communauté WhatsApp** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Replays visio** (`replay_ready`, standalone Vimeo) | ✅ | ✅ | 🔒 | 🔒 | 🔒 | 🔒 | — |
| **Progression mensuelle** (dashboard) | ✅ | ✅ | 🔒 | 🔒 | 🔒 | 🔒 | — |
| **Prochain cours visio** (dashboard) | ✅ | ✅ | 🔒 | 🔒 | 🔒 | 🔒 | — |
| **Planning** — cours online | ✅ preview/full selon règles calendrier | idem | 🔒 / preview | idem | 🔒 | 🔒 | — |
| **Live Jitsi** (cours online) | ✅ si réservé | ✅ | 🔒 | 🔒 | 🔒 | 🔒 | — |
| **Nantes présentiel** (réservation / paiement) | — | — | ✅ unitaire | ✅ unitaire | ❌ | ❌ | — |
| **Emails transactionnels** (paiement, sécurité, compte) | ✅ | ✅ | ✅ | ✅ | ✅ si cas métier | ✅ compte | — |
| **Emails marketing / lifecycle** | ✅ si opt-in | idem | idem | idem | ✅ si opt-in | selon opt-in | — |
| **Publication article → newsletter ciblée** | 📧 + in-app si abonnée visio | idem | 📧 (pas in-app blog) | idem | **📧** uniquement | — | — |
| **Notif « X séances restantes » (cartes)** | — | — | ❌ | ❌ | ❌ | ❌ | — |

**Précision blog site :** pour n-coll / n-ind / sans offre, les routes `/blog/*` sont **inaccessibles** (redirection ou 403 selon implémentation) — pas seulement un overlay sur le contenu public, car **il n’y a pas** de page article publique en v1.

---

## 9. Événements à logger (v1 communications / analytics)

| `event_type` (proposition) | Déclencheur |
|----------------------------|-------------|
| `subscription.checkout_abandoned` | CTA upsell ou landing blog → Stripe checkout puis abandon / cancel sans succès (détail implémentation Phase 2+). |
| *(existant / futur)* | Envoi email, digest, push — alignés sur prompt maître une fois `notification_log` créé. |

**Rétention** : 24 mois pour les lignes de log d’envoi / événements traceurs RGPD.

---

## 10. Vérifications Phase 0 (Stripe / env)

Voir **`docs/phase0-verification-results.md`** : clés **test** ; **quatre** `STRIPE_PRICE_ID_*` et URL prod **fournis par le fondateur** à reporter dans `.env.local` / Vercel (valeurs listées dans ce document).

---

## 11. Inventaire UI verrouillée

Voir **`docs/upsell-locked-features-inventory.md`**.

---

## 12. Migration Supabase Phase 1 (proposition)

Voir **`docs/proposed-migration-phase1-comms.sql`** — **non exécutée** ; en revue jusqu’à validation explicite. Répartition RLS / **service_role** documentée en en-tête du fichier SQL.

---

## 13. Maquette overlay

Voir **`docs/ui-visio-premium-lock-mockup.md`**.
