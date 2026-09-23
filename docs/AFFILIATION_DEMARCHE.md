# Affiliation — état opérationnel

Mécanique code : bouton + tracking `affiliate_clicks` + badge **« Lien affilié »** seulement si `disclosure = true`.

## État 23/09/2026

| Programme | Réseau | Statut |
|---|---|---|
| **Fnac FR** | **Awin** (#12665), éditeur **3103771** | Candidature **Pending Approval**. Liens Awin→Fnac déjà en base FR (`disclosure=false` tant que pas Joined). |
| **Amazon** | Partenaires | En pause (identifiants perso à retrouver). |
| **Decathlon** | **Rakuten** (pas Awin en FR) | Pas encore — autre inscription. |

| Ressource | Lien | Badge |
|---|---|---|
| Livres + matériel FR | Awin → Fnac | non (attente Joined → `npx tsx scripts/apply-awin-fnac-urls.ts --disclose`) |
| Livres / gear ES | aucun (Amazon retiré) | — |

UI : mention « Même prix qu’en magasin » sous le bouton.

## Après Fnac Approuvé

1. Dashboard Awin → My Programmes → Fnac = Joined  
2. `npx tsx scripts/apply-awin-fnac-urls.ts --disclose`  
3. (Optionnel) Link Builder pour URLs produit exactes au lieu des recherches ISBN.

## Règle légale

Pas de badge sans programme réellement actif. Prix client = prix catalogue (aucune majoration).
