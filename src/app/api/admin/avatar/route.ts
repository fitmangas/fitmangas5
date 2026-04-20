import { readFile } from 'node:fs/promises';
import path from 'node:path';

const CANDIDATE_FILES = [
  '/Users/kevinpicard/.cursor/projects/Users-kevinpicard-Projets-fitmangas5/assets/Capture_d_e_cran_2026-04-20_a__18.47.03-9db0a32c-1321-433e-abd7-9f19a8a3f461.png',
  '/Users/kevinpicard/.cursor/projects/Users-kevinpicard-Projets-fitmangas5/assets/Capture_d_e_cran_2026-04-20_a__18.41.31-3fb04dea-76fa-4347-acc8-7c59cf5f0c6a.png',
];

function contentTypeFor(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
  return 'image/png';
}

export async function GET() {
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
