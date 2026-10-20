import type { SupabaseClient } from '@supabase/supabase-js';

import { sendEmail } from '@/lib/email/send';
import { getEmailPublicBaseUrl, outlookButton, wrapResendEmailV2 } from '@/lib/email/base-template';
import { isProgrammesEnabled } from '@/lib/programmes/flag';
import { loadOfferFacts } from '@/lib/landing/home-data';
import { activationUrl, formatPriceShort, giftLang, longDateLabel, renderGiftPdf, stripeClient, visioMonthlyCents, type GiftLang, type GiftRow } from './cards';

/**
 * Emails des cartes cadeaux : C03 (destinataire, PDF joint) et confirmation d'achat (acheteuse, PDF joint).
 * Expéditeur : NEWSLETTER_FROM_EMAIL (comme le reste du lot 4).
 */

const SERIF = "'Playfair Display',Georgia,'Times New Roman',serif";
const SANS = 'Inter,Helvetica,Arial,sans-serif';
const MONO = "'SFMono-Regular',Menlo,Consolas,'Courier New',monospace";

function esc(v: string): string {
  return v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const from = () => process.env.NEWSLETTER_FROM_EMAIL?.trim() || null;

/** « 55 h » : bibliothèque arrondie à 5 h inférieures (même règle que l'accueil). */
async function libraryClaim(admin: SupabaseClient | null): Promise<number | null> {
  if (!admin) return null;
  try {
    const facts = await loadOfferFacts(admin as never);
    if (facts.libraryHours == null || facts.libraryHours < 10) return null;
    return Math.floor(facts.libraryHours / 5) * 5;
  } catch {
    return null;
  }
}

function codeBox(code: string, lang: GiftLang): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:26px 0 24px;"><tr>
<td align="center" bgcolor="#FFFAF5" style="background:#FFFAF5;border:1px dashed #E8B4A0;border-radius:6px;padding:18px 12px;">
<div style="font-family:${SANS};font-size:10px;font-weight:700;letter-spacing:2.4px;color:#8B8178;">${lang === 'es' ? 'TU CÓDIGO' : 'TON CODE'}</div>
<div style="margin-top:6px;font-family:${MONO};font-size:26px;font-weight:700;letter-spacing:5px;color:#2D2D2D;">${esc(code)}</div>
</td></tr></table>`;
}

function infoBox(html: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:26px 0 0;"><tr>
<td bgcolor="#FBF6EE" style="background:#FBF6EE;border-left:3px solid #C9A96E;border-radius:0 14px 14px 0;padding:14px 18px;font-family:${SANS};font-size:14px;line-height:22px;color:#4A443F;">${html}</td>
</tr></table>`;
}

