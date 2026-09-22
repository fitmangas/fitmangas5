'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { SelfTestLeadCapture, type SelfTestLeadPayload } from '@/components/SelfKnowledge/SelfTestLeadCapture';
import { SelfTestShell } from '@/components/SelfKnowledge/SelfTestShell';
import { SelfTestTeaser } from '@/components/SelfKnowledge/SelfTestTeaser';
import { BIG_FIVE_120_TEST } from '@/lib/self-knowledge/ipip120';
import { BIG_FIVE_TEST } from '@/lib/self-knowledge/ipip50';
import { scoreSelfTest, validateAnswers } from '@/lib/self-knowledge/scoring';
import type {
  BigFiveFormat,
  LikertValue,
  SelfTestAnalysis,
  SelfTestAnswers,
  SelfTestDefinition,
  SelfTestLang,
  SelfTestScores,
} from '@/lib/self-knowledge/types';

type Props = {
  test: SelfTestDefinition;
  locale: SelfTestLang;
  mode?: 'public' | 'member';
  memberEmail?: string;
  memberFirstName?: string | null;
  /** Deep link membre : saute la phase choose */
  initialFormat?: BigFiveFormat;
};

type Phase = 'choose' | 'intro' | 'questions' | 'lead' | 'result';

/** Desktop : 5 questions / écran ; mobile : 2 (évite le scroll long). */
const BATCH_SIZE_DESKTOP = 5;
const BATCH_SIZE_MOBILE = 2;

const COACH_BG = {
  'big-five': '/library/portraits/portrait-05-4x5.webp',
  attachement: '/library/portraits/portrait-01-4x5.webp',
} as const;

function trialUrl(locale: SelfTestLang, slug: string) {
  const path = locale === 'es' ? '/es' : '';
  const params = new URLSearchParams({
    offer: 'v-coll',
    utm_source: 'self-test',
    utm_campaign: slug,
  });
  return `${path}/?${params.toString()}`;
}

function chunkItems<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

