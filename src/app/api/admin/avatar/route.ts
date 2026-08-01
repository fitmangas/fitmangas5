import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { requireAdminApi } from '@/lib/auth/assert-admin-api';

const CANDIDATE_FILES = [
  path.join(process.cwd(), 'public', 'alejandra.jpg'),
  path.join(process.cwd(), 'public', 'client-contact-photo.jpg'),
];

function contentTypeFor(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
  return 'image/png';
}

export async function GET() {
  const gate = await requireAdminApi();
  if (!gate.ok) return gate.response;

  for (const filePath of CANDIDATE_FILES) {
    try {
      const buffer = await readFile(filePath);
      return new Response(buffer, {
        headers: {
          'content-type': contentTypeFor(filePath),
          'cache-control': 'no-store',
        },
      });
    } catch {
      // continue to next candidate file
    }
  }

  return new Response('Avatar not found', { status: 404 });
}
