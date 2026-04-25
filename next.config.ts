import type { NextConfig } from 'next';

function supabaseStoragePattern(): { protocol: 'https'; hostname: string; pathname: string } | null {
  try {
    const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!raw) return null;
    const u = new URL(raw);
    return { protocol: 'https', hostname: u.hostname, pathname: '/storage/v1/object/public/**' };
  } catch {
    return null;
  }
}

const supabasePattern = supabaseStoragePattern();
const distDir = process.env.NEXT_DIST_DIR?.trim() || '.next';

const nextConfig: NextConfig = {
  distDir,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'www.dropbox.com', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
      { protocol: 'https', hostname: 'i.vimeocdn.com', pathname: '/**' },
      ...(supabasePattern ? [supabasePattern] : []),
    ],
  },
};

export default nextConfig;
