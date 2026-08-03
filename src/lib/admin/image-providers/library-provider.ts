import fs from 'node:fs';
import path from 'node:path';

import type { ImageGenerateResult, ImageProvider, ImageSize } from '@/lib/admin/image-providers/types';

export type LibraryFolderId =
  | 'portraits'
  | 'pilates-mat'
  | 'barre'
  | 'renfo-core'
  | 'coaching-visio'
  | 'lifestyle-coulisses'
  | 'ambiance-studio'
  | 'produit-captures';

type ManifestFileEntry =
  | string
  | {
      file: string;
      ratios?: { web?: boolean; '4x5'?: boolean; '1x1'?: boolean };
      dims?: string;
      bytes?: number;
    };

export type LibraryManifestFolder = {
  theme: string;
  target: number;
  count?: number;
  missing?: number;
  files: ManifestFileEntry[];
};

export type LibraryManifest = {
  version: number;
  antiRepeatN?: number;
  themeMapping?: Record<string, LibraryFolderId | string>;
  folders: Partial<Record<LibraryFolderId, LibraryManifestFolder>>;
  generatedAt?: string;
  updatedAt?: string;
};

const MANIFEST_PATH = path.join(process.cwd(), 'public', 'library', 'manifest.json');

const recentPicks: string[] = [];

const FALLBACK_LIBRARY: string[] = [
  '/library/portraits/portrait-01.webp',
  '/library/portraits/portrait-01-4x5.webp',
  '/library/pilates-mat/pilates-mat-01.webp',
  '/library/pilates-mat/pilates-mat-01-4x5.webp',
  '/Photo Alejandra pose pour photographe.JPG',
  '/Photo Alejandra exercice avec anneau.JPG',
  '/Photo Alejandra exercice sur la plage.JPG',
  '/alejandra.jpg',
];

export function readLibraryManifest(): LibraryManifest | null {
  try {
    if (!fs.existsSync(MANIFEST_PATH)) return null;
    const raw = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8')) as LibraryManifest;
    if (!raw || typeof raw !== 'object' || !raw.folders) return null;
    return raw;
  } catch {
    return null;
  }
}

export function getAntiRepeatN(manifest?: LibraryManifest | null): number {
  const fromEnv = Number(process.env.LIBRARY_IMAGE_ANTI_REPEAT_N);
  if (Number.isFinite(fromEnv) && fromEnv > 0) return Math.floor(fromEnv);
  if (manifest?.antiRepeatN && manifest.antiRepeatN > 0) return manifest.antiRepeatN;
  return 12;
}

function entryToPublicPath(folderId: LibraryFolderId, entry: ManifestFileEntry): string | null {
  const raw = typeof entry === 'string' ? entry : entry?.file;
  if (!raw) return null;
  if (raw.startsWith('/')) return raw;
  if (raw.startsWith('library/')) return `/${raw}`;
  return `/library/${folderId}/${raw.replace(/^\/?library\/[^/]+\//, '')}`;
}

/** Chemins publics depuis le manifest (+ fallback). */
export function listLibraryPublicPaths(opts?: {
  folder?: LibraryFolderId;
  prefer4x5?: boolean;
}): string[] {
  const manifest = readLibraryManifest();
  if (!manifest) return [...FALLBACK_LIBRARY];

  const folderIds = opts?.folder
    ? [opts.folder]
    : (Object.keys(manifest.folders) as LibraryFolderId[]);

  const paths: string[] = [];
  for (const folderId of folderIds) {
    const folder = manifest.folders[folderId];
    if (!folder?.files?.length) continue;
    for (const entry of folder.files) {
      const publicPath = entryToPublicPath(folderId, entry);
      if (!publicPath) continue;
      if (/-4x5\./i.test(publicPath) || /-1x1\./i.test(publicPath)) continue;
      if (opts?.prefer4x5) {
        const base = publicPath.replace(/\.(webp|jpe?g|png)$/i, '');
        const crop = `${base}-4x5.webp`;
        // Strict manifest-only resolution: never probe disk files in public/library at runtime.
        const canUseCrop =
          typeof entry === 'object' && entry?.ratios && (entry.ratios['4x5'] === true || entry.ratios.web === true);
        paths.push(canUseCrop ? crop : publicPath);
      } else {
        paths.push(publicPath);
      }
    }
  }

  return paths.length ? paths : [...FALLBACK_LIBRARY];
}

