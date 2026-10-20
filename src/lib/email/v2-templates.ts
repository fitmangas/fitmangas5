import { getEmailPublicBaseUrl, wrapResendEmailV2, type EmailLocale } from '@/lib/email/base-template';

/**
 * Emails v2 (maquettes A01 à A07) : tables + styles en ligne, aucun SVG, aucune feuille de style externe.
 * Les données viennent du moteur de notifications (lot 2) ; chaque email reste lisible si une donnée manque
 * (le bloc correspondant est simplement omis).
 */

import { A_VALIDER_LOT3 } from '@/content/a-valider';

export type V2EmailId = 'A01' | 'A02' | 'A03' | 'A04' | 'A05' | 'A06' | 'A07';

export type V2Live = { id: string; title: string; startsAt: string; endsAt: string; language: 'fr' | 'es' };

export type V2ContentItem = {
  kind: 'replay' | 'video' | 'article';
  title: string;
  meta: string;
  imageUrl: string;
  url: string;
};

export type V2WeekLive = { startsAt: string; title: string; language: 'fr' | 'es'; note?: string | null };

export type V2Programme = {
  title: string;
  weekIndex: number;
  weekCount: number;
  percent: number;
  sessions: string[];
  finalTestThisWeek?: boolean;
};

export type V2Session = {
  programTitle: string;
  title: string;
  minutes: number;
  equipment?: string | null;
  weekIndex: number;
  weekTheme?: string | null;
  stepIndex: number;
  stepTotal: number;
  doneCount: number;
  tip?: string | null;
  scheduleLabel?: string | null;
  imageUrl?: string | null;
};

export type V2EmailVars = {
  firstName?: string;
  locale?: EmailLocale;
  /** Fuseau de la destinataire (heures affichées). */
  timeZone?: string;
  live?: V2Live | null;
  nextLive?: V2Live | null;
  /** A05 : changement d'horaire (sinon annulation). */
  changed?: boolean;
  previousStartsAt?: string | null;
  items?: V2ContentItem[];
  weekStart?: string | null;
  weekLives?: V2WeekLive[];
  programme?: V2Programme | null;
  session?: V2Session | null;
  programUrl?: string;
  joinUrl?: string;
  unsubscribeUrl?: string | null;
  omitProgramme?: boolean;
  /** Compatibilité avec les anciens appels. */
  courseTitle?: string;
  courseTime?: string;
};

const SANS = 'Inter,Helvetica,Arial,sans-serif';
const SERIF = "'Playfair Display',Georgia,'Times New Roman',serif";

const base = () => getEmailPublicBaseUrl();

