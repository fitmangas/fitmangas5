# Affiliation — démarches Kevin (mécanique code déjà en place)

Le site **n’inscrit à aucun programme** à ta place. Quand tu as un lien affilié, tu le colles en base ; l’UI affiche le bouton + le badge **« Lien affilié »** obligatoire, et chaque clic est tracé dans `affiliate_clicks`.

## Où coller le lien

Table Supabase `reading_resources` :
- `affiliate_url` = ton URL trackée (Amazon / Fnac / Decathlon…)
- `disclosure` = `true` (recommandé ; l’UI affiche quand même « Lien affilié » dès qu’il y a une URL)

Admin SQL exemple :
```sql
UPDATE reading_resources
SET affiliate_url = 'https://www.amazon.fr/...?...tag=TONTAG',
    disclosure = true
WHERE id = '…';
```

## Programmes à créer (toi, hors Cursor)

1. **Amazon Partenaires (FR)** — https://partenaires.amazon.fr — idéal livres (ex. *Atomic Habits*, *Le corps n’oublie rien*). Tag affilié dans l’URL.
2. **Fnac Affiliation** — https://www.fnac.com/ (programme partenaires / Awin selon période) — livres FR grand public.
3. **Decathlon Affiliation** — matériel Pilates léger (tapis, ballon) si tu ajoutes des ressources `resource_type = gear`.
4. *(Optionnel ES)* Amazon.es Partners si le club de lecture ES est prioritaire.

## Règle légale

Toujours le libellé **« Lien affilié »** visible à côté du lien (déjà codé). Pas de faux avis « cliente » sur un produit affilié.
