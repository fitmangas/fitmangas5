import { A_VALIDER_LOT2 } from '@/content/a-valider';
import { getEmailPublicBaseUrl, outlookButton, wrapResendEmailV2, type EmailLocale } from '@/lib/email/base-template';

export type V2EmailId = 'A01' | 'A02' | 'A03' | 'A04' | 'A05' | 'A06' | 'A07';

export type V2EmailVars = {
  firstName?: string;
  courseTitle?: string;
  courseTime?: string;
  courseDate?: string;
  joinUrl?: string;
  programUrl?: string;
  locale?: EmailLocale;
  omitProgramme?: boolean;
  digestLines?: string[];
  weekLives?: string[];
};

const base = () => getEmailPublicBaseUrl();

function hero(name: string) {
  return `${base()}/email/${name}`;
}

export function renderV2Email(id: V2EmailId, vars: V2EmailVars = {}): { subject: string; html: string; transactional: boolean } {
  const locale: EmailLocale = vars.locale === 'es' ? 'es' : 'fr';
  const name = vars.firstName?.trim() || (locale === 'es' ? 'tú' : 'toi');
  const title = vars.courseTitle || 'Pilates';
  const time = vars.courseTime || '18:30';
  const join = vars.joinUrl || `${base()}/compte/planning`;
  const hint = A_VALIDER_LOT2.liveJoinHint[locale];

  if (id === 'A01' || id === 'A02') {
    const loc: EmailLocale = id === 'A02' ? 'es' : locale;
    const subject = A_VALIDER_LOT2.liveEveSubject[loc](time, title);
    const kicker = loc === 'es' ? 'Tu live de mañana' : 'Ton live de demain';
    const headline = loc === 'es' ? `¿Nos vemos mañana, ${name}?` : `On se retrouve demain, ${name} ?`;
    const inner = `<p style="margin:0 0 20px;">${loc === 'es' ? 'Mañana Alejandra da su live. Te ve en pantalla y te corrige en directo.' : 'Demain, Alejandra donne son live. Elle te voit à l’écran et te corrige en direct.'}</p>
      ${outlookButton(loc === 'es' ? 'Unirme al live' : 'Rejoindre le live', join)}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:28px;"><tr>
        <td style="border-left:3px solid #C9A96E;background:#FBF6EE;border-radius:0 14px 14px 0;padding:14px 18px;font-size:14px;line-height:22px;color:#5F5750;"><b>${loc === 'es' ? 'Para preparar:' : 'À préparer :'}</b> ${A_VALIDER_LOT2.liveEvePreview[loc]} ${hint}</td>
      </tr></table>`;
    return {
      subject,
      transactional: true,
      html: wrapResendEmailV2({
        innerHtml: inner,
        locale: loc,
        heroUrl: hero('hero-veille.jpg'),
        kicker,
        headline,
        preheader: A_VALIDER_LOT2.liveEvePreview[loc],
        showPreferencesLink: true,
      }),
    };
  }

  if (id === 'A03') {
    const mins = 60;
    const subject = A_VALIDER_LOT2.liveOneHourSubject[locale](title);
    const inner = `<p style="margin:0 0 20px;">${hint}</p>${outlookButton(locale === 'es' ? 'Unirme' : 'Rejoindre', join)}`;
    return {
      subject,
      transactional: true,
      html: wrapResendEmailV2({
        innerHtml: inner,
        locale,
        heroUrl: hero('hero-1h.jpg'),
        kicker: locale === 'es' ? 'En 1 hora' : 'Dans 1 heure',
        headline: A_VALIDER_LOT2.liveOneHourSoonSubject[locale](mins, title),
        preheader: hint,
        showPreferencesLink: true,
      }),
    };
  }

  if (id === 'A07') {
    const session = vars.courseTitle || 'ta séance';
    const subject = locale === 'es' ? `Hoy: ${session}` : `Aujourd’hui : ${session}`;
    const programUrl = vars.programUrl || `${base()}/compte/programmes`;
    const postpone = `${programUrl}${programUrl.includes('?') ? '&' : '?'}decaler=1`;
    const inner = `<p style="margin:0 0 20px;">${locale === 'es' ? 'Tu sesión del día está lista. Alejandra te espera en el vídeo, y en el live de la semana.' : 'Ta séance du jour est prête. Alejandra t’attend dans la vidéo, et au live de la semaine.'}</p>
      ${outlookButton(locale === 'es' ? 'Empezar mi sesión' : 'Commencer ma séance', join)}
      <p style="margin:16px 0 0; text-align:center; font-size:13px; color:#8B8178;">${locale === 'es' ? '¿No es para hoy?' : 'Pas aujourd’hui ?'} <a href="${postpone}" style="color:#C45D3E; font-weight:700;">${locale === 'es' ? 'Pasarla a mañana' : 'Décaler à demain'}</a></p>`;
    return {
      subject,
      transactional: true,
      html: wrapResendEmailV2({
        innerHtml: inner,
        locale,
        kicker: locale === 'es' ? 'Tu sesión de hoy' : 'Ta séance du jour',
        headline: subject,
        showPreferencesLink: true,
      }),
    };
  }

  if (id === 'A05') {
    const subject = A_VALIDER_LOT2.liveCancelledSubject[locale](time);
    const inner = `<p style="margin:0 0 20px;">${locale === 'es' ? `El live de ${title} está cancelado.` : `Le live « ${title} » est annulé.`}</p>
      ${outlookButton(locale === 'es' ? 'Ver el planning' : 'Voir le planning', `${base()}/compte/planning`)}`;
    return {
      subject,
      transactional: true,
      html: wrapResendEmailV2({
        innerHtml: inner,
        locale,
        heroUrl: hero('hero-annule.jpg'),
        kicker: locale === 'es' ? 'Live cancelado' : 'Live annulé',
        headline: subject,
        showPreferencesLink: true,
      }),
    };
  }

  if (id === 'A04') {
    const lines = (vars.digestLines ?? ['Replay Pilates Mat', 'Nouvelle vidéo au tapis']).map((l) => `<li>${l}</li>`).join('');
    const inner = `<p style="margin:0 0 16px;">${locale === 'es' ? 'Lo nuevo de hoy :' : 'Les nouveautés du jour :'}</p><ul>${lines}</ul>
      ${outlookButton(locale === 'es' ? 'Ver mis vídeos' : 'Voir mes vidéos', `${base()}/compte/replays`)}`;
    return {
      subject: locale === 'es' ? 'Novedades del día' : 'Nouveautés du jour',
      transactional: false,
      html: wrapResendEmailV2({
        innerHtml: inner,
        locale,
        heroUrl: hero('hero-digest.jpg'),
        kicker: locale === 'es' ? 'Hoy' : 'Aujourd’hui',
        headline: locale === 'es' ? 'Novedades del día' : 'Nouveautés du jour',
        showPreferencesLink: true,
      }),
    };
  }

  const lives = (vars.weekLives ?? [`${title} · ${time}`]).map((l) => `<li>${l}</li>`).join('');
  const programme = vars.omitProgramme
    ? ''
    : `<p style="margin:16px 0 0;">${locale === 'es' ? 'Tu programa de la semana está listo.' : 'Ton programme de la semaine est prêt.'}</p>`;
  const inner = `<p style="margin:0 0 12px;">${locale === 'es' ? 'Tus lives de la semana :' : 'Tes lives de la semaine :'}</p><ul>${lives}</ul>${programme}
    ${outlookButton(locale === 'es' ? 'Ver mi semana' : 'Voir ma semaine', `${base()}/compte`)}`;
  return {
    subject: locale === 'es' ? 'Tu semana FitMangas' : 'Ta semaine FitMangas',
    transactional: false,
    html: wrapResendEmailV2({
      innerHtml: inner,
      locale,
      heroUrl: hero('hero-semaine.jpg'),
      kicker: locale === 'es' ? 'Domingo' : 'Dimanche',
      headline: locale === 'es' ? 'Tu semana' : 'Ta semaine',
      showPreferencesLink: true,
    }),
  };
}