function darkHero(row: Pick<GiftRow, 'months'>, lang: GiftLang): string {
  const base = getEmailPublicBaseUrl();
  const months = lang === 'es' ? `${row.months} ${row.months > 1 ? 'meses' : 'mes'}` : `${row.months} mois`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td align="center" bgcolor="#231F1B" style="background:#231F1B;border-radius:28px 28px 0 0;padding:34px 20px 32px;">
<img src="${base}/email/cadeau-photo.jpg" width="200" height="126" alt="" style="display:block;width:200px;height:126px;border:1px solid #C9A96E;border-radius:14px;">
<div style="margin-top:18px;font-family:${SANS};font-size:11px;font-weight:700;letter-spacing:3px;color:#E8C99A;">${lang === 'es' ? 'TARJETA REGALO' : 'CARTE CADEAU'}</div>
<div style="margin-top:6px;font-family:${SERIF};font-style:italic;font-weight:600;font-size:44px;line-height:48px;color:#FFFFFF;">${esc(months)}</div>
<div style="margin-top:4px;font-family:${SANS};font-size:13px;color:#CFC6BC;">${lang === 'es' ? 'de Pilates y Barre en visio con Alejandra' : 'de Pilates &amp; Barre en visio avec Alejandra'}</div>
</td></tr></table>`;
}

/** C03 — email de la destinataire (le jour J, ou tout de suite). */
export async function renderRecipientGiftEmail(row: GiftRow, admin: SupabaseClient | null): Promise<{ subject: string; html: string; preheader: string }> {
  const lang = giftLang(row);
  const es = lang === 'es';
  const months = es ? `${row.months} ${row.months > 1 ? 'meses' : 'mes'}` : `${row.months} mois`;
  const expires = longDateLabel(row.expires_at, lang, row.buyer_timezone || 'Europe/Paris');
  const hours = await libraryClaim(admin);
  const price = await visioMonthlyCents(stripeClient());
  const priceLabel = formatPriceShort(price.cents, price.currency, lang);
  const programmes = isProgrammesEnabled();
  const pitch = es
    ? `Con FitMangas, sigues clases de Pilates y Barre en visio. Durante los lives, Alejandra te ve y te corrige en directo.${
        programmes || hours ? ` También tienes ${[programmes ? 'programas guiados' : null, hours ? `más de ${hours} h de videos` : null].filter(Boolean).join(' y ')}, para hacer cuando quieras.` : ''
      }`
    : `Avec FitMangas, tu suis des cours de Pilates et de Barre en visio. Pendant les lives, Alejandra te voit et te corrige en direct.${
        programmes || hours ? ` Tu as aussi ${[programmes ? 'des programmes guidés' : null, hours ? `plus de ${hours} h de vidéos` : null].filter(Boolean).join(' et ')}, à faire quand tu veux.` : ''
      }`;
  const quote = row.message?.trim()
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0 26px;"><tr>
<td style="border-left:3px solid #C9A96E;padding:2px 0 2px 18px;">
<div style="font-family:${SERIF};font-style:italic;font-weight:600;font-size:19px;line-height:28px;color:#2D2D2D;">« ${esc(row.message.trim())} »</div>
<div style="margin-top:8px;font-family:${SANS};font-size:13px;color:#8B8178;">${esc(row.buyer_name)}</div>
</td></tr></table>`
    : '<div style="height:18px;"></div>';
  const inner = `${quote}
<p style="margin:0;">${esc(pitch)}</p>
${codeBox(row.code, lang)}
${outlookButton(es ? 'Activar mi regalo' : 'Activer mon cadeau', activationUrl(row.code))}
<p style="margin:16px 0 0;text-align:center;font-size:13px;line-height:20px;color:#8B8178;">${
    es ? `Sin tarjeta bancaria · a activar antes del ${esc(expires)}<br>Tu tarjeta para imprimir va adjunta en PDF.` : `Sans carte bancaire · à activer avant le ${esc(expires)}<br>Ta carte à imprimer est jointe en PDF.`
  }</p>
${infoBox(
  es
    ? `Al final de los ${esc(months)}, decides si continúas o no (${esc(priceLabel)}/mes, sin compromiso): la tarjeta no genera ningún cobro.`
    : `À la fin des ${esc(months)}, tu choisis de continuer ou non (${esc(priceLabel)}/mois, sans engagement) : la carte ne déclenche aucun prélèvement.`,
)}`;
  const subject = es ? `${row.buyer_name} te regala ${months} de Pilates y Barre` : `${row.buyer_name} t’offre ${months} de Pilates & Barre`;
  const preheader = es
    ? 'Un regalo te espera: clases en visio con Alejandra, para activar en 1 minuto.'
    : 'Un cadeau t’attend : des cours en visio avec Alejandra, à activer en 1 minute.';
  const html = wrapResendEmailV2({
    innerHtml: inner,
    locale: lang,
    heroHtml: darkHero(row, lang),
    kicker: es ? 'Un regalo para ti' : 'Un cadeau pour toi',
    headline: es ? `${row.recipient_name}, ${row.buyer_name} te regala ${months} de FitMangas` : `${row.recipient_name}, ${row.buyer_name} t’offre ${months} de FitMangas`,
    preheader,
    signOff: null,
    showPreferencesLink: false,
    footerNote: es
      ? `Recibes este email porque ${esc(row.buyer_name)} te regaló una tarjeta regalo FitMangas.`
      : `Tu reçois cet email car ${esc(row.buyer_name)} t’a offert une carte cadeau FitMangas.`,
  });
  return { subject, html, preheader };
}