export function SelfTestRunner({
  test: initialTest,
  locale,
  mode = 'public',
  memberEmail,
  memberFirstName,
  initialFormat,
}: Props) {
  const isBigFive = initialTest.slug === 'big-five';
  const [format, setFormat] = useState<BigFiveFormat | null>(
    isBigFive ? (initialFormat ?? null) : null,
  );
  const [phase, setPhase] = useState<Phase>(() => {
    if (isBigFive && !initialFormat) return 'choose';
    return 'intro';
  });
  const [batchIndex, setBatchIndex] = useState(0);
  const [answers, setAnswers] = useState<SelfTestAnswers>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<SelfTestAnalysis | null>(null);
  const [scores, setScores] = useState<SelfTestScores | null>(null);
  const [batchSize, setBatchSize] = useState(BATCH_SIZE_DESKTOP);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    const sync = () => setBatchSize(mq.matches ? BATCH_SIZE_MOBILE : BATCH_SIZE_DESKTOP);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const test = useMemo(() => {
    if (!isBigFive) return initialTest;
    if (format === 'ipip-120') return BIG_FIVE_120_TEST;
    if (format === 'ipip-50') return BIG_FIVE_TEST;
    return initialTest;
  }, [format, initialTest, isBigFive]);

  const hubHref = locale === 'es' ? '/es/quiz' : '/quiz';
  const batches = useMemo(() => chunkItems(test.items, batchSize), [test.items, batchSize]);

  // Si le batchSize change (resize), recentrer l’index
  useEffect(() => {
    setBatchIndex((i) => Math.min(i, Math.max(0, batches.length - 1)));
  }, [batches.length]);
  const currentBatch = batches[batchIndex] ?? [];
  const answeredCount = test.items.filter((item) => answers[item.id] != null).length;
  const progressPct = Math.round((answeredCount / test.items.length) * 100);
  const coachBg = isBigFive ? COACH_BG['big-five'] : COACH_BG.attachement;

  const copy =
    locale === 'es'
      ? {
          chooseTitle: 'Elige la profundidad',
          chooseSub: 'Mismo modelo Big Five — el clic lanza el test.',
          quickTitle: 'Rápida · IPIP-50',
          quickMeta: '50 preguntas · ~8 min',
          quickGets: ['Retrato + radar de 5 rasgos', 'Fuerzas y límites orientados a la práctica', 'Puente hacia cursos colectivos'],
          deepTitle: 'Profunda · IPIP-NEO-120',
          deepMeta: '120 preguntas · ~20 min',
          deepGets: ['Todo lo de la rápida', '30 facetas bajo los 5 rasgos', 'Más matices en tu perfil'],
          startNow: 'Empezar ahora',
          introCta: 'Empezar el test',
          back: 'Volver',
          next: 'Continuar',
          finish: 'Ver mi resultado',
          batch: 'Bloque',
          of: 'de',
          source: 'Fuente',
          progress: 'Progreso',
          pick: 'De 1 (muy en desacuerdo) a 5 (muy de acuerdo).',
          introWhat: 'Qué obtienes',
          introBullet1: 'Un retrato con nombre y forma de tu perfil (radar).',
          introBullet2: 'Tus fuerzas y límites — sin juicio, orientado a la práctica.',
          introBullet3: 'Un puente hacia cursos colectivos a horarios fijos.',
          disclaimer: 'Ítems IPIP · dominio público · ~600 000 personas.',
          disclaimerAttach:
            'Escala ECR-S (Wei et al., 2007) — ítems oficiales, dominio público.',
        }
      : {
          chooseTitle: 'Choisis la profondeur',
          chooseSub: 'Même modèle Big Five — le clic lance le test.',
          quickTitle: 'Rapide · IPIP-50',
          quickMeta: '50 questions · ~8 min',
          quickGets: [
            'Portrait + radar des 5 traits',
            'Forces et limites orientées pratique',
            'Pont vers les cours collectifs',
          ],
          deepTitle: 'Approfondie · IPIP-NEO-120',
          deepMeta: '120 questions · ~20 min',
          deepGets: ['Tout ce que la rapide offre', '30 facettes sous les 5 traits', 'Plus de nuances sur ton profil'],
          startNow: 'Commencer maintenant',
          introCta: 'Commencer le test',
          back: 'Retour',
          next: 'Continuer',
          finish: 'Voir mon résultat',
          batch: 'Bloc',
          of: 'sur',
          source: 'Source',
          progress: 'Progression',
          pick: 'De 1 (très inexact) à 5 (très exact).',
          introWhat: 'Ce que tu obtiens',
          introBullet1: 'Un portrait nommé + la forme de ton profil (radar).',
          introBullet2: 'Tes forces et limites — sans jugement, orienté pratique.',
          introBullet3: 'Un pont vers les cours collectifs à horaires fixes.',
          disclaimer: 'Items IPIP · domaine public · ~600 000 personnes.',
          disclaimerAttach:
            'Échelle ECR-S (Wei et al., 2007) — items officiels, domaine public.',
        };

  const credibilityLine = isBigFive ? copy.disclaimer : copy.disclaimerAttach;

  const batchComplete = currentBatch.every((item) => answers[item.id] != null);
  const allComplete = validateAnswers(test, answers).ok;

  const pickAnswer = useCallback((itemId: string, value: LikertValue) => {
    setAnswers((prev) => ({ ...prev, [itemId]: value }));
  }, []);

  const submitAnswers = useCallback(
    async (lead?: SelfTestLeadPayload) => {
      if (!allComplete || submitting) return;
      setSubmitting(true);
      setSubmitError(null);
      try {
        const computedScores = scoreSelfTest(test, answers);
        const endpoint = mode === 'member' ? '/api/self-knowledge/member-submit' : '/api/self-knowledge/submit';
        const resolvedFormat = test.format ?? format ?? 'ipip-50';
        const body =
          mode === 'member'
            ? {
                slug: test.slug,
                locale,
                answers,
                format: test.slug === 'big-five' ? resolvedFormat : undefined,
              }
            : {
                slug: test.slug,
                locale,
                firstName: lead!.firstName,
                email: lead!.email,
                consent: true,
                blogOptIn: lead!.blogOptIn ?? false,
                answers,
                format: test.slug === 'big-five' ? resolvedFormat : undefined,
                source: {
                  utm_source: 'self-test',
                  utm_campaign: test.slug,
                },
              };

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          analysis?: SelfTestAnalysis;
          scores?: SelfTestScores;
        };
        if (!res.ok) {
          setSubmitError(
            data.error ??
              (locale === 'es' ? 'No se pudo guardar. Inténtalo de nuevo.' : 'Enregistrement impossible. Réessaie.'),
          );
          return;
        }
        setScores(data.scores ?? computedScores);
        setAnalysis(data.analysis ?? null);
        setPhase('result');
      } catch {
        setSubmitError(
          locale === 'es' ? 'Error de red. Comprueba tu conexión.' : 'Erreur réseau. Vérifie ta connexion.',
        );
      } finally {
        setSubmitting(false);
      }
    },
    [allComplete, answers, format, locale, mode, submitting, test],
  );

  const handleLeadSubmit = useCallback(
    (payload: SelfTestLeadPayload) => {
      void submitAnswers(payload);
    },
    [submitAnswers],
  );

  const handleMemberFinish = useCallback(() => {
    void submitAnswers();
  }, [submitAnswers]);

  /** Choix profondeur = lancement immédiat (plus de page intro intermédiaire). */
  const pickFormat = useCallback((picked: BigFiveFormat) => {
    setFormat(picked);
    setAnswers({});
    setBatchIndex(0);
    setPhase('questions');
  }, []);

  if (phase === 'result' && analysis && scores) {
    return (
      <SelfTestShell locale={locale}>
        <SelfTestTeaser
          locale={locale}
          test={test}
          scores={scores}
          analysis={analysis}
          trialHref={trialUrl(locale, test.slug)}
          hubHref={hubHref}
          showFull={mode === 'member'}
          firstName={memberFirstName}
          inviterEmail={memberEmail}
        />
      </SelfTestShell>
    );
  }

  if (phase === 'lead') {
    return (
      <SelfTestShell locale={locale}>
        <SelfTestLeadCapture
          locale={locale}
          testTitle={test.title[locale]}
          submitting={submitting}
          error={submitError}
          onSubmit={handleLeadSubmit}
        />
      </SelfTestShell>
    );
  }

  return (
    <SelfTestShell
      locale={locale}
      pageBackgroundUrl={phase === 'questions' ? '/tests/questions-bg.jpg' : undefined}
      veilOpacity={0.36}
    >
      <div
        className={`mx-auto px-5 py-8 pb-20 ${phase === 'choose' ? 'max-w-4xl' : 'max-w-3xl'}`}
        data-testid={`self-test-phase-${phase}`}
      >
        {phase === 'choose' ? (
          <div data-testid="self-test-choose">
            <div className="overflow-hidden rounded-[28px] border border-white/70 bg-white/50 shadow-[0_20px_50px_rgba(60,40,30,0.08)]">
              <div
                className="relative h-72 bg-cover bg-no-repeat sm:h-[22rem] md:h-[26rem]"
                style={{
                  backgroundImage: `linear-gradient(120deg, rgba(26,20,16,0.28), rgba(196,93,62,0.12)), url('${coachBg}')`,
                  backgroundPosition: 'center 8%',
                  backgroundSize: 'cover',
                }}
              >
                <p className="absolute bottom-4 left-5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/90">
                  Big Five
                </p>
              </div>
              <div className="p-6 sm:p-8">
                <h1 className="font-serif text-[1.85rem] italic leading-tight text-brand-ink sm:text-[2.25rem]">
                  {copy.chooseTitle}
                </h1>
                <p className="mt-2 text-[14px] text-brand-ink/55">{copy.chooseSub}</p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {(
                    [
                      {
                        id: 'ipip-50' as const,
                        title: copy.quickTitle,
                        meta: copy.quickMeta,
                        gets: copy.quickGets,
                        testId: 'choose-ipip-50',
                      },
                      {
                        id: 'ipip-120' as const,
                        title: copy.deepTitle,
                        meta: copy.deepMeta,
                        gets: copy.deepGets,
                        testId: 'choose-ipip-120',
                      },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      data-testid={opt.testId}
                      onClick={() => pickFormat(opt.id)}
                      className="group flex flex-col rounded-[22px] border border-[#c45d3e]/18 bg-[#FFFAF5] p-5 text-left shadow-[0_10px_28px_rgba(196,93,62,0.08)] transition hover:-translate-y-1 hover:border-[#c45d3e]/45 hover:shadow-[0_16px_36px_rgba(196,93,62,0.16)]"
                    >
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#c45d3e]">{opt.title}</p>
                      <p className="mt-1 text-[13px] font-medium text-brand-ink/70">{opt.meta}</p>
                      <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-ink/40">
                        {copy.introWhat}
                      </p>
                      <ul className="mt-2 flex-1 space-y-1.5 text-[12.5px] leading-snug text-brand-ink/65">
                        {opt.gets.map((g) => (
                          <li key={g} className="flex gap-2">
                            <span className="text-[#c45d3e]">●</span>
                            <span>{g}</span>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-3 text-[10px] leading-snug text-brand-ink/40">
                        {locale === 'es' ? 'Fuente IPIP · dominio público' : 'Source IPIP · domaine public'}
                      </p>
                      <span className="mt-4 inline-flex items-center justify-center rounded-full bg-[#c45d3e] px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
                        {copy.startNow} →
                      </span>
                    </button>
                  ))}
                </div>
                <p className="mt-5 text-center text-[11px] text-brand-ink/40">{credibilityLine}</p>
              </div>
            </div>
          </div>
        ) : phase === 'intro' ? (
          <div data-testid="self-test-intro">
            <div className="overflow-hidden rounded-[28px] border border-white/70 bg-white/60 shadow-[0_20px_50px_rgba(60,40,30,0.08)]">
              <div
                className="relative h-64 bg-cover bg-no-repeat sm:h-80"
                style={{
                  backgroundImage: `linear-gradient(120deg, rgba(26,20,16,0.28), rgba(196,93,62,0.12)), url('${coachBg}')`,
                  backgroundPosition: 'center 8%',
                  backgroundSize: 'cover',
                }}
              >
                <p className="absolute bottom-4 left-5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/90">
                  {test.durationMin} min · {test.items.length}{' '}
                  {locale === 'es' ? 'preguntas' : 'questions'}
                </p>
              </div>
              <div className="p-6 sm:p-8">
                <h1 className="font-serif text-[2rem] italic leading-tight text-brand-ink sm:text-[2.35rem]">
                  {test.title[locale]}
                </h1>
                <p className="mt-4 text-[15px] leading-relaxed text-brand-ink/60">{test.description[locale]}</p>

                <div className="mt-6 rounded-[20px] border border-[#c45d3e]/15 bg-[#FFFAF5] p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#c45d3e]">
                    {copy.introWhat}
                  </p>
                  <ul className="mt-3 space-y-3 text-[14px] leading-relaxed text-brand-ink/70">
                    <li className="flex gap-2">
                      <span className="mt-0.5 text-[#c45d3e]">●</span>
                      <span>{copy.introBullet1}</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-0.5 text-[#c45d3e]">●</span>
                      <span>{copy.introBullet2}</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-0.5 text-[#c45d3e]">●</span>
                      <span>{copy.introBullet3}</span>
                    </li>
                  </ul>
                  <p className="mt-4 text-[12px] text-brand-ink/45">{credibilityLine}</p>
                </div>

                <p className="mt-4 text-[12px] text-brand-ink/45">
                  {copy.source} :{' '}
                  <a
                    href={test.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2"
                  >
                    {test.source}
                  </a>
                </p>
                {mode === 'member' && memberEmail ? (
                  <p className="mt-4 text-[13px] text-brand-ink/50">
                    {locale === 'es' ? 'Conectada como' : 'Connectée en tant que'}{' '}
                    {memberFirstName ?? memberEmail}
                  </p>
                ) : null}
                <div className="mt-8 flex flex-wrap gap-3">
                  <button
                    type="button"
                    data-testid="intro-start"
                    onClick={() => setPhase('questions')}
                    className="rounded-full bg-[#c45d3e] px-8 py-3.5 text-[11px] font-bold uppercase tracking-[0.16em] text-white shadow-[0_10px_24px_rgba(196,93,62,0.28)] transition hover:bg-[#b35338]"
                  >
                    {copy.introCta} →
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div
            data-testid="self-test-questions"
            className="relative mx-auto flex min-h-[calc(100dvh-7.5rem)] max-w-2xl flex-col justify-center py-3 sm:py-4"
          >
            <div className="relative z-10 mb-3 shrink-0 px-4 sm:px-5">
              <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-ink/45 sm:text-[11px]">
                <span>
                  {copy.batch} {batchIndex + 1} {copy.of} {batches.length}
                </span>
                <span>
                  {copy.progress} {progressPct}%
                </span>
              </div>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-brand-ink/8">
                <div
                  className="h-full rounded-full bg-[#c45d3e] transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            <div className="relative z-10 flex flex-1 flex-col justify-center gap-2 px-3 sm:gap-2.5 sm:px-5">
              {currentBatch.map((item) => {
                const labels = test.likertLabels[locale];
                const values = Array.from({ length: test.likertMax }, (_, i) => (i + 1) as LikertValue);
                return (
                  <div
                    key={item.id}
                    data-testid={`question-${item.id}`}
                    className="rounded-[16px] border border-brand-ink/[0.06] bg-white/95 px-3 py-2.5 shadow-[0_4px_16px_rgba(60,40,30,0.04)] sm:px-4 sm:py-3"
                  >
                    <p className="px-1 text-center text-[13px] font-medium leading-snug text-brand-ink sm:text-[14px]">
                      {item.text[locale]}
                    </p>
                    <div
                      className="mt-2 grid gap-1"
                      style={{ gridTemplateColumns: `repeat(${test.likertMax}, minmax(0, 1fr))` }}
                    >
                      {values.map((v) => (
                        <button
                          key={v}
                          type="button"
                          data-testid={`answer-${item.id}-${v}`}
                          aria-pressed={answers[item.id] === v}
                          aria-label={labels[v - 1]}
                          onClick={() => pickAnswer(item.id, v)}
                          className={`flex min-h-[3.25rem] w-full flex-col items-center justify-center gap-0.5 rounded-lg border px-0.5 py-1 transition sm:min-h-[3.5rem] ${
                            answers[item.id] === v
                              ? 'border-[#c45d3e] bg-[#c45d3e] text-white shadow-sm'
                              : 'border-brand-ink/10 bg-[#FFFAF5] text-brand-ink/70 hover:border-[#c45d3e]/40'
                          }`}
                          title={labels[v - 1]}
                        >
                          <span className="text-[13px] font-semibold leading-none sm:text-[14px]">{v}</span>
                          <span
                            className={`text-center text-[7px] leading-[1.15] tracking-normal sm:text-[8px] ${
                              answers[item.id] === v ? 'text-white/85' : 'text-brand-ink/40'
                            }`}
                          >
                            {labels[v - 1]}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="relative z-10 mt-3 flex shrink-0 flex-wrap gap-2 px-4 sm:mt-4 sm:gap-3 sm:px-5">
              {batchIndex > 0 ? (
                <button
                  type="button"
                  onClick={() => setBatchIndex((i) => i - 1)}
                  className="rounded-full border border-brand-ink/15 bg-white/90 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-brand-ink/60 sm:px-5 sm:py-2.5 sm:text-[11px]"
                >
                  ← {copy.back}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setPhase(isBigFive && !initialFormat ? 'choose' : 'intro')}
                  className="rounded-full border border-brand-ink/15 bg-white/90 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-brand-ink/60 sm:px-5 sm:py-2.5 sm:text-[11px]"
                >
                  ← {copy.back}
                </button>
              )}
              <button
                type="button"
                data-testid="questions-next"
                disabled={!batchComplete || submitting}
                onClick={() => {
                  if (batchIndex < batches.length - 1) {
                    setBatchIndex((i) => i + 1);
                  } else if (mode === 'member') {
                    handleMemberFinish();
                  } else {
                    setPhase('lead');
                  }
                }}
                className="flex-1 rounded-full bg-[#c45d3e] px-5 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white shadow-md transition hover:bg-[#b35338] disabled:opacity-50 sm:flex-none sm:px-6 sm:py-2.5 sm:text-[11px]"
              >
                {batchIndex < batches.length - 1
                  ? `${copy.next} →`
                  : mode === 'member'
                    ? submitting
                      ? '…'
                      : `${copy.finish} →`
                    : `${copy.finish} →`}
              </button>
            </div>

            {submitError ? (
              <p className="relative z-10 mt-3 px-4 text-[13px] text-red-600" role="alert" data-testid="submit-error">
                {submitError}
              </p>
            ) : null}
          </div>
        )}

        <Link
          href={hubHref}
          className="mt-10 inline-block text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-ink/40 underline underline-offset-4 hover:text-[#c45d3e]"
        >
          {locale === 'es' ? 'Todos los tests' : 'Tous les tests'}
        </Link>
      </div>
    </SelfTestShell>
  );
}