export function v2TemplateForEvent(eventType: string, vars: V2EmailVars): { subject: string; html: string; transactional: boolean } | null {
  if (eventType === 'course.visio.reminder_J-1') return renderV2Email(vars.locale === 'es' ? 'A02' : 'A01', vars);
  if (eventType === 'course.visio.reminder_H-1') return renderV2Email('A03', vars);
  if (eventType === 'course.visio.cancelled' || eventType === 'course.visio.schedule_changed') return renderV2Email('A05', vars);
  if (eventType === 'digest.summary') return renderV2Email('A04', vars);
  if (eventType === 'digest.weekly') return renderV2Email('A06', vars);
  if (eventType === 'program.session.reminder') return renderV2Email('A07', vars);
  if (eventType === 'program.completed') {
    const cert = vars.joinUrl || `${base()}/compte/programmes`;
    const locale = vars.locale === 'es' ? 'es' : 'fr';
    const subject = locale === 'es' ? '¡Enhorabuena, programa terminado!' : 'Bravo, programme terminé !';
    return {
      subject,
      transactional: true,
      html: wrapResendEmailV2({
        innerHtml: `<p style="margin:0 0 20px;">${locale === 'es' ? 'Tu certificado está listo.' : 'Ton certificat est prêt.'}</p>${outlookButton(locale === 'es' ? 'Descargar el certificado' : 'Télécharger le certificat', cert)}`,
        locale,
        kicker: locale === 'es' ? 'Programa' : 'Programme',
        headline: subject,
        showPreferencesLink: false,
      }),
    };
  }
  return null;
}