/** Confirmation d'achat (acheteuse) : récapitulatif, code, PDF joint et lien de téléchargement. */
export function renderBuyerGiftEmail(row: GiftRow): { subject: string; html: string } {
  const lang = giftLang(row);
  const es = lang === 'es';
  const base = getEmailPublicBaseUrl();
  const tz = row.buyer_timezone || 'Europe/Paris';
  const months = es ? `${row.months} ${row.months > 1 ? 'meses' : 'mes'}` : `${row.months} mois`;
  const expires = longDateLabel(row.expires_at, lang, tz);
  const pdfUrl = row.stripe_checkout_session_id ? `${base}/api/gifts/pdf/${row.stripe_checkout_session_id}` : null;
  const when = row.send_at
    ? new Intl.DateTimeFormat(es ? 'es-MX' : 'fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: tz }).format(new Date(row.send_at))
    : null;
  const delivery =
    row.delivery === 'email' && row.recipient_email
      ? row.send_at && new Date(row.send_at).getTime() > Date.now() + 5 * 60_000
        ? es
          ? `${esc(row.recipient_name)} recibirá su email el <b>${esc(when ?? '')}</b> (${esc(tz.split('/').pop()?.replace('_', ' ') ?? '')}).`
          : `${esc(row.recipient_name)} recevra son email le <b>${esc(when ?? '')}</b> (heure de ${esc(tz.split('/').pop()?.replace('_', ' ') ?? '')}).`
        : row.recipient_email_sent_at
          ? es
            ? `${esc(row.recipient_name)} acaba de recibir su email.`
            : `${esc(row.recipient_name)} vient de recevoir son email.`
          : es
            ? `${esc(row.recipient_name)} recibirá su email en unos minutos.`
            : `${esc(row.recipient_name)} va recevoir son email dans quelques minutes.`
      : es
        ? 'Imprímela o envíala tú misma: el PDF va adjunto.'
        : 'Imprime-la ou envoie-la toi-même : le PDF est joint.';
  const inner = `<p style="margin:0 0 6px;">${
    es
      ? `Tu tarjeta de <b>${esc(months)}</b> para <b>${esc(row.recipient_name)}</b> está pagada.`
      : `Ta carte de <b>${esc(months)}</b> pour <b>${esc(row.recipient_name)}</b> est réglée.`
  }</p>
<p style="margin:0;">${delivery}</p>
${codeBox(row.code, lang)}
${pdfUrl ? outlookButton(es ? 'Descargar la tarjeta (PDF)' : 'Télécharger la carte (PDF)', pdfUrl) : ''}
<p style="margin:16px 0 0;text-align:center;font-size:13px;line-height:20px;color:#8B8178;">${
    es ? `Puede activarla hasta el ${esc(expires)}, sin tarjeta bancaria.` : `Elle peut l’activer jusqu’au ${esc(expires)}, sans carte bancaire.`
  }</p>
${infoBox(
  es
    ? '¿Cambiaste de opinión? Tienes 14 días para desistir: responde a este email. Reembolso total si la tarjeta no se ha activado, o de la parte no utilizada si ya se activó.'
    : 'Tu changes d’avis ? Tu as 14 jours pour te rétracter : réponds simplement à cet email. Remboursement intégral si la carte n’est pas activée, sinon de la part non utilisée.',
)}`;
  return {
    subject: es ? `Tu tarjeta regalo para ${row.recipient_name}` : `Ta carte cadeau pour ${row.recipient_name}`,
    html: wrapResendEmailV2({
      innerHtml: inner,
      locale: lang,
      heroHtml: darkHero(row, lang),
      kicker: es ? 'Tarjeta regalo' : 'Carte cadeau',
      headline: es ? 'Gracias, tu regalo está listo' : 'Merci, ton cadeau est prêt',
      signOff: es ? '¡Gracias por tu confianza!' : 'Merci pour ta confiance,',
      showPreferencesLink: false,
    }),
  };
}

async function pdfAttachment(row: GiftRow) {
  try {
    const buf = await renderGiftPdf(row);
    return [{ filename: giftLang(row) === 'es' ? 'tarjeta-regalo-fitmangas.pdf' : 'carte-cadeau-fitmangas.pdf', content: buf, contentType: 'application/pdf' }];
  } catch (e) {
    console.error('[gifts] pdf joint', e);
    return [];
  }
}

export async function sendRecipientGiftEmail(row: GiftRow, admin: SupabaseClient | null): Promise<boolean> {
  const sender = from();
  if (!sender || !row.recipient_email) return false;
  const { subject, html } = await renderRecipientGiftEmail(row, admin);
  const res = await sendEmail({ from: sender, to: row.recipient_email, subject, html, attachments: await pdfAttachment(row) });
  return res.ok;
}

export async function sendBuyerGiftEmail(row: GiftRow): Promise<boolean> {
  const sender = from();
  if (!sender || !row.buyer_email) return false;
  const { subject, html } = renderBuyerGiftEmail(row);
  const res = await sendEmail({ from: sender, to: row.buyer_email, replyTo: sender, subject, html, attachments: await pdfAttachment(row) });
  return res.ok;
}
