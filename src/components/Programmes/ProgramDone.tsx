'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Award, CalendarDays, Check, CircleCheck, Clock, Download, Instagram, Minus, Send, Star, TrendingUp } from 'lucide-react';

import { ProgramLevelPill } from './program-ui';
import { TestsModal } from './ProgramDetailViews';
import { recordProgramFeedbackAction, restartProgramAction, withdrawFeedbackConsentAction } from '@/app/compte/programmes/actions';
import { periodLabel, statsLine, type CompletionData, type CompletionTest } from '@/lib/programmes/completion-format';
import { hoursMinutesLabel, shortDateLabel } from '@/lib/programmes/engine';

type Lang = 'fr' | 'es';

export type ProgramDoneProps = {
  data: CompletionData;
  next: { slug: string; title: string; promise: string; level: number; coverUrl: string } | null;
  alternative: { slug: string; title: string } | null;
  certificateUrl: string;
  storyUrl: string;
  preview?: boolean;
};

const C = {
  fr: {
    kicker: (t: string) => `Programme terminé · ${t}`,
    bravo: (n: string | null) => (n ? `Bravo ${n} !` : 'Bravo !'),
    sub: (t: string, d: number) => `Tu as terminé ${t} en ${d} jour${d > 1 ? 's' : ''}. Ton corps a appris quelque chose de durable : garde-le.`,
    sessions: 'séances',
    training: 'd’entraînement',
    days: 'jours',
    progressKicker: 'Tes progrès',
    progressTitle: 'Le chemin parcouru, noir sur blanc',
    testDates: (a: string, b: string) => `Départ : test du ${a} · Arrivée : test du ${b}`,
    endTestCta: 'Faire mon test d’arrivée (2 min)',
    endTestText: 'Refais les mêmes tests qu’au départ : tu verras ici le chemin parcouru.',
    noStartTest: 'Pas de test de départ pour ce programme. Au prochain, fais-le dès le début pour mesurer tes progrès.',
    stable: 'Stable',
    level: (n: number) => `${n > 0 ? '+' : ''}${n} niveau${Math.abs(n) > 1 ? 'x' : ''}`,
    reps: (n: number) => `${n > 0 ? '+' : ''}${n}`,
    secs: (n: number) => `${n > 0 ? '+' : ''}${n} s`,
    wordTitle: 'Un mot pour Alejandra ?',
    wordSub: (w: number) => `Qu’est-ce qui a changé pour toi en ${w} semaine${w > 1 ? 's' : ''} ? Elle lit tout.`,
    rate: (n: number) => `${n} étoile${n > 1 ? 's' : ''} sur 5`,
    placeholder: 'Ex. : je tiens enfin la planche, et je me tiens plus droite au bureau.',
    consent: 'J’accepte que mon message soit publié sur le site FitMangas avec mon prénom (jamais mon nom ni ma photo sans accord).',
    send: 'Envoyer',
    sent: 'Merci ! Alejandra lira ton message.',
    withdraw: 'Retirer mon accord de publication',
    withdrawn: 'Ton accord est retiré : ton message ne sera pas publié.',
    certTitle: 'Ton certificat est prêt',
    certKicker: 'Certificat de réussite',
    certFor: 'a terminé le programme',
    download: 'Télécharger (PDF)',
    story: 'Partager en story',
    certNote: 'Aussi envoyé par email · tag',
    certNoteEnd: 'en story !',
    nextKicker: 'La suite logique',
    start: (t: string) => `Commencer ${t}`,
    or: (t: string) => `Ou : ${t}`,
    redo: 'Refaire ce programme',
    allTitle: 'Et maintenant ?',
    allText: 'Choisis ton prochain programme, ou refais celui-ci pour ancrer tes acquis.',
    all: 'Voir tous les programmes',
    error: 'Une erreur est survenue. Réessaie dans un instant.',
  },
  es: {
    kicker: (t: string) => `Programa terminado · ${t}`,
    bravo: (n: string | null) => (n ? `¡Bravo ${n}!` : '¡Bravo!'),
    sub: (t: string, d: number) => `Terminaste ${t} en ${d} día${d > 1 ? 's' : ''}. Tu cuerpo aprendió algo duradero: consérvalo.`,
    sessions: 'sesiones',
    training: 'de entrenamiento',
    days: 'días',
    progressKicker: 'Tus progresos',
    progressTitle: 'El camino recorrido, negro sobre blanco',
    testDates: (a: string, b: string) => `Inicio: test del ${a} · Final: test del ${b}`,
    endTestCta: 'Hacer mi test final (2 min)',
    endTestText: 'Repite los mismos tests que al inicio: aquí verás el camino recorrido.',
    noStartTest: 'No hiciste el test inicial en este programa. En el próximo, hazlo desde el principio para medir tus progresos.',
    stable: 'Estable',
    level: (n: number) => `${n > 0 ? '+' : ''}${n} nivel${Math.abs(n) > 1 ? 'es' : ''}`,
    reps: (n: number) => `${n > 0 ? '+' : ''}${n}`,
    secs: (n: number) => `${n > 0 ? '+' : ''}${n} s`,
    wordTitle: '¿Unas palabras para Alejandra?',
    wordSub: (w: number) => `¿Qué cambió para ti en ${w} semana${w > 1 ? 's' : ''}? Ella lo lee todo.`,
    rate: (n: number) => `${n} estrella${n > 1 ? 's' : ''} de 5`,
    placeholder: 'Ej.: por fin aguanto la plancha y me siento más derecha en la oficina.',
    consent: 'Acepto que mi mensaje se publique en el sitio de FitMangas con mi nombre de pila (nunca mi apellido ni mi foto sin permiso).',
    send: 'Enviar',
    sent: '¡Gracias! Alejandra leerá tu mensaje.',
    withdraw: 'Retirar mi permiso de publicación',
    withdrawn: 'Tu permiso está retirado: tu mensaje no se publicará.',
    certTitle: 'Tu certificado está listo',
    certKicker: 'Certificado de logro',
    certFor: 'terminó el programa',
    download: 'Descargar (PDF)',
    story: 'Compartir en historia',
    certNote: 'También enviado por email · etiqueta a',
    certNoteEnd: 'en tu historia',
    nextKicker: 'El paso lógico',
    start: (t: string) => `Empezar ${t}`,
    or: (t: string) => `O: ${t}`,
    redo: 'Repetir este programa',
    allTitle: '¿Y ahora?',
    allText: 'Elige tu próximo programa, o repite este para afianzar lo aprendido.',
    all: 'Ver todos los programas',
    error: 'Ocurrió un error. Inténtalo de nuevo en un momento.',
  },
} as const;

