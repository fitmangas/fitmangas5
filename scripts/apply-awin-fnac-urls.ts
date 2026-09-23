/**
 * Liens Awin → Fnac FR (éditeur 3103771, marchand Fnac 12665).
 * Activer disclosure=true seulement quand Fnac = Joined (plus Pending).
 *
 * Usage : npx tsx scripts/apply-awin-fnac-urls.ts
 *         npx tsx scripts/apply-awin-fnac-urls.ts --disclose   # flip badge après Approuvé
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function loadEnvLocal() {
  try {
    const raw = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8');
    for (const line of raw.split('\n')) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (!m) continue;
      let val = m[2]!.trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!process.env[m[1]!]) process.env[m[1]!] = val;
    }
  } catch {
    /* ignore */
  }
}

loadEnvLocal();

const AWIN_MID = 12665; // Fnac FR
const AWIN_AFF = 3103771; // Mangas Alejandra

function awin(dest: string) {
  return `https://www.awin1.com/cread.php?awinmid=${AWIN_MID}&awinaffid=${AWIN_AFF}&ued=${encodeURIComponent(dest)}`;
}

const RESOURCES: { id: string; title: string; dest: string }[] = [
  {
    id: 'a0e86d67-ea6b-4c36-81c9-86e4f7f37214',
    title: "Le corps n'oublie rien",
    dest: 'https://www.fnac.com/SearchResult/ResultList.aspx?Search=9782266300728&sft=1',
  },
  {
    id: '5389a57b-a514-497c-8530-35e3b908886e',
    title: 'Un rien peut tout changer',
    dest: 'https://www.fnac.com/SearchResult/ResultList.aspx?Search=9782035969200&sft=1',
  },
  {
    id: '66dc7acd-0a28-4981-8eba-b8c7f0542146',
    title: "Pourquoi j'ai mangé mon père",
    dest: 'https://www.fnac.com/SearchResult/ResultList.aspx?Search=Pourquoi+Roy+Lewis+pere&sft=1',
  },
  {
    id: '778affab-75f1-4e77-b295-bf2bcc32ece0',
    title: 'Tapis de sol Pilates',
    dest: 'https://www.fnac.com/SearchResult/ResultList.aspx?Search=tapis+pilates&sft=1',
  },
  {
    id: '311e03ff-ceef-4f99-b46d-f19359170588',
    title: 'Ballon de gym / Pilates',
    dest: 'https://www.fnac.com/SearchResult/ResultList.aspx?Search=ballon+pilates&sft=1',
  },
];

async function main() {
  const disclose = process.argv.includes('--disclose');
  const { createClient } = await import('@supabase/supabase-js');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    console.error('NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquants.');
    process.exit(1);
  }
  const admin = createClient(url, key, { auth: { persistSession: false } });

  for (const r of RESOURCES) {
    const affiliate_url = awin(r.dest);
    const { error } = await admin
      .from('reading_resources')
      .update({ affiliate_url, disclosure: disclose })
      .eq('id', r.id);
    if (error) {
      console.error('Échec', r.title, error.message);
      process.exit(1);
    }
    console.log(disclose ? 'OK+badge' : 'OK', r.title, '→', affiliate_url.slice(0, 80) + '…');
  }
  console.log(
    disclose
      ? 'Badge « Lien affilié » activé.'
      : 'disclosure=false (Fnac encore Pending). Relance avec --disclose après Joined.',
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
