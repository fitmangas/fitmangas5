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
  async redirects() {
    // Anciens slugs ES génériques / FR courts → slug FR canonique publié.
    // Évite les 404 Search Console après renommage SEO des articles.
    const blogSlugRedirects: Array<{ source: string; destination: string }> = [
      {
        source: '/blog/articulo-pilates-2-movimiento-y-respiracion',
        destination: '/blog/article-pilates-2-mouvement-souffle-002',
      },
      {
        source: '/blog/articulo-pilates-15-movimiento-y-respiracion',
        destination: '/blog/article-pilates-15-mouvement-souffle-015',
      },
      {
        source: '/blog/articulo-pilates-16-movimiento-y-respiracion',
        destination: '/blog/article-pilates-16-mouvement-souffle-016',
      },
      {
        source: '/blog/articulo-pilates-17-movimiento-y-respiracion',
        destination: '/blog/article-pilates-17-mouvement-souffle-017',
      },
      {
        source: '/blog/articulo-pilates-18-movimiento-y-respiracion',
        destination: '/blog/article-pilates-18-mouvement-souffle-018',
      },
      {
        source: '/blog/articulo-pilates-19-movimiento-y-respiracion',
        destination: '/blog/article-pilates-19-mouvement-souffle-019',
      },
      {
        source: '/blog/articulo-pilates-20-movimiento-y-respiracion',
        destination: '/blog/article-pilates-20-mouvement-souffle-020',
      },
      {
        source: '/blog/articulo-pilates-21-movimiento-y-respiracion',
        destination: '/blog/article-pilates-21-mouvement-souffle-021',
      },
      { source: '/blog/article-pilates-2', destination: '/blog/article-pilates-2-mouvement-souffle-002' },
      { source: '/blog/article-pilates-3', destination: '/blog/article-pilates-3-mouvement-souffle-003' },
      { source: '/blog/article-pilates-4', destination: '/blog/article-pilates-4-mouvement-souffle-004' },
      { source: '/blog/article-pilates-5', destination: '/blog/article-pilates-5-mouvement-souffle-005' },
      { source: '/blog/article-pilates-6', destination: '/blog/article-pilates-6-mouvement-souffle-006' },
      { source: '/blog/article-pilates-7', destination: '/blog/article-pilates-7-mouvement-souffle-007' },
      { source: '/blog/article-pilates-8', destination: '/blog/article-pilates-8-mouvement-souffle-008' },
      { source: '/blog/article-pilates-9', destination: '/blog/article-pilates-9-mouvement-souffle-009' },
      { source: '/blog/article-pilates-10', destination: '/blog/article-pilates-10-mouvement-souffle-010' },
      { source: '/blog/article-pilates-11', destination: '/blog/article-pilates-11-mouvement-souffle-011' },
      { source: '/blog/article-pilates-12', destination: '/blog/article-pilates-12-mouvement-souffle-012' },
      { source: '/blog/article-pilates-13', destination: '/blog/article-pilates-13-mouvement-souffle-013' },
      { source: '/blog/article-pilates-14', destination: '/blog/article-pilates-14-mouvement-souffle-014' },
      { source: '/blog/article-pilates-15', destination: '/blog/article-pilates-15-mouvement-souffle-015' },
      { source: '/blog/article-pilates-16', destination: '/blog/article-pilates-16-mouvement-souffle-016' },
      { source: '/blog/article-pilates-17', destination: '/blog/article-pilates-17-mouvement-souffle-017' },
      { source: '/blog/article-pilates-18', destination: '/blog/article-pilates-18-mouvement-souffle-018' },
      { source: '/blog/article-pilates-19', destination: '/blog/article-pilates-19-mouvement-souffle-019' },
      { source: '/blog/article-pilates-20', destination: '/blog/article-pilates-20-mouvement-souffle-020' },
      { source: '/blog/article-pilates-21', destination: '/blog/article-pilates-21-mouvement-souffle-021' },
    ];

    return [
      // URL cassée indexée par Google : https://fitmangas.com/&
      { source: '/&', destination: '/', permanent: true },
      { source: '/%26', destination: '/', permanent: true },
      ...blogSlugRedirects.map((item) => ({
        ...item,
        permanent: true,
      })),
    ];
  },
};

export default nextConfig;