function esc(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function hero(name: string) {
  return `${base()}/email/${name}`;
}

/** Vignette recadrée côté serveur (les clients mail ignorent object-fit). */
export function emailThumbUrl(src: string, w = 512, h = 300): string {
  return `${base()}/api/email/thumb?src=${encodeURIComponent(src)}&w=${w}&h=${h}`;
}

function defaultTz(locale: EmailLocale): string {
  return locale === 'es' ? 'America/Mexico_City' : 'Europe/Paris';
}

function tzLabel(tz: string, locale: EmailLocale): string {
  if (tz === 'Europe/Paris') return locale === 'es' ? 'hora de París' : 'heure de Paris';
  if (tz === 'America/Mexico_City') return locale === 'es' ? 'hora de Ciudad de México' : 'heure de Mexico';
  const city = tz.split('/').pop()?.replace(/_/g, ' ') ?? tz;
  return locale === 'es' ? `hora de ${city}` : `heure de ${city}`;
}

function fmt(iso: string, tz: string, locale: EmailLocale, opts: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(locale === 'es' ? 'es-MX' : 'fr-FR', { timeZone: tz, ...opts }).format(new Date(iso));
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function time(iso: string, tz: string, locale: EmailLocale): string {
  return fmt(iso, tz, locale, { hour: '2-digit', minute: '2-digit', hour12: false });
}

function minutesBetween(a: string, b: string): number {
  return Math.max(0, Math.round((Date.parse(b) - Date.parse(a)) / 60_000));
}

function stamp(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

// ——— Blocs (macros de la maquette) ———

export function emailButton(label: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
  <tr><td align="center" bgcolor="#C45D3E" style="border-radius:999px;background:#C45D3E;background-image:linear-gradient(135deg,#C45D3E 0%,#B35338 100%);">
    <a href="${esc(href)}" style="display:inline-block;padding:16px 34px;font-family:${SANS};font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#FFFFFF;text-decoration:none;border-radius:999px;">${esc(label)}</a>
  </td></tr>
</table>`;
}

function spacer(h: number): string {
  return `<div style="height:${h}px;line-height:${h}px;">&nbsp;</div>`;
}

function dateCard(dow: string, day: string, month: string, title: string, line1: string, line2?: string | null): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #EFE6DC;border-radius:18px;background:#FFFAF5;">
  <tr>
    <td width="92" valign="middle" style="padding:16px 0 16px 16px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="76"><tr><td align="center" bgcolor="#2D2D2D" style="border-radius:14px;background:#2D2D2D;padding:10px 0;">
        <div style="font-family:${SANS};font-size:10px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:#BDB4AB;">${esc(dow)}</div>
        <div style="font-family:${SANS};font-size:28px;font-weight:700;line-height:32px;color:#FFFFFF;">${esc(day)}</div>
        <div style="font-family:${SANS};font-size:10px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:#BDB4AB;">${esc(month)}</div>
      </td></tr></table>
    </td>
    <td valign="middle" style="padding:16px 18px 16px 14px;font-family:${SANS};">
      <div style="font-size:17px;font-weight:700;color:#2D2D2D;line-height:24px;">${esc(title)}</div>
      <div style="margin-top:4px;font-size:14px;color:#6F665E;line-height:21px;">${esc(line1)}</div>
      ${line2 ? `<div style="margin-top:2px;font-size:13px;color:#8B8178;line-height:20px;">${esc(line2)}</div>` : ''}
    </td>
  </tr>
</table>`;
}

function tip(html: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
  <td style="border-left:3px solid #C9A96E;background:#FBF6EE;border-radius:0 14px 14px 0;padding:14px 18px;font-family:${SANS};font-size:14px;line-height:22px;color:#5F5750;">${html}</td>
</tr></table>`;
}

function thumbRow(items: V2ContentItem[], locale: EmailLocale): string {
  const badge = (k: V2ContentItem['kind']) =>
    k === 'replay' ? 'Replay' : k === 'video' ? (locale === 'es' ? 'Nuevo video' : 'Nouvelle vidéo') : 'Blog';
  const rows: string[] = [];
  for (let i = 0; i < items.length; i += 2) {
    const pair = items.slice(i, i + 2);
    rows.push(
      `<tr>${pair
        .map(
          (it, idx) => `<td width="50%" valign="top" style="padding:${idx === 0 ? '0 8px 16px 0' : '0 0 16px 8px'};">
      <a href="${esc(it.url)}" style="text-decoration:none;">
        <img src="${esc(emailThumbUrl(it.imageUrl))}" width="256" height="150" alt="" style="display:block;width:100%;max-width:256px;height:auto;border-radius:14px;border:0;">
        <div style="margin-top:10px;font-family:${SANS};font-size:10px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:#C45D3E;">${esc(badge(it.kind))}</div>
        <div style="margin-top:4px;font-family:${SANS};font-size:15px;font-weight:700;line-height:21px;color:#2D2D2D;">${esc(it.title)}</div>
        <div style="margin-top:2px;font-family:${SANS};font-size:13px;line-height:19px;color:#8B8178;">${esc(it.meta)}</div>
      </a>
    </td>`,
        )
        .join('')}${pair.length === 1 ? '<td width="50%"></td>' : ''}</tr>`,
    );
  }
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows.join('')}</table>`;
}

function liveDateCard(live: V2Live, tz: string, locale: EmailLocale, withDuration: boolean, today = false): string {
  const dow = today
    ? locale === 'es'
      ? 'Hoy'
      : 'Auj.'
    : cap(fmt(live.startsAt, tz, locale, { weekday: 'short' }));
  const day = fmt(live.startsAt, tz, locale, { day: 'numeric' });
  const month = cap(fmt(live.startsAt, tz, locale, { month: 'short' }));
  const line1 = `${time(live.startsAt, tz, locale)} – ${time(live.endsAt, tz, locale)} · ${tzLabel(tz, locale)}`;
  const langLabel =
    live.language === 'es' ? (locale === 'es' ? 'en español' : 'en espagnol') : locale === 'es' ? 'en francés' : 'en français';
  const duration = minutesBetween(live.startsAt, live.endsAt);
  const line2 = `${locale === 'es' ? 'Con' : 'Avec'} Alejandra · ${langLabel}${withDuration && duration ? ` · ${duration} min` : ''}`;
  return dateCard(dow, day, month, live.title, line1, line2);
}

function calendarLinks(live: V2Live, locale: EmailLocale): string {
  const title = `${live.title} · FitMangas`;
  const join = `${base()}/live/${live.id}`;
  const google = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${stamp(live.startsAt)}/${stamp(live.endsAt)}&details=${encodeURIComponent(join)}`;
  const outlook = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(title)}&startdt=${encodeURIComponent(new Date(live.startsAt).toISOString())}&enddt=${encodeURIComponent(new Date(live.endsAt).toISOString())}&body=${encodeURIComponent(join)}`;
  const apple = `${base()}/api/calendar/live/${live.id}`;
  return `${emailButton(locale === 'es' ? 'Agregar a mi calendario' : 'Ajouter à mon agenda', google)}
<p style="margin:14px 0 0;text-align:center;font-size:13px;color:#8B8178;"><a href="${esc(google)}" style="color:#8B8178;">Google</a> · <a href="${esc(apple)}" style="color:#8B8178;">Apple</a> · <a href="${esc(outlook)}" style="color:#8B8178;">Outlook</a></p>`;
}

function signature(locale: EmailLocale, fr: string, es: string): string {
  return locale === 'es' ? es : fr;
}

// ——— Emails ———

export function renderV2Email(id: V2EmailId, vars: V2EmailVars = {}): { subject: string; html: string; transactional: boolean } {
  const locale: EmailLocale = id === 'A02' ? 'es' : vars.locale === 'es' ? 'es' : 'fr';
  const es = locale === 'es';
  const tz = vars.timeZone?.trim() || defaultTz(locale);
  const name = vars.firstName?.trim() || '';
  const live = vars.live ?? null;
  const join = vars.joinUrl || (live ? `${base()}/live/${live.id}` : `${base()}/compte/planning`);

  if (id === 'A01' || id === 'A02') {
    const title = live?.title ?? vars.courseTitle ?? 'Pilates';
    const t = live ? time(live.startsAt, tz, locale) : vars.courseTime ?? '';
    const subject = es ? `Mañana ${t}: ${title} con Alejandra` : `Demain ${t} : ${title} avec Alejandra`;
    const preheader = es
      ? 'Tu tapete, una botella de agua y listo. El enlace estará abierto: conéctate 10 min antes.'
      : 'Ton tapis, une bouteille d’eau, et c’est parti. Le lien sera ouvert : connecte-toi 10 min avant.';
    const inner = `<p style="margin:0 0 20px;">${
      es
        ? 'Mañana Alejandra da su clase en vivo. Te ve en la pantalla y te corrige en directo: deja tu cámara encendida si quieres sus consejos.'
        : 'Demain, Alejandra donne son live. Elle te voit à l’écran et te corrige en direct : garde ta caméra allumée si tu veux ses conseils.'
    }</p>
${live ? liveDateCard(live, tz, locale, true) : ''}
${spacer(26)}
${live ? calendarLinks(live, locale) : emailButton(es ? 'Ver el calendario' : 'Voir le planning', `${base()}/compte/planning`)}
${spacer(28)}
${tip(
  es
    ? '<b style="color:#2D2D2D;">Prepara:</b> tu tapete, una botella de agua y un cojín. El enlace ya estará abierto: conéctate 10 minutos antes.'
    : '<b style="color:#2D2D2D;">À préparer :</b> ton tapis, une bouteille d’eau et un coussin. Le lien sera déjà ouvert : connecte-toi 10 minutes avant.',
)}`;
    return {
      subject,
      transactional: true,
      html: wrapResendEmailV2({
        innerHtml: inner,
        locale,
        heroUrl: hero(locale === 'es' ? 'hero-veille-es.jpg' : 'hero-veille.jpg'),
        heroAlt: es ? 'Alejandra en vivo' : 'Alejandra en live',
        kicker: es ? 'Tu clase en vivo de mañana' : 'Ton live de demain',
        headline: name ? (es ? `¿Nos vemos mañana, ${name}?` : `On se retrouve demain, ${name} ?`) : es ? '¿Nos vemos mañana?' : 'On se retrouve demain ?',
        preheader,
        signOff: signature(locale, 'À demain,', '¡Hasta mañana!'),
        footerNote: es
          ? 'Recibes este recordatorio porque estás suscrita a FitMangas: cada clase en vivo del calendario cuenta para ti, sin inscripción.'
          : 'Tu reçois ce rappel car tu es abonnée à FitMangas : chaque live du planning compte pour toi, sans inscription.',
      }),
    };
  }

  if (id === 'A03') {
    const title = live?.title ?? vars.courseTitle ?? 'Pilates';
    const t = live ? time(live.startsAt, tz, locale) : vars.courseTime ?? '';
    const mins = live ? Math.round((Date.parse(live.startsAt) - Date.now()) / 60_000) : 60;
    const soon = mins > 0 && mins < 50;
    const subject = soon
      ? es
        ? `En ${mins} min: ${title}`
        : `Dans ${mins} min : ${title}`
      : es
        ? `En 1 hora: ${title}`
        : `Dans 1 heure : ${title}`;
    const inner = `<p style="margin:0 0 22px;">${
      es
        ? `Instálate con calma: el enlace ya está abierto. Conéctate <b style="color:#2D2D2D;">10 minutos antes</b> para colocar tu tapete y tu cámara; Alejandra empieza a las ${esc(t)}.`
        : `Installe-toi tranquillement : le lien est déjà ouvert. Connecte-toi <b style="color:#2D2D2D;">10 minutes avant</b> pour placer ton tapis et ta caméra, Alejandra commence à ${esc(t)}.`
    }</p>
${live ? liveDateCard(live, tz, locale, false, true) : ''}
${spacer(28)}
${emailButton(es ? 'Unirme a la clase' : 'Rejoindre le live', join)}
<p style="margin:14px 0 0;text-align:center;font-size:13px;line-height:20px;color:#8B8178;">${
      es ? 'El botón abre directamente la videollamada. Tu micrófono está apagado al entrar.' : 'Le bouton ouvre directement la visio. Ton micro est coupé à l’entrée.'
    }</p>
${spacer(26)}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
  ${(es ? ['Wi-Fi estable', 'Cámara de frente, de cuerpo entero', 'Agua a la mano'] : ['Wi-Fi stable', 'Caméra de face, en pied', 'Eau à portée de main'])
    .map(
      (label) => `<td width="33%" align="center" valign="top" style="padding:0 4px;font-family:${SANS};font-size:13px;line-height:19px;color:#5F5750;">
    <div style="width:10px;height:10px;margin:0 auto 10px;border-radius:50%;background:#C45D3E;"></div>${esc(label)}
  </td>`,
    )
    .join('')}
</tr></table>`;
    return {
      subject,
      transactional: true,
      html: wrapResendEmailV2({
        innerHtml: inner,
        locale,
        kicker: soon ? (es ? `En ${mins} minutos` : `Dans ${mins} minutes`) : es ? 'En 1 hora' : 'Dans 1 heure',
        headline: es ? `Empezamos a las ${t}` : `On commence à ${t}`,
        preheader: es
          ? `El enlace ya está abierto. Prepara tu tapete, empezamos a las ${t}.`
          : `Le lien est déjà ouvert. Installe ton tapis, on commence à ${t}.`,
        signOff: null,
        footerNote: es ? 'Recordatorio enviado 1 hora antes de cada clase del calendario.' : 'Rappel envoyé 1 heure avant chaque live du planning.',
      }),
    };
  }

  if (id === 'A05') {
    const changed = Boolean(vars.changed);
    const title = live?.title ?? vars.courseTitle ?? 'Pilates';
    const when = live
      ? `${cap(fmt(vars.previousStartsAt ?? live.startsAt, tz, locale, { weekday: 'short', day: 'numeric', month: 'short' }))} · ${time(vars.previousStartsAt ?? live.startsAt, tz, locale)}`
      : '';
    const hoursBefore = live ? (Date.parse(vars.previousStartsAt ?? live.startsAt) - Date.now()) / 3_600_000 : 99;
    const lastMinute = hoursBefore < 24;
    const subject = changed
      ? es
        ? `Cambio de horario: ${title}`
        : `Changement d’horaire : ${title}`
      : es
        ? `La clase en vivo ${when ? `del ${when} ` : ''}está cancelada`
        : `Le live ${when ? `du ${when} ` : ''}est annulé`;
    const intro = changed
      ? es
        ? 'El horario de tu clase cambió. Aquí está el nuevo:'
        : 'L’horaire de ton live a changé. Voici le nouveau :'
      : es
        ? `Alejandra no podrá dar esta clase en vivo.${lastMinute ? ' Perdón por el cambio de último momento.' : ''}`
        : `Alejandra ne pourra pas assurer ce live.${lastMinute ? ' Désolée pour ce changement de dernière minute.' : ''}`;
    const struck = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px dashed #E3C8BC;border-radius:18px;background:#FFFFFF;"><tr>
  <td style="padding:16px 18px;font-family:${SANS};">
    <div style="font-size:11px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:#B35338;">${changed ? (es ? 'Antes' : 'Avant') : es ? 'Cancelada' : 'Annulé'}</div>
    <div style="margin-top:4px;font-size:16px;font-weight:700;color:#8B8178;text-decoration:line-through;">${esc(title)}${when ? ` · ${esc(when)}` : ''}</div>
  </td>
</tr></table>`;
    const next = changed ? live : vars.nextLive ?? null;
    const inner = `<p style="margin:0 0 20px;">${intro}</p>
${struck}
${next ? `${spacer(22)}<p style="margin:0 0 14px;font-size:15px;font-weight:700;color:#2D2D2D;">${changed ? (es ? 'Nuevo horario:' : 'Nouvel horaire :') : es ? 'La próxima clase:' : 'Le prochain live :'}</p>${liveDateCard(next, tz, locale, false)}` : ''}
${spacer(26)}
${emailButton(es ? 'Ver el calendario' : 'Voir le planning', `${base()}/compte/planning`)}
${spacer(24)}
${tip(
  es
    ? `Mientras tanto, ¿te apetece una sesión de la videoteca? <a href="${esc(`${base()}/compte/replays`)}" style="color:#C45D3E;font-weight:700;">Ver los videos</a>.`
    : `En attendant, une séance de la vidéothèque te tente ? <a href="${esc(`${base()}/compte/replays`)}" style="color:#C45D3E;font-weight:700;">Voir les vidéos</a>.`,
)}`;
    return {
      subject,
      transactional: true,
      html: wrapResendEmailV2({
        innerHtml: inner,
        locale,
        kicker: es ? 'Cambio en el calendario' : 'Changement de planning',
        headline: changed ? (es ? 'Tu clase cambia de horario' : 'Ton live change d’horaire') : es ? 'La clase está cancelada' : 'Le live est annulé',
        preheader: next
          ? es
            ? `La próxima clase: ${cap(fmt(next.startsAt, tz, locale, { weekday: 'long' }))} a las ${time(next.startsAt, tz, locale)}.`
            : `Le prochain live : ${fmt(next.startsAt, tz, locale, { weekday: 'long' })} à ${time(next.startsAt, tz, locale)}.`
          : intro,
        signOff: signature(locale, 'À très vite,', '¡Hasta pronto!'),
        showPreferencesLink: false,
        footerNote: es ? 'Las cancelaciones siempre se envían, incluso en modo silencio.' : 'Les annulations sont toujours envoyées, même en mode silence.',
      }),
    };
  }

  if (id === 'A04') {
    const items = vars.items ?? [];
    const replays = items.filter((i) => i.kind === 'replay').length;
    const videos = items.filter((i) => i.kind === 'video').length;
    const parts: string[] = [];
    if (replays) parts.push(es ? `${replays} repetición${replays > 1 ? 'es' : ''}` : `${replays} replay${replays > 1 ? 's' : ''}`);
    if (videos) parts.push(es ? `${videos} video${videos > 1 ? 's' : ''} nuevo${videos > 1 ? 's' : ''}` : `${videos} nouvelle${videos > 1 ? 's' : ''} vidéo${videos > 1 ? 's' : ''}`);
    const articles = items.filter((i) => i.kind === 'article').length;
    if (articles) parts.push(es ? `${articles} artículo${articles > 1 ? 's' : ''}` : `${articles} article${articles > 1 ? 's' : ''}`);
    const summary = parts.join(es ? ' y ' : ' et ') || (es ? 'Novedades' : 'Des nouveautés');
    const subject = es ? `${summary} te esperan` : `${summary} t’attend${items.length > 1 ? 'ent' : ''}`;
    const inner = `<p style="margin:0 0 24px;">${
      es
        ? '¿Te perdiste una clase o quieres repetirla? Las repeticiones están listas. Un solo email al día, con todo lo nuevo.'
        : 'Raté un live, ou envie de le refaire ? Les replays sont prêts. Un seul email par jour, avec tout ce qui est nouveau.'
    }</p>
${items.length ? thumbRow(items.slice(0, 4), locale) : ''}
${spacer(8)}
${emailButton(es ? 'Ver mis videos' : 'Voir mes vidéos', `${base()}/compte/replays`)}`;
    return {
      subject,
      transactional: false,
      html: wrapResendEmailV2({
        innerHtml: inner,
        locale,
        kicker: es ? 'Nuevo en tu videoteca' : 'Nouveau dans ta bibliothèque',
        headline: es ? 'Tus novedades del día' : 'Tes nouveautés du jour',
        preheader: es ? '¿Te perdiste una clase? La repetición está aquí, cuando quieras.' : 'Raté un live ? Le replay est là, à suivre quand tu veux.',
        signOff: null,
        unsubscribeUrl: vars.unsubscribeUrl ?? null,
        footerNote: es
          ? 'Recibes este resumen porque las « novedades en video » están activadas en tus preferencias (1 email al día como máximo).'
          : 'Tu reçois ce récapitulatif car les « nouveautés vidéo » sont activées dans tes préférences (1 email par jour maximum).',
      }),
    };
  }

  if (id === 'A07') {
    const s = vars.session;
    const sessionTitle = s?.title ?? vars.courseTitle ?? (es ? 'tu sesión' : 'ta séance');
    const subject = es ? `Tu sesión del día: ${sessionTitle}${s ? ` (${s.minutes} min)` : ''}` : `Ta séance du jour : ${sessionTitle}${s ? ` (${s.minutes} min)` : ''}`;
    const programUrl = vars.programUrl || `${base()}/compte/programmes`;
    const startUrl = vars.joinUrl || programUrl;
    const postpone = `${programUrl}${programUrl.includes('?') ? '&' : '?'}decaler=1`;
    const pct = s && s.stepTotal ? Math.round((s.doneCount / s.stepTotal) * 100) : 0;
    const inner = `<p style="margin:0 0 6px;font-size:19px;font-weight:700;line-height:26px;color:#2D2D2D;">${esc(sessionTitle)}</p>
${s ? `<p style="margin:0 0 22px;font-size:14px;color:#8B8178;">${s.minutes} min${s.equipment ? ` · ${esc(s.equipment)}` : ''}${s.weekTheme ? ` · ${es ? 'semana' : 'semaine'} ${s.weekIndex} : <i>${esc(s.weekTheme)}</i>` : ''}</p>` : ''}
${s?.tip ? `${tip(`<b style="color:#2D2D2D;">${es ? 'La consigna de la semana:' : 'La consigne de la semaine :'}</b> ${esc(s.tip)}`)}${spacer(26)}` : ''}
${emailButton(es ? 'Empezar la sesión' : 'Commencer la séance', startUrl)}
<p style="margin:16px 0 0;text-align:center;font-size:13px;color:#8B8178;">${es ? '¿Hoy no?' : 'Pas aujourd’hui ?'} <a href="${esc(postpone)}" style="color:#C45D3E;font-weight:700;">${es ? 'Pasarla a mañana' : 'Décaler à demain'}</a></p>
${
  s
    ? `${spacer(26)}<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
  <td style="font-family:${SANS};font-size:13px;color:#8B8178;">${es ? 'Tu progreso' : 'Ta progression'}</td>
  <td align="right" style="font-family:${SANS};font-size:13px;font-weight:700;color:#C45D3E;">${s.doneCount} / ${s.stepTotal} ${es ? 'sesiones' : 'séances'}</td>
</tr><tr><td colspan="2" style="padding-top:8px;"><div style="height:8px;border-radius:99px;background:#F1EAE1;"><div style="width:${pct}%;height:8px;border-radius:99px;background:#C45D3E;"></div></div></td></tr></table>`
    : ''
}`;
    return {
      subject,
      transactional: true,
      html: wrapResendEmailV2({
        innerHtml: inner,
        locale,
        heroUrl: hero('hero-seance.jpg'),
        heroHref: startUrl,
        heroAlt: es ? 'Empezar la sesión' : 'Lancer la séance',
        kicker: s ? `${s.programTitle} · ${es ? 'sesión' : 'séance'} ${s.stepIndex} ${es ? 'de' : 'sur'} ${s.stepTotal}` : es ? 'Tu sesión de hoy' : 'Ta séance du jour',
        headline: es ? 'Tu sesión del día te espera' : 'Ta séance du jour t’attend',
        preheader: s
          ? es
            ? `${s.minutes} minutos, un tapete, eso es todo.`
            : `${s.minutes} minutes, un tapis, c’est tout.`
          : undefined,
        signOff: null,
        footerNote: s?.scheduleLabel
          ? `${esc(s.scheduleLabel)} <a href="${esc(`${base()}/compte/preferences`)}" style="color:#8B8178;">${es ? 'Modificar' : 'Modifier'}</a>`
          : null,
      }),
    };
  }

  // A06 — « Ta semaine »
  const weekLives = vars.weekLives ?? [];
  const items = vars.items ?? [];
  const programme = vars.omitProgramme ? null : vars.programme ?? null;
  const weekStartIso = vars.weekStart ?? weekLives[0]?.startsAt ?? new Date().toISOString();
  const weekEnd = new Date(Date.parse(weekStartIso) + 6 * 86_400_000).toISOString();
  const range = `${fmt(weekStartIso, tz, locale, { day: 'numeric' })} – ${fmt(weekEnd, tz, locale, { day: 'numeric', month: 'short' })}`;
  const subjectParts: string[] = [];
  if (weekLives.length) subjectParts.push(es ? `${weekLives.length} clase${weekLives.length > 1 ? 's' : ''} en vivo` : `${weekLives.length} live${weekLives.length > 1 ? 's' : ''}`);
  if (programme) subjectParts.push(es ? 'tu programa' : 'ton programme');
  if (items.length) subjectParts.push(es ? `${items.length} novedad${items.length > 1 ? 'es' : ''}` : `${items.length} nouveauté${items.length > 1 ? 's' : ''}`);
  const subject = es
    ? `Tu semana${subjectParts.length ? `: ${subjectParts.join(', ')}` : ''}`
    : `Ta semaine${subjectParts.length ? ` : ${subjectParts.join(', ')}` : ''}`;

  const programmeBlock = programme
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-radius:18px;background:#2A2420;background-image:linear-gradient(135deg,#2A2420 0%,#1D1A17 100%);"><tr>
  <td style="padding:20px 22px;font-family:${SANS};">
    <div style="font-size:11px;font-weight:700;letter-spacing:1.8px;text-transform:uppercase;color:#F3C58E;">${es ? 'Tu programa' : 'Ton programme'} · ${es ? 'semana' : 'semaine'} ${programme.weekIndex} ${es ? 'de' : 'sur'} ${programme.weekCount}</div>
    <div style="margin-top:6px;font-family:${SERIF};font-style:italic;font-size:24px;line-height:30px;color:#FFFFFF;">${esc(programme.title)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:14px;"><tr>
      <td style="height:8px;border-radius:99px;background:rgba(255,255,255,0.16);"><div style="width:${Math.min(100, Math.max(0, programme.percent))}%;height:8px;border-radius:99px;background:#E8967A;"></div></td>
      <td width="56" align="right" style="font-size:13px;font-weight:700;color:#FFFFFF;">${programme.percent} %</td>
    </tr></table>
    ${programme.sessions.length ? `<div style="margin-top:14px;font-size:14px;line-height:22px;color:rgba(255,255,255,0.78);">${programme.sessions.map(esc).join('<br>')}${programme.finalTestThisWeek ? ` <b style="color:#F3C58E;">${es ? '+ tu test final' : '+ ton test d’arrivée'}</b>` : ''}</div>` : ''}
  </td>
</tr></table>${spacer(30)}`
    : '';

  const livesBlock = weekLives.length
    ? `<div style="font-size:11px;font-weight:700;letter-spacing:2.2px;text-transform:uppercase;color:#A39A92;">${es ? 'Tus clases en vivo de la semana' : 'Tes lives de la semaine'}</div>
${spacer(12)}
${weekLives
  .map((l) => {
    const dow = cap(fmt(l.startsAt, tz, locale, { weekday: 'short' }));
    const day = fmt(l.startsAt, tz, locale, { day: 'numeric' });
    const langLine =
      l.language === 'es' ? (locale === 'es' ? 'en español' : 'bonus en espagnol') : locale === 'es' ? 'bonus en francés' : 'en français';
    const line = `${time(l.startsAt, tz, locale)} · ${langLine}${l.note ? ` · ${l.note}` : ''}`;
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:10px;"><tr>
  <td width="58" valign="middle"><div style="width:48px;border-radius:12px;background:#FBF1EC;text-align:center;padding:6px 0;font-family:${SANS};"><div style="font-size:9px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#B35338;">${esc(dow)}</div><div style="font-size:19px;font-weight:700;color:#2D2D2D;line-height:22px;">${esc(day)}</div></div></td>
  <td valign="middle" style="font-family:${SANS};border-bottom:1px solid #F1EAE1;padding:6px 0 12px;"><div style="font-size:15px;font-weight:700;color:#2D2D2D;">${esc(l.title)}</div><div style="font-size:13px;color:#8B8178;">${esc(line)}</div></td>
</tr></table>`;
  })
  .join('')}
<p style="margin:6px 0 0;font-size:13px;color:#8B8178;">${es ? 'Recibirás un recordatorio la víspera y 1 hora antes de cada clase.' : 'Tu recevras un rappel la veille et 1 heure avant chaque live.'}</p>${spacer(30)}`
    : `<p style="margin:0 0 24px;font-size:14px;color:#8B8178;">${es ? 'El calendario de la semana se publica pronto: recibirás un recordatorio la víspera de cada clase.' : 'Le planning de la semaine arrive bientôt : tu recevras un rappel la veille de chaque live.'}</p>`;

  const newBlock = items.length
    ? `<div style="font-size:11px;font-weight:700;letter-spacing:2.2px;text-transform:uppercase;color:#A39A92;">${es ? 'Nuevo esta semana' : 'Nouveau cette semaine'}</div>${spacer(14)}${thumbRow(items.slice(0, 2), locale)}`
    : '';

  const inner = `<p style="margin:0 0 24px;">${
    name
      ? es
        ? `Hola ${esc(name)}, esto es lo que te espera. Un solo email el domingo, y tienes toda tu semana.`
        : `Bonjour ${esc(name)}, voici ce qui t’attend. Un seul email le dimanche soir, et tu as toute ta semaine.`
      : es
        ? 'Esto es lo que te espera. Un solo email el domingo, y tienes toda tu semana.'
        : 'Voici ce qui t’attend. Un seul email le dimanche soir, et tu as toute ta semaine.'
  }</p>
${programmeBlock}${livesBlock}${newBlock}
${emailButton(es ? 'Abrir mi espacio' : 'Ouvrir mon espace', `${base()}/compte`)}`;
  return {
    subject,
    transactional: false,
    html: wrapResendEmailV2({
      innerHtml: inner,
      locale,
      heroUrl: hero('hero-semaine.jpg'),
      heroHeight: 250,
      kicker: `${es ? 'Tu semana FitMangas' : 'Ta semaine FitMangas'} · ${range}`,
      headline: es ? 'Tu plan para la semana' : 'Ton plan pour la semaine',
      preheader: programme
        ? es
          ? `Tu programa avanza (${programme.percent} %). Aquí está el plan de la semana.`
          : `Ton programme avance (${programme.percent} %). Voici le plan de la semaine.`
        : es
          ? 'Aquí está el plan de tu semana.'
          : 'Voici le plan de ta semaine.',
      signOff: null,
      unsubscribeUrl: vars.unsubscribeUrl ?? null,
      footerNote: es
        ? '« Tu semana » llega el domingo a las 18:00 (tu hora). Puedes desactivarlo en tus preferencias.'
        : '« Ta semaine » arrive le dimanche à 18:00 (ton heure). Tu peux le désactiver dans tes préférences.',
    }),
  };
}

export function v2TemplateForEvent(
  eventType: string,
  vars: V2EmailVars,
): { subject: string; html: string; transactional: boolean } | null {
  if (eventType === 'course.visio.reminder_J-1') return renderV2Email(vars.locale === 'es' ? 'A02' : 'A01', vars);
  if (eventType === 'course.visio.reminder_H-1') return renderV2Email('A03', vars);
  if (eventType === 'course.visio.cancelled') return renderV2Email('A05', { ...vars, changed: false });
  if (eventType === 'course.visio.schedule_changed') return renderV2Email('A05', { ...vars, changed: true });
  if (eventType === 'digest.summary') return renderV2Email('A04', vars);
  if (eventType === 'digest.weekly') return renderV2Email('A06', vars);
  if (eventType === 'program.session.reminder' || eventType === 'program.session') return renderV2Email('A07', vars);
  if (eventType === 'program.nudge') {
    const locale: EmailLocale = vars.locale === 'es' ? 'es' : 'fr';
    const es = locale === 'es';
    const n = A_VALIDER_LOT3.nudge;
    const s = vars.session;
    const url = vars.joinUrl || vars.programUrl || `${base()}/compte/programmes`;
    const sessionBlock = s
      ? `<p style="margin:0 0 4px;font-size:17px;font-weight:700;line-height:24px;color:#2D2D2D;">${esc(s.title)}</p>
<p style="margin:0 0 22px;font-size:14px;color:#8B8178;">${s.minutes} min · ${esc(s.programTitle)} · ${es ? 'sesión' : 'séance'} ${s.stepIndex} ${es ? 'de' : 'sur'} ${s.stepTotal}</p>`
      : '';
    return {
      subject: n.subject[locale],
      transactional: false,
      html: wrapResendEmailV2({
        innerHtml: `<p style="margin:0 0 20px;">${esc(n.body[locale])}</p>${sessionBlock}${emailButton(n.button[locale], url)}<p style="margin:18px 0 0;font-size:13px;color:#8B8178;">${esc(n.pause[locale])}</p>`,
        locale,
        kicker: s ? s.programTitle : es ? 'Tu programa' : 'Ton programme',
        headline: n.headline[locale],
        preheader: n.inApp[locale],
        signOff: signature(locale, 'À très vite,', '¡Hasta muy pronto!'),
        unsubscribeUrl: vars.unsubscribeUrl ?? null,
      }),
    };
  }
  if (eventType === 'program.completed') {
    const cert = vars.joinUrl || `${base()}/compte/programmes`;
    const locale: EmailLocale = vars.locale === 'es' ? 'es' : 'fr';
    const es = locale === 'es';
    const subject = es ? '¡Enhorabuena, terminaste tu programa!' : 'Bravo, tu as terminé ton programme !';
    return {
      subject,
      transactional: true,
      html: wrapResendEmailV2({
        innerHtml: `<p style="margin:0 0 20px;">${es ? 'Tu certificado está listo. Descárgalo y compártelo si quieres: lo has merecido.' : 'Ton certificat est prêt. Télécharge-le et partage-le si tu veux : tu l’as bien mérité.'}</p>${emailButton(es ? 'Descargar mi certificado' : 'Télécharger mon certificat', cert)}`,
        locale,
        kicker: es ? 'Programa terminado' : 'Programme terminé',
        headline: subject,
        signOff: signature(locale, 'Je suis fière de toi,', '¡Estoy orgullosa de ti!'),
        showPreferencesLink: false,
      }),
    };
  }
  return null;
}

/** Données fictives pour l'aperçu admin et les aperçus de développement. */
export function demoV2Vars(id: V2EmailId, locale: EmailLocale): V2EmailVars {
  const now = Date.now();
  const at = (days: number, h: number, m = 0) => {
    const d = new Date(now + days * 86_400_000);
    d.setUTCHours(h, m, 0, 0);
    return d.toISOString();
  };
  const live: V2Live =
    locale === 'es'
      ? { id: '00000000-0000-4000-8000-000000000001', title: 'Pilates Mat', startsAt: at(1, 15), endsAt: at(1, 15, 55), language: 'es' }
      : { id: '00000000-0000-4000-8000-000000000002', title: 'Barre/Pilates Flow', startsAt: at(1, 16, 30), endsAt: at(1, 17, 25), language: 'fr' };
  const soon: V2Live = { ...live, startsAt: new Date(now + 60 * 60_000).toISOString(), endsAt: new Date(now + 115 * 60_000).toISOString() };
  const items: V2ContentItem[] = [
    { kind: 'replay', title: 'Barre/Pilates Flow', meta: locale === 'es' ? 'Repetición de la clase del martes · 54 min' : 'Replay du live de mardi · 54 min', imageUrl: `${base()}/email/hero-digest.jpg`, url: `${base()}/compte/replays` },
    { kind: 'video', title: 'Pilates Mat avec Rouleau', meta: locale === 'es' ? 'Videoteca · 56 min · avanzado' : 'Vidéothèque · 56 min · niveau avancé', imageUrl: `${base()}/programmes/pm-rouleau.jpg`, url: `${base()}/compte/replays` },
  ];
  return {
    locale,
    firstName: 'Margaux',
    live: id === 'A03' ? soon : live,
    nextLive: { ...live, startsAt: at(3, 8, 30), endsAt: at(3, 9, 25) },
    items,
    weekLives: [
      { startsAt: at(2, 17), title: 'Pilates Mat', language: 'fr' },
      { startsAt: at(4, 16, 30), title: 'Barre/Pilates Flow', language: 'fr' },
      { startsAt: at(6, 8, 30), title: 'Barre/Pilates Flow', language: 'fr', note: locale === 'es' ? null : 'recommandé pour ton programme' },
      { startsAt: at(7, 23), title: 'Pilates en español', language: 'es' },
    ],
    programme: {
      title: 'Les Fondations du Pilates',
      weekIndex: 3,
      weekCount: 3,
      percent: 67,
      sessions: ['Lun. · Ta première séance complète (32 min)', 'Mer. · Le petit ballon pour les muscles profonds (37 min)', 'Ven. · Ouvrir la cage thoracique (39 min)'],
      finalTestThisWeek: true,
    },
    session: {
      programTitle: 'Les Fondations du Pilates',
      title: 'Les bases au sol, partie 2',
      minutes: 31,
      equipment: 'Tapis',
      weekIndex: 2,
      weekTheme: 'Stabiliser',
      stepIndex: 5,
      stepTotal: 9,
      doneCount: 4,
      tip: 'omoplates basses, loin des oreilles. Le mouvement part du centre, pas des bras.',
      scheduleLabel: 'Rappel envoyé les lundis, mercredis et vendredis à 18:00, comme tu l’as choisi.',
      imageUrl: `${base()}/programmes/alejandra-tapis.jpg`,
    },
    unsubscribeUrl: `${base()}/api/notifications/unsubscribe?token=apercu`,
  };
}
