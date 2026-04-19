/**
 * Smoke test Vimeo : GET /me via src/lib/vimeo.ts
 *
 * Usage : npx tsx --env-file=.env.local scripts/test-vimeo-me.ts
 */

import { getVimeoAccount } from '../src/lib/vimeo';

async function main() {
  const me = await getVimeoAccount();
  console.log('Connexion Vimeo OK.');
  console.log(`Nom affiché : ${me.name ?? '(non renseigné)'}`);
  console.log(`Profil Vimeo : ${me.uri}`);
  console.log(`Lien public : ${me.link ?? '—'}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
