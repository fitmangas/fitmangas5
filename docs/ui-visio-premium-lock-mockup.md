# Maquette / spec — `VisioPremiumLockOverlay` (luxury, v1)

## Objectif

Encadrer une **vraie** zone de l’interface (données réelles ou layout réel) pour les segments **sans** abonnement visio complet, tout en empêchant l’usage : l’utilisatrice **voit** ce qu’elle pourrait avoir, comprend le geste commercial, et peut passer au checkout en **un clic**.

## Structure visuelle

1. **Conteneur** : même rayon, bordure subtile et ombre que les `glass-card` existantes du compte (cohérence `CompteTopBar`, cartes dashboard).
2. **Couche contenu** (enfant) : `filter: blur(6px)` à `10px` + `opacity` ~ `0.45`–`0.55` (ajuster pour lisibilité du « teaser » sans lecture confortable). **Pas** de `opacity: 0` ni masque opaque plein écran sur la carte.
3. **Overlay** : gradient radial discret (halo type « champagne / ivoire / rose très pâle » aligné charte existante), léger bruit ou grain si déjà utilisé ailleurs, `backdrop-blur-sm` sur la zone overlay seulement si nécessaire pour le contraste du texte.
4. **Badge** : pill en haut à **droite** du cadre — texte **« Réservé aux membres Visio »** ; typo petite caps ou semi-bold ; bordure fine métallique ; **pas** de vert.
5. **Bloc central** (centré verticalement dans la **carte**, pas dans la page entière si la carte est haute — mais le CTA doit rester **visible sans scroll** dans la viewport pour les cartes « above the fold » du dashboard) :
   - **Bouton principal** (unique) : *Devenez membre complet pour 39€/mois* — style bouton primaire luxury (déjà utilisé sur landing/checkout).
   - **Sous-ligne** (1–2 phrases max, ton chaleureux) : texte **contextuel** passé en prop, ex. progression : *« Suivez votre régularité, vos cours suivis et votre courbe de progression. »*
6. **Interactions** : `pointer-events: none` sur le contenu flouté ; `pointer-events: auto` sur l’overlay ; clic bouton → `router.push` ou `window.location` vers URL checkout **v-coll** (même flux que landing).
7. **Accessibilité** : bouton focusable ; overlay avec `aria-hidden` sur le fond flouté si besoin ; annoncer le verrouillage pour lecteur d’écran (`aria-label` sur région).

## Comportements exclus

- Aucune **modale** upsell qui s’ouvre seule au chargement.
- Aucun **toast** répétitif « passez premium ».
- Pas d’**email** automatique déclenché par ce composant en v1.

## Props (spec technique)

```ts
type VisioPremiumLockOverlayProps = {
  /** Contenu réel à afficher en arrière-plan (aperçu). */
  children: React.ReactNode;
  /** Sous-texte sous le CTA (FR ou ES selon locale). */
  teaserDescription: string;
  /** Optionnel : analytics / log au clic CTA avant navigation. */
  onCtaClick?: () => void | Promise<void>;
};
```

## Responsive

- Mobile : badge reste lisible ; CTA pleine largeur max `sm` ; sous-texte `text-sm` interlignage confortable.

---

*Document pour validation design avant implémentation Phase 1+.*
