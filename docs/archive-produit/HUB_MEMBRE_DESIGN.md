# Connaissance de soi — hub membre (refonte design 2026-09-23)

## Surfaces
- `/compte/connaissance-de-soi` (+ progression / tests / corps / developpement)
- Capture UX : `/quiz/hub-membre-capture?section=&filled=`

## Design
- Scène Mon évolution : grands chiffres, pastilles donut, courbe SVG draw-on, 1 photo ambiance max
- Onglets sticky icône + label (`SelfKnowledgeHubNav`)
- Empty : silhouettes (curve / pastilles / radar / journal / books) — pas photo coach
- Motion : `hub-member-motion.css` + `AnimatedCounter` ; `prefers-reduced-motion`

## Club lecture
- `cover_image_url` + cache `public/library/book-covers/`
- Script `scripts/fetch-reading-covers.ts` (Open Library)
- Sections Lectures (`book`) vs Matériel (`gear`) séparées
- Badge affilié si `disclosure` + « Même prix »

## Ne pas casser
VisioLock · quiz publics · banque 100% · dédup email · PDF print page
