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
  const jitsi = jitsiOrigin();
  return [
    { key: 'Content-Security-Policy-Report-Only', value: buildContentSecurityPolicy() },
    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    {
      key: 'Permissions-Policy',
      // fullscreen, autoplay et display-capture volontairement non restreints (live, replays).
      value: `camera=(self "${jitsi}"), microphone=(self "${jitsi}"), geolocation=(), browsing-topics=()`,
    },
  ];
}
