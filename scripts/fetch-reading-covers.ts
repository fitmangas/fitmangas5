/**
 * Récupère les couvertures Open Library pour reading_resources (livres),
 * les cache dans public/library/book-covers/ et met à jour cover_image_url.
 *
 * Usage : npx tsx scripts/fetch-reading-covers.ts
 */
import { createWriteStream, existsSync, mkdirSync } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';

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

const OUT_DIR = resolve(process.cwd(), 'public/library/book-covers');

/** ISBN connus (priorité) — sinon recherche titre+auteur. */
const ISBN_BY_ID: Record<string, string> = {
  'a0e86d67-ea6b-4c36-81c9-86e4f7f37214': '9782266300728', // Le corps n'oublie rien
  '5389a57b-a514-497c-8530-35e3b908886e': '9781847941831', // Un rien / Atomic Habits (cover OL)
  '66dc7acd-0a28-4981-8eba-b8c7f0542146': '9782253144175', // Pourquoi j'ai mangé mon père
  '4f5e514f-b1b5-47e8-b5bc-31e53a96584d': '9788499884080', // El cuerpo lleva la cuenta
  '046ca84a-12e1-47bd-adbe-7da101dac137': '9781847941831', // Hábitos / Atomic Habits (cover OL)
};

async function coverByIsbn(isbn: string): Promise<Buffer | null> {
  const url = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`;
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) return null;
  const ct = res.headers.get('content-type') ?? '';
  if (!ct.includes('image')) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 2500) return null; // trop petite / 1x1
  return buf;
}

async function coverBySearch(title: string, author: string): Promise<Buffer | null> {
  const q = new URL('https://openlibrary.org/search.json');
  q.searchParams.set('title', title);
  q.searchParams.set('author', author);
  q.searchParams.set('limit', '5');
  const res = await fetch(q.toString(), {
    headers: { 'User-Agent': 'FitMangasCoverBot/1.0 (info@casamangas.com)' },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as {
    docs?: Array<{ cover_i?: number; isbn?: string[] }>;
  };
  const docs = json.docs ?? [];
  for (const d of docs) {
    if (d.isbn?.[0]) {
      const b = await coverByIsbn(d.isbn[0]);
      if (b) return b;
    }
    if (d.cover_i) {
      const url = `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg`;
      const r = await fetch(url);
      if (!r.ok) continue;
      const buf = Buffer.from(await r.arrayBuffer());
      if (buf.length >= 2500) return buf;
    }
  }
  return null;
}

async function saveCover(id: string, buf: Buffer): Promise<string> {
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
  const rel = `/library/book-covers/${id}.jpg`;
  const abs = resolve(process.cwd(), `public${rel}`);
  await pipeline(Readable.from(buf), createWriteStream(abs));
  return rel;
}

async function main() {
  const { createClient } = await import('@supabase/supabase-js');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    console.error('Supabase env manquants');
    process.exit(1);
  }
  const admin = createClient(url, key, { auth: { persistSession: false } });

  const { data, error } = await admin
    .from('reading_resources')
    .select('id, title, author, resource_type, cover_image_url')
    .eq('resource_type', 'book');
  if (error) {
    console.error(error.message);
    process.exit(1);
  }

  const missing: string[] = [];
  for (const row of data ?? []) {
    console.log('→', row.title);
    let buf: Buffer | null = null;
    const isbn = ISBN_BY_ID[row.id];
    if (isbn) buf = await coverByIsbn(isbn);
    if (!buf) buf = await coverBySearch(row.title, row.author);
    if (!buf) {
      console.log('  ✗ introuvable');
      missing.push(`${row.title} (${row.author}) [${row.id}]`);
      continue;
    }
    const path = await saveCover(row.id, buf);
    const { error: upErr } = await admin
      .from('reading_resources')
      .update({ cover_image_url: path })
      .eq('id', row.id);
    if (upErr) {
      console.error('  DB', upErr.message);
      process.exit(1);
    }
    console.log('  ✓', path, `(${buf.length} o)`);
  }

  console.log('\n=== Couvertures à compléter à la main ===');
  if (missing.length === 0) console.log('(aucune)');
  else missing.forEach((m) => console.log('-', m));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