export function listProductCapturePaths(): string[] {
  return listLibraryPublicPaths({ folder: 'produit-captures', prefer4x5: true });
}

export function folderForTheme(theme: string): LibraryFolderId {
  const manifest = readLibraryManifest();
  const mapped = manifest?.themeMapping?.[theme.toLowerCase()];
  if (mapped && typeof mapped === 'string') return mapped as LibraryFolderId;
  const hint = theme.toLowerCase();
  if (/portrait|visage|confiance|identit/.test(hint)) return 'portraits';
  if (/barre|hanche/.test(hint)) return 'barre';
  if (/renfo|core|gainage|énergie|energie/.test(hint)) return 'renfo-core';
  if (/visio|coaching|preuve/.test(hint)) return 'coaching-visio';
  if (/lifestyle|coulisse|stress|sommeil/.test(hint)) return 'lifestyle-coulisses';
  if (/ambiance|studio/.test(hint)) return 'ambiance-studio';
  if (/produit|cta|dashboard|capture/.test(hint)) return 'produit-captures';
  return 'pilates-mat';
}

function mimeFromPath(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  return 'application/octet-stream';
}

function rememberPick(publicPath: string, n: number) {
  recentPicks.push(publicPath);
  while (recentPicks.length > Math.max(n * 3, 24)) recentPicks.shift();
}

export function pickLibraryPath(opts?: {
  usedPaths?: Set<string>;
  seed?: number;
  folder?: LibraryFolderId;
  themeHint?: string;
}): string | null {
  const manifest = readLibraryManifest();
  const antiN = getAntiRepeatN(manifest);
  let folder = opts?.folder;
  if (!folder && opts?.themeHint) folder = folderForTheme(opts.themeHint);

  const list = listLibraryPublicPaths({ folder, prefer4x5: true });
  if (!list.length) return null;

  const blocked = new Set<string>([...(opts?.usedPaths ?? []), ...recentPicks.slice(-antiN)]);
  const start = Math.abs(opts?.seed ?? Date.now()) % list.length;

  for (let i = 0; i < list.length; i += 1) {
    const candidate = list[(start + i) % list.length]!;
    if (!blocked.has(candidate)) {
      rememberPick(candidate, antiN);
      return candidate;
    }
  }

  const any = list[start] ?? list[0] ?? null;
  if (any) rememberPick(any, antiN);
  return any;
}

export class LibraryImageProvider implements ImageProvider {
  readonly name = 'library';

  private usedPaths: Set<string>;
  private folder?: LibraryFolderId;
  private themeHint?: string;
  private seed: number;

  constructor(opts?: {
    usedPaths?: Set<string>;
    folder?: LibraryFolderId;
    themeHint?: string;
    seed?: number;
  }) {
    this.usedPaths = opts?.usedPaths ?? new Set();
    this.folder = opts?.folder;
    this.themeHint = opts?.themeHint;
    this.seed = opts?.seed ?? 0;
  }

  isAvailable(): boolean {
    return listLibraryPublicPaths({ folder: this.folder }).length > 0;
  }

  async generate(_prompt: string, _size: ImageSize): Promise<ImageGenerateResult> {
    const publicPath = pickLibraryPath({
      usedPaths: this.usedPaths,
      seed: this.seed,
      folder: this.folder,
      themeHint: this.themeHint,
    });
    if (!publicPath) {
      return { error: 'Bibliothèque vide — aucun fichier dans public/library/ (manifest).' };
    }

    // Runtime only returns known public path from manifest; no direct file reads.
    this.usedPaths.add(publicPath);
    return {
      buffer: Buffer.alloc(0),
      mimeType: mimeFromPath(publicPath),
      provider: this.name,
      publicPath,
    };
  }
}
