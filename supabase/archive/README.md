# Archive SQL — NE PAS EXÉCUTER

Fichiers conservés pour l’historique uniquement. **Ne jamais les exécuter** (ni dans l’éditeur SQL Supabase, ni via `supabase db push`).

- `CATCH_UP_ALL.sql` : ancien script de rattrapage qui rejoue des migrations anciennes. Il recrée notamment la politique « Users can insert own enrollments » et écraserait des réglages actuels. Déplacé hors de `supabase/migrations/` le 19/10/2026 (lot 1 du chantier d’octobre) pour qu’aucun outil ne le prenne pour une migration.
