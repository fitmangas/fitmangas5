# Inventaire — UI verrouillée « premium Visio » + CTA unique

**Décisions produit (verrouillé)**  
- **Débloqués (aucun overlay)** : `v-coll`, `v-ind` (tiers Stripe `online_group_monthly`, `online_individual_monthly` + règle métier équivalente).  
- **Overlay + CTA** : `n-coll`, `n-ind`, utilisatrice connectée **sans** abonnement visio actif, **newsletter-only** (pas de compte payant visio) — sur les zones **du compte** (dashboard, replays, progression, etc.).  
- **Boutique Printful** : **100 % ouverte** (pas de paywall) — **hors** inventaire verrouillage.  
- **Blog sur le site** : les routes **`/blog`**, **`/blog/[slug]`** et l’espace **`/compte/blog`** ne sont accessibles en lecture qu’aux **v-coll** et **v-ind**. Les autres segments **ne** consultent **pas** les articles sur le site ; la **newsletter-only** reçoit les articles **complets par email** (double opt-in), sans in-app blog.  
- **Landing publique** : section **« Le blog »** en bas de page — 3 aperçus (image, titre, extrait) ; clic aperçu ou CTA → **checkout Stripe v-coll** (voir matrice §2).  
- **WhatsApp** : accès communauté réservé aux segments payants + visio (pas newsletter-only) — **pas** d’automate WhatsApp en v1 ; seulement liens / contenus UI si présents.  
- **CTA unique** (zones compte / overlay) : libellé « Devenez membre complet pour 39€/mois » → checkout **direct** `v-coll` (`courseId: 'v-coll'`).  
- **Pas** de pop-up modale automatique ; **pas** d’email upsell en v1.  
- **Abandon checkout** : log `subscription.checkout_abandoned` dans futur `notification_log` (pas d’email).

**Mapping technique tier** (`CustomerTier` dans `src/lib/domain/calendar-types.ts`)  
| Offre | `CustomerTier` (RPC `current_customer_tier`) | Overlay ? |
|-------|-----------------------------------------------|-----------|
| v-coll | `online_group_monthly` | Non |
| v-ind | `online_individual_monthly` | Non |
| n-coll | `onsite_group_single` | Oui (zones visio listées) |
| n-ind | `onsite_individual_single` | Oui |

**Helper cible (Phase 1+)**  
`hasFullVisioContentAccess(tier): boolean` ⇔ tier ∈ { `online_group_monthly`, `online_individual_monthly` } OU `isAdmin` (politique admin : à trancher — par défaut admin non grisé).

---

## Pages / routes — à traiter (ordre proposé)

### Blog — accès site (Phase 1+)

| Fichier / zone | Comportement |
|----------------|----------------|
| `src/app/blog/**` (listing + `[slug]`) | **Protégé** : uniquement **v-coll** / **v-ind** ; sinon redirection auth ou offre / message cohérent (pas de lecture publique). |
| `src/app/compte/blog/page.tsx` | Même règle : **uniquement** visio ; sinon redirect ou état vide + lien checkout. |

### Espace client `/compte`

| Fichier / zone | Contenu à verrouiller | Notes |
|----------------|----------------------|--------|
| `src/app/compte/page.tsx` | Encadré **Progression mensuelle** (`MonthlyProgressRing`) | CTA + texte court sous CTA |
| idem | Encadré **Prochain live** (`NextLiveCompteCard`) | Idem |
| idem | Encadré **Replay & Bibliothèque** (heures + lien bibliothèque) | Replays + Vimeo = offre visio |
| idem | Encadré **Mon blog** | Si lien vers blog compte : visible seulement si visio ; sinon CTA / masquage |
| `src/app/compte/planning/page.tsx` | Section calendrier : cours **online** en `preview`/`locked` | Harmoniser **overlay luxury** + CTA v-coll |
| `src/app/compte/replays/page.tsx` | Liste replays cours + **standalone Vimeo** | Verrouiller pour non-visio |
| `src/components/Replay/MyReplaysSection.tsx` | Contenu replay | Parent page replays |
| `src/components/Replay/ReplayLibraryCard.tsx` | Cartes replay | Si utilisé hors admin |
| `src/app/compte/progression/page.tsx` | **Page entière** (stats progression visio) | Forte dépendance parcours visio |
| `src/app/live/[courseId]/page.tsx` | Accès live Jitsi | Déjà `access_type` ; overlay si `locked` avant redirect |
| `src/components/Compte/CompteTopBar.tsx` | (Optionnel) badge points / ruban | À arbitrer — peut rester |

### Landing publique

| Fichier | Comportement |
|---------|----------------|
| `src/app/page.tsx` (ou composant dédié) | Section **« Le blog »** : 3 derniers articles — aperçu uniquement ; clic → checkout **v-coll** ; CTA texte fondateur. |

### Boutique

- `src/app/compte/boutique/*`, `src/components/Compte/BoutiqueOrderComposer.tsx` — **pas** de verrouillage (hors scope).

### Admin

- **Aucun** overlay visio sur `/admin` (coach).

---

## APIs / données — contrôle serveur (Phase ultérieure)

Les endpoints suivants doivent **refuser** ou **dégrader** les données sensibles si non-visio (en complément de l’UI) :

- `src/app/api/client/blog/**` (favoris, vues, ratings, scroll…)  
- `src/app/api/calendar/events` (déjà filtré par accès — vérifier cohérence avec overlay)  
- `src/app/api/courses/[id]/access`  
- Toute future route « progression » si extraite du serveur

---

## Composant réutilisable (spec Phase 1 — pas de code ici)

**Nom de travail :** `VisioPremiumLockOverlay`  
- Enfant = contenu réel (aperçu).  
- `backdrop-blur` + léger `opacity` sur l’enfant ; **pas** masque opaque 100 %.  
- Badge « Réservé aux membres Visio » (coin supérieur droit de l’encadré).  
- Bouton unique centré : CTA + sous-texte contextuel (prop).  
- `pointer-events` : overlay capte le clic sauf si admin (exception).

---

### Compléments audit (routes & API)

| Fichier | Action |
|---------|--------|
| `src/app/api/calendar/export-ical/route.ts` | Si export réservé aux abonnées visio : refus ou fichier vide + message cohérent avec overlay (à trancher métier : export utile pour Nantes ?). |
| `src/app/api/calendar/events/route.ts` | Déjà filtré par politiques ; garder cohérence avec CTA unique checkout `v-coll` côté UI. |
| `src/app/api/courses/[id]/access/route.ts` | Garde serveur ; ne pas exposer `jitsi_link` si `locked`. |
| `src/app/compte/profil/page.tsx` | Futur **override fuseau** + locale UI ; masquage **EN** blog en UI v1. |
| `src/components/Compte/ProfileLanguageForm.tsx` | Masquer **EN** pour `preferred_blog_language` ; mapping lecture `en` → `fr` pour comms. |
| `src/components/Calendar/SmartCalendar.tsx` | Harmoniser CTA upsell (aujourd’hui `cta_url` peut pointer `/#offers` — à aligner sur checkout direct `v-coll`). |

---

*Liste exhaustive au mieux du repo au moment de l’audit ; compléter lors du premier grep « import » croisé avec `getUserTier` / `getUserLivePrivileges`.*
