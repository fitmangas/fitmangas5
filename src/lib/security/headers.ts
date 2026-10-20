/**
 * En-têtes de sécurité (SPEC §7.5). La CSP est en **Report-Only** : elle n’empêche rien,
 * elle signale les violations à /api/csp-report.
 */

function jitsiOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_JITSI_DOMAIN?.trim() || 'live.fitmangas.com';
  return raw.startsWith('http') ? raw.replace(/\/$/, '') : `https://${raw.replace(/\/$/, '')}`;
}

function supabaseOrigin(): string | null {
  try {
    const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return raw ? new URL(raw).origin : null;
  } catch {
    return null;
  }
}

export function buildContentSecurityPolicy(): string {
  const jitsi = jitsiOrigin();
  const jitsiWss = jitsi.replace(/^https:/, 'wss:');
  const supa = supabaseOrigin();
  const supaWss = supa?.replace(/^https:/, 'wss:');

  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'",
      "'unsafe-eval'",
      'https://www.googletagmanager.com',
      'https://www.google-analytics.com',
      'https://connect.facebook.net',
      'https://js.stripe.com',
      'https://player.vimeo.com',
      'https://challenges.cloudflare.com',
      jitsi,
      'https://meet.jit.si',
    ],
    'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    'img-src': ["'self'", 'data:', 'blob:', 'https:'],
    'font-src': ["'self'", 'data:', 'https://fonts.gstatic.com'],
    'media-src': ["'self'", 'blob:', 'https:'],
    'connect-src': [
      "'self'",
      ...(supa ? [supa] : []),
      ...(supaWss ? [supaWss] : []),
      'https://www.google-analytics.com',
      'https://*.google-analytics.com',
      'https://*.analytics.google.com',
      'https://www.googletagmanager.com',
      'https://www.facebook.com',
      'https://connect.facebook.net',
      'https://api.stripe.com',
      'https://*.vimeo.com',
      'https://vimeo.com',
      'https://*.vimeocdn.com',
      'https://challenges.cloudflare.com',
      'https://files.cdn.printful.com',
      jitsi,
      jitsiWss,
      'https://meet.jit.si',
      'wss://meet.jit.si',
    ],
    'frame-src': [
      "'self'",
      'https://js.stripe.com',
      'https://hooks.stripe.com',
      'https://checkout.stripe.com',
      'https://player.vimeo.com',
      'https://www.youtube.com',
      'https://www.youtube-nocookie.com',
      'https://www.instagram.com',
      'https://challenges.cloudflare.com',
      jitsi,
      'https://meet.jit.si',
    ],
    'worker-src': ["'self'", 'blob:'],
    'frame-ancestors': ["'self'"],
    'form-action': ["'self'", 'https://checkout.stripe.com'],
    'base-uri': ["'self'"],
    'object-src': ["'none'"],
    'report-uri': ['/api/csp-report'],
  };

  return Object.entries(directives)
    .map(([k, v]) => `${k} ${v.join(' ')}`)
    .join('; ');
}

export function buildSecurityHeaders(): Array<{ key: string; value: string }> {
  return [
    { key: 'Content-Security-Policy-Report-Only', value: buildContentSecurityPolicy() },
    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    {
      key: 'Permissions-Policy',
      // Caméra, micro, plein écran, lecture auto et partage d'écran volontairement NON restreints :
      // l'hôte de la visio vient de NEXT_PUBLIC_JITSI_DOMAIN ou, à défaut, de l'URL de salle en base
      // (ex. meet.jit.si). Une liste trop stricte couperait caméra et micro pendant un live.
      value: 'geolocation=(), browsing-topics=()',
    },
  ];
}