const CONFETTI: Array<[number, number, string, number, number]> = [
  [6, 14, '#c45d3e', 10, 20],
  [12, 62, '#c9a96e', 7, 0],
  [20, 30, '#2f7d5b', 6, 45],
  [28, 80, '#e8967a', 9, 10],
  [70, 18, '#c9a96e', 8, 30],
  [78, 66, '#c45d3e', 6, 0],
  [86, 34, '#2f7d5b', 9, 60],
  [93, 74, '#e8967a', 7, 15],
  [40, 10, '#f3c58e', 6, 0],
  [60, 88, '#f3c58e', 8, 0],
  [16, 90, '#c45d3e', 5, 0],
  [90, 10, '#c45d3e', 5, 0],
];

function testRow(t: CompletionTest, lang: Lang) {
  const c = C[lang];
  if (t.start == null || t.end == null) return null;
  if (t.type === 'scale' && t.scale?.length) {
    const a = Math.max(0, Math.min(t.scale.length - 1, Math.round(t.start)));
    const b = Math.max(0, Math.min(t.scale.length - 1, Math.round(t.end)));
    const d = b - a;
    return { from: t.scale[a], to: t.scale[b], delta: d === 0 ? c.stable : c.level(d), up: d > 0, pct: Math.round(((b + 1) / t.scale.length) * 100) };
  }
  const d = Math.round(t.end - t.start);
  const unit = t.type === 'seconds' ? ' s' : '';
  const pct = t.end >= t.start ? 100 : t.start > 0 ? Math.round((t.end / t.start) * 100) : 0;
  return {
    from: `${t.start}${unit}`,
    to: `${t.end}${unit}`,
    delta: d === 0 ? c.stable : t.type === 'seconds' ? c.secs(d) : c.reps(d),
    up: d > 0,
    pct,
  };
}

