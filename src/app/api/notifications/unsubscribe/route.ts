import { NextResponse } from 'next/server';

import { createAdminClient } from '@/lib/supabase/admin';
import { verifyUnsubscribeToken } from '@/lib/notifications/v2/unsubscribe';

/**
 * Désinscription des emails non transactionnels (lien signé, sans connexion).
 * - GET : page de confirmation SEULEMENT (aucune modification) — les antivirus de messagerie ouvrent les liens.
 * - POST : désinscription. Accepte le formulaire de la page et le « un clic » RFC 8058
 *   (corps `List-Unsubscribe=One-Click`, jeton dans l'URL).
 */

type Lang = 'fr' | 'es';

const COPY: Record<Lang, { title: string; body: string; button: string; done: string; invalid: string; error: string }> = {
  fr: {
    title: 'Se désinscrire',
    body: 'Tu ne recevras plus les emails non indispensables (nouveautés, offres). Les emails liés à ton compte, à tes paiements et aux annulations de lives continuent.',
    button: 'Me désinscrire',
    done: 'C’est noté : tu ne recevras plus les emails non indispensables. Tu peux changer d’avis à tout moment dans « Mes préférences ».',
    invalid: 'Ce lien n’est plus valide. Tu peux gérer tes emails depuis ton espace, dans « Mes préférences ».',
    error: 'La désinscription n’a pas pu être enregistrée. Réessaie dans un instant ou écris-nous depuis ton espace.',
  },
  es: {
    title: 'Darse de baja',
    body: 'Ya no recibirás los emails no indispensables (novedades, ofertas). Los emails de tu cuenta, tus pagos y las cancelaciones de clases siguen llegando.',
    button: 'Darme de baja',
    done: 'Listo: ya no recibirás los emails no indispensables. Puedes cambiar de opinión cuando quieras en « Mis preferencias ».',
    invalid: 'Este enlace ya no es válido. Puedes gestionar tus emails desde tu espacio, en « Mis preferencias ».',
    error: 'No se pudo registrar la baja. Inténtalo de nuevo en un momento o escríbenos desde tu espacio.',
  },
};

function page(lang: Lang, message: string, form?: { token: string }): NextResponse {
  const t = COPY[lang];
  const escaped = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const body = form
    ? `<p style="margin:0 0 24px;">${escaped(t.body)}</p>
       <form method="post" action="/api/notifications/unsubscribe?token=${encodeURIComponent(form.token)}&lang=${lang}">
         <button type="submit" style="background:#C45D3E;color:#fff;border:0;border-radius:999px;padding:14px 28px;font:600 12px/1 Inter,Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;cursor:pointer;">${escaped(t.button)}</button>
       </form>`
    : `<p style="margin:0;">${escaped(message)}</p>`;
  return new NextResponse(
    `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${escaped(t.title)} · FitMangas</title></head>
<body style="margin:0;background:#F5F0EB;color:#2D2D2D;font:15px/1.6 Inter,Arial,sans-serif;">
  <main style="max-width:520px;margin:64px auto;padding:36px 32px;background:#fff;border-radius:28px;box-shadow:0 18px 40px rgba(31,27,22,.08);">
    <p style="margin:0 0 6px;font:600 11px/1 Inter,Arial,sans-serif;letter-spacing:.2em;text-transform:uppercase;color:#C45D3E;">FitMangas</p>
    <h1 style="margin:0 0 18px;font:italic 600 30px/1.2 'Playfair Display',Georgia,serif;">${escaped(t.title)}</h1>
    ${body}
  </main>
</body></html>`,
    { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } },
  );
}

function langOf(url: URL): Lang {
  return url.searchParams.get('lang') === 'es' ? 'es' : 'fr';
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const lang = langOf(url);
  const token = url.searchParams.get('token') ?? '';
  if (!verifyUnsubscribeToken(token)) return page(lang, COPY[lang].invalid);
  return page(lang, '', { token });
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const lang = langOf(url);
  let token = url.searchParams.get('token') ?? '';
  let oneClick = false;
  try {
    const raw = await request.text();
    const form = new URLSearchParams(raw);
    oneClick = form.get('List-Unsubscribe') === 'One-Click';
    if (!token) token = form.get('token') ?? '';
  } catch {
    // corps illisible : on s'appuie sur le jeton de l'URL
  }
  const parsed = verifyUnsubscribeToken(token);
  if (!parsed) {
    return oneClick ? NextResponse.json({ error: 'invalid_token' }, { status: 400 }) : page(lang, COPY[lang].invalid);
  }

  const admin = createAdminClient();
  const [profileRes, prefsRes] = await Promise.all([
    admin.from('profiles').update({ marketing_email_opt_in: false }).eq('id', parsed.userId),
    admin.from('notification_preferences').update({ content_email_enabled: false }).eq('user_id', parsed.userId),
  ]);
  const failure = profileRes.error ?? prefsRes.error;
  if (failure) {
    console.error('[unsubscribe] enregistrement impossible', failure.message);
    return oneClick ? NextResponse.json({ error: 'save_failed' }, { status: 500 }) : page(lang, COPY[lang].error);
  }

  return oneClick ? NextResponse.json({ ok: true }) : page(lang, COPY[lang].done);
}