export function ProgramDone({ data, next, alternative, certificateUrl, storyUrl, preview }: ProgramDoneProps) {
  const lang: Lang = data.lang === 'es' ? 'es' : 'fr';
  const t = C[lang];
  const router = useRouter();
  const [rating, setRating] = useState<number | null>(data.feedback?.rating ?? null);
  const [message, setMessage] = useState('');
  const [consent, setConsent] = useState(false);
  const [sent, setSent] = useState(Boolean(data.feedback));
  const [consentGiven, setConsentGiven] = useState(Boolean(data.feedback?.consent));
  const [withdrawn, setWithdrawn] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [testsOpen, setTestsOpen] = useState(false);
  const [pending, start] = useTransition();

  const rows = data.tests.map((x) => ({ test: x, row: testRow(x, lang) })).filter((x) => x.row);
  const hasStart = data.tests.some((x) => x.start != null);

  async function shareStory() {
    if (preview) {
      window.open(storyUrl, '_blank', 'noopener');
      return;
    }
    try {
      const res = await fetch(storyUrl);
      const blob = await res.blob();
      const file = new File([blob], `fitmangas-${data.slug}.png`, { type: 'image/png' });
      const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
      if (nav.canShare?.({ files: [file] })) {
        await nav.share({ files: [file], title: data.title });
        return;
      }
    } catch {
      /* partage annulé ou indisponible : ouverture de l'image */
    }
    window.open(storyUrl, '_blank', 'noopener');
  }

  function sendFeedback() {
    setErr(null);
    start(async () => {
      if (preview) {
        setSent(true);
        setConsentGiven(consent);
        return;
      }
      const res = await recordProgramFeedbackAction({ enrollmentId: data.enrollmentId, rating, message: message.trim(), publishConsent: consent });
      if (res.ok) {
        setSent(true);
        setConsentGiven(consent);
      } else setErr(res.message);
    });
  }

  function withdraw() {
    start(async () => {
      if (!preview) {
        const res = await withdrawFeedbackConsentAction(data.enrollmentId);
        if (!res.ok) {
          setErr(res.message);
          return;
        }
      }
      setWithdrawn(true);
      setConsentGiven(false);
    });
  }

  function redo() {
    start(async () => {
      if (preview) return;
      const res = await restartProgramAction(data.enrollmentId);
      if (res.ok) {
        router.push(`/compte/programmes/${data.slug}`);
        router.refresh();
      } else setErr(res.message);
    });
  }

  const stats = [
    { icon: CircleCheck, value: `${data.done} / ${data.total}`, label: t.sessions },
    { icon: Clock, value: hoursMinutesLabel(data.minutes), label: t.training },
    { icon: CalendarDays, value: String(data.days), label: t.days },
  ];

  return (
    <div className="mx-auto max-w-[1180px] min-w-0 space-y-8 pb-16 pt-3 md:space-y-10 md:px-8 md:pt-10">
      <section className="glass-card glass-card--kpi fm-card-cream relative overflow-hidden px-6 py-10 text-center md:px-12 md:py-14">
        {CONFETTI.map(([x, y, c, sz, r]) => (
          <span
            key={`${x}-${y}`}
            aria-hidden
            className="absolute rounded-[3px] opacity-80"
            style={{ left: `${x}%`, top: `${y}%`, width: sz, height: Math.round(sz * 1.6), background: c, transform: `rotate(${r}deg)` }}
          />
        ))}
        <div className="relative">
          <span className="kpi-icon-wrap kpi-icon-wrap--logo mx-auto !h-16 !w-16">
            <Award size={30} aria-hidden />
          </span>
          <p className="fm-kicker fm-kicker--orange mt-6">{t.kicker(data.title)}</p>
          <h1 className="hero-signature-title mt-3 text-[3rem] text-luxury-ink md:text-[5rem]">{t.bravo(data.firstName)}</h1>
          <p className="hero-signature-subtitle mx-auto mt-4 max-w-xl text-[16px] leading-relaxed md:text-[18px]">{t.sub(data.title, data.days)}</p>
        </div>
        <div className="relative mx-auto mt-9 grid max-w-2xl grid-cols-3 gap-3">
          {stats.map((it) => (
            <div key={it.label} className="rounded-2xl bg-white/85 px-3 py-4 shadow-[0_8px_22px_rgba(31,27,22,0.08)] md:px-4">
              <span className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-terracotta-50 text-luxury-orange">
                <it.icon size={16} aria-hidden />
              </span>
              <p className="mt-2 text-[20px] font-semibold tabular-nums text-luxury-ink md:text-[24px]">{it.value}</p>
              <p className="text-[12px] text-luxury-muted">{it.label}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="min-w-0 space-y-6">
          {data.tests.length ? (
            <section className="glass-card glass-card--kpi p-6 md:p-8">
              <p className="fm-kicker">{t.progressKicker}</p>
              <h2 className="mt-2 text-[1.5rem] font-semibold tracking-tight text-luxury-ink">{t.progressTitle}</h2>
              {rows.length ? (
                <>
                  <div className="mt-6 space-y-4">
                    {rows.map(({ test, row }) =>
                      row ? (
                        <div key={test.key} className="rounded-2xl border border-black/[0.06] bg-white/80 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-[14.5px] font-semibold text-luxury-ink">{test.label}</p>
                            <span className={row.up ? 'fm-tag fm-tag--green' : 'fm-tag'}>
                              {row.up ? <TrendingUp size={13} strokeWidth={2.4} aria-hidden /> : <Minus size={13} aria-hidden />}
                              {row.delta}
                            </span>
                          </div>
                          <div className="mt-3 grid grid-cols-[auto_1fr_auto] items-center gap-3 text-[13px]">
                            <span className="rounded-full bg-black/[0.05] px-3 py-1 font-semibold tabular-nums text-luxury-muted">{row.from}</span>
                            <div className="fm-progress">
                              <span style={{ width: `${row.pct}%` }} />
                            </div>
                            <span className="rounded-full bg-luxury-ink px-3 py-1 font-semibold tabular-nums text-white">{row.to}</span>
                          </div>
                        </div>
                      ) : null,
                    )}
                  </div>
                  {data.testStartKey && data.testEndKey ? (
                    <p className="mt-4 text-[12px] text-luxury-muted">{t.testDates(shortDateLabel(data.testStartKey, lang), shortDateLabel(data.testEndKey, lang))}</p>
                  ) : null}
                </>
              ) : hasStart && data.canRecordEndTest ? (
                <div className="mt-5 rounded-2xl border border-black/[0.06] bg-white/80 p-5">
                  <p className="text-[14px] leading-relaxed text-luxury-muted">{t.endTestText}</p>
                  <button type="button" className="btn-luxury-primary mt-4" onClick={() => setTestsOpen(true)}>
                    {t.endTestCta}
                  </button>
                </div>
              ) : (
                <p className="mt-4 text-[14px] leading-relaxed text-luxury-muted">{t.noStartTest}</p>
              )}
            </section>
          ) : null}

          <section className="glass-card glass-card--kpi p-6 md:p-8">
            <div className="flex items-start gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/landing/alejandra-avatar.jpg" alt="" className="h-12 w-12 rounded-full object-cover object-top ring-2 ring-white" />
              <div className="min-w-0 flex-1">
                <p className="text-[16px] font-semibold text-luxury-ink">{t.wordTitle}</p>
                <p className="mt-1 text-[13.5px] text-luxury-muted">{t.wordSub(data.weeks)}</p>
                {sent ? (
                  <div className="mt-4 space-y-2">
                    <p className="flex items-center gap-2 rounded-xl bg-success-50 px-4 py-3 text-[13.5px] text-success">
                      <Check size={16} aria-hidden /> {t.sent}
                    </p>
                    {consentGiven && !withdrawn ? (
                      <button type="button" disabled={pending} onClick={withdraw} className="text-[12.5px] font-semibold text-luxury-muted underline underline-offset-4 hover:text-luxury-ink">
                        {t.withdraw}
                      </button>
                    ) : null}
                    {withdrawn ? <p className="text-[12.5px] text-luxury-muted">{t.withdrawn}</p> : null}
                  </div>
                ) : (
                  <>
                    <div className="mt-4 flex gap-1.5" role="radiogroup" aria-label={t.wordTitle}>
                      {[1, 2, 3, 4, 5].map((n) => {
                        const on = rating != null && n <= rating;
                        return (
                          <button
                            key={n}
                            type="button"
                            role="radio"
                            aria-checked={rating === n}
                            aria-label={t.rate(n)}
                            onClick={() => setRating(n)}
                            className={on ? 'text-luxury-gold' : 'text-luxury-gold/40 hover:text-luxury-gold/70'}
                          >
                            <Star size={22} strokeWidth={1.8} className={on ? 'fill-current' : ''} />
                          </button>
                        );
                      })}
                    </div>
                    <textarea
                      className="fm-input mt-3 min-h-[96px] w-full resize-none text-[14px]"
                      placeholder={t.placeholder}
                      maxLength={1000}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                    <label className="mt-3 flex cursor-pointer items-start gap-3 text-[12.5px] leading-snug text-luxury-muted">
                      <input type="checkbox" className="sr-only" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                      <span className={`fm-check mt-0.5 !h-5 !w-5 ${consent ? 'fm-check--on' : ''}`} aria-hidden>
                        {consent ? <Check size={12} strokeWidth={3} /> : null}
                      </span>
                      {t.consent}
                    </label>
                    <button type="button" disabled={pending || (!message.trim() && rating == null)} onClick={sendFeedback} className="btn-luxury-gold mt-4">
                      <Send size={14} aria-hidden />
                      {t.send}
                    </button>
                  </>
                )}
                {err ? (
                  <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800" role="alert">
                    {err}
                  </p>
                ) : null}
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="glass-card glass-card--kpi overflow-hidden">
            <div className="bg-[linear-gradient(160deg,#f6ede3,#efe2d4)] p-5">
              <a
                href={certificateUrl}
                target="_blank"
                rel="noopener"
                className="relative block aspect-[297/210] overflow-hidden rounded-lg bg-cream shadow-[0_14px_30px_rgba(29,26,23,0.18)]"
                aria-label={t.download}
              >
                <span className="absolute inset-[6px] rounded-[4px] border border-luxury-gold/70" />
                <span className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/programmes/logo-flamme.png" alt="" className="h-6 w-6 object-contain" />
                  <span className="mt-1.5 text-[6px] font-semibold uppercase tracking-[0.3em] text-luxury-orange">{t.certKicker}</span>
                  <span className="fm-display mt-1 text-[18px] leading-none text-luxury-ink">{data.fullName || data.firstName}</span>
                  <span className="mt-1 text-[6.5px] text-luxury-muted">{t.certFor}</span>
                  <span className="fm-display text-[11px] text-luxury-orange">{data.title}</span>
                  <span className="mt-1.5 text-[5.5px] uppercase tracking-[0.2em] text-luxury-muted">{statsLine(data, lang)}</span>
                  <span className="mt-0.5 text-[5.5px] text-luxury-soft">{periodLabel(data.startKey, data.endKey, lang)}</span>
                </span>
              </a>
            </div>
            <div className="space-y-3 p-5">
              <p className="text-[15px] font-semibold text-luxury-ink">{t.certTitle}</p>
              <a href={certificateUrl} download className="btn-luxury-primary w-full">
                <Download size={14} strokeWidth={2.4} aria-hidden />
                {t.download}
              </a>
              <button type="button" onClick={() => void shareStory()} className="btn-luxury-ghost w-full">
                <Instagram size={15} aria-hidden />
                {t.story}
              </button>
              <p className="text-center text-[11.5px] text-luxury-muted">
                {t.certNote} <b className="font-semibold">@fit.mangas</b> {t.certNoteEnd}
              </p>
            </div>
          </section>

          {next ? (
            <section className="glass-card glass-card--kpi overflow-hidden">
              <div className="fm-media fm-media--veil aspect-[16/10]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={next.coverUrl} alt="" />
                <div className="absolute left-3 top-3 z-[1]">
                  <ProgramLevelPill level={next.level} lang={lang} />
                </div>
                <p className="absolute inset-x-5 bottom-4 z-[1] text-[11px] font-semibold uppercase tracking-[0.18em] text-white/85">{t.nextKicker}</p>
              </div>
              <div className="p-5">
                <p className="text-[18px] font-semibold text-luxury-ink">{next.title}</p>
                <p className="mt-1 text-[13.5px] leading-relaxed text-luxury-muted">{next.promise}</p>
                <Link href={`/compte/programmes/${next.slug}`} className="btn-luxury-primary mt-4 w-full">
                  {t.start(next.title)}
                </Link>
                <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 text-[12.5px] font-medium text-luxury-muted">
                  {alternative ? (
                    <Link href={`/compte/programmes/${alternative.slug}`} className="hover:text-luxury-ink">
                      {t.or(alternative.title)}
                    </Link>
                  ) : null}
                  <button type="button" disabled={pending} onClick={redo} className="hover:text-luxury-ink">
                    {t.redo}
                  </button>
                </div>
              </div>
            </section>
          ) : (
            <section className="glass-card glass-card--kpi p-5">
              <p className="text-[18px] font-semibold text-luxury-ink">{t.allTitle}</p>
              <p className="mt-1 text-[13.5px] leading-relaxed text-luxury-muted">{t.allText}</p>
              <Link href="/compte/programmes" className="btn-luxury-primary mt-4 w-full">
                {t.all}
              </Link>
              <div className="mt-4 flex justify-center text-[12.5px] font-medium text-luxury-muted">
                <button type="button" disabled={pending} onClick={redo} className="hover:text-luxury-ink">
                  {t.redo}
                </button>
              </div>
            </section>
          )}
        </aside>
      </div>

      {testsOpen ? (
        <TestsModal
          lang={lang}
          items={data.testItems}
          enrollmentId={data.enrollmentId}
          startDone
          endDone={false}
          canRecordEnd
          preview={preview}
          onClose={() => {
            setTestsOpen(false);
            router.refresh();
          }}
        />
      ) : null}
    </div>
  );
}
