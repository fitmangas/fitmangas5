'use client';

import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';

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

const BATCH_SIZE = 5;

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

  const test = useMemo(() => {
    if (!isBigFive) return initialTest;
    if (format === 'ipip-120') return BIG_FIVE_120_TEST;
    if (format === 'ipip-50') return BIG_FIVE_TEST;
    return initialTest;
  }, [format, initialTest, isBigFive]);

  const hubHref = locale === 'es' ? '/es/quiz' : '/quiz';
  const batches = useMemo(() => chunkItems(test.items, BATCH_SIZE), [test.items]);
  const currentBatch = batches[batchIndex] ?? [];
  const answeredCount = test.items.filter((item) => answers[item.id] != null).length;
  const progressPct = Math.round((answeredCount / test.items.length) * 100);

  const copy =
    locale === 'es'
      ? {
          chooseTitle: 'Elige la profundidad del test',
          chooseSub: 'Mismo modelo Big Five — más preguntas = más matices.',
          quickTitle: 'Rápida IPIP-50',
          quickMeta: '50 preguntas · ~8 min · 5 rasgos',
          deepTitle: 'Profunda IPIP-NEO-120',
          deepMeta: '120 preguntas · ~20 min · 30 facetas',
          introCta: 'Empezar el test',
          back: 'Volver',
          next: 'Continuar',
          finish: 'Ver mi resultado',
          batch: 'Bloque',
          of: 'de',
          source: 'Fuente',
          progress: 'Progreso',
          pick: 'Elige de 1 (muy en desacuerdo) a 5 (muy de acuerdo) según el test.',
          introWhat: 'Qué obtienes',
          introBullet1: 'Un retrato con nombre y forma de tu perfil (radar).',
          introBullet2: 'Tus fuerzas y límites — sin juicio, orientado a la práctica.',
          introBullet3: 'Un puente hacia cursos colectivos a horarios fijos (no es un diagnóstico).',
          disclaimer: 'Resultado indicativo, no médico. Basado en ítems IPIP de dominio público.',
        }
      : {
          chooseTitle: 'Choisis la profondeur du test',
          chooseSub: 'Même modèle Big Five — plus de questions = plus de nuances.',
          quickTitle: 'Rapide IPIP-50',
          quickMeta: '50 questions · ~8 min · 5 traits',
          deepTitle: 'Approfondie IPIP-NEO-120',
          deepMeta: '120 questions · ~20 min · 30 facettes',
          introCta: 'Commencer le test',
          back: 'Retour',
          next: 'Continuer',
          finish: 'Voir mon résultat',
          batch: 'Bloc',
          of: 'sur',
          source: 'Source',
          progress: 'Progression',
          pick: 'Choisis de 1 (très inexact) à 5 (très exact) selon l’échelle indiquée.',
          introWhat: 'Ce que tu obtiens',
          introBullet1: 'Un portrait nommé + la forme de ton profil (radar).',
          introBullet2: 'Tes forces et limites — sans jugement, orienté pratique.',
          introBullet3: 'Un pont vers les cours collectifs à horaires fixes (pas un diagnostic).',
          disclaimer: 'Résultat indicatif, pas médical. Basé sur les items IPIP domaine public.',
        };

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

  const pickFormat = useCallback((picked: BigFiveFormat) => {
    setFormat(picked);
    setAnswers({});
    setBatchIndex(0);
    setPhase('intro');
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
    <SelfTestShell locale={locale}>
      <div className="mx-auto max-w-2xl px-5 py-8 pb-20">
        {phase === 'choose' ? (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c45d3e]">Big Five</p>
            <h1 className="mt-4 font-serif text-[2rem] italic leading-tight text-brand-ink sm:text-[2.35rem]">
              {copy.chooseTitle}
            </h1>
            <p className="mt-3 text-[15px] text-brand-ink/55">{copy.chooseSub}</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => pickFormat('ipip-50')}
                className="glass-card rounded-[24px] border border-white/55 bg-white/85 p-6 text-left transition hover:-translate-y-0.5 hover:border-[#c45d3e]/40"
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#c45d3e]">
                  {copy.quickTitle}
                </p>
                <p className="mt-2 text-[14px] leading-relaxed text-brand-ink/65">{copy.quickMeta}</p>
              </button>
              <button
                type="button"
                onClick={() => pickFormat('ipip-120')}
                className="glass-card rounded-[24px] border border-white/55 bg-white/85 p-6 text-left transition hover:-translate-y-0.5 hover:border-[#c45d3e]/40"
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#c45d3e]">
                  {copy.deepTitle}
                </p>
                <p className="mt-2 text-[14px] leading-relaxed text-brand-ink/65">{copy.deepMeta}</p>
              </button>
            </div>
          </div>
        ) : phase === 'intro' ? (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c45d3e]">
              {test.durationMin} min · {test.items.length} {locale === 'es' ? 'preguntas' : 'questions'}
            </p>
            <h1 className="mt-4 font-serif text-[2rem] italic leading-tight text-brand-ink sm:text-[2.35rem]">
              {test.title[locale]}
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed text-brand-ink/60">{test.description[locale]}</p>

            <div className="mt-6 rounded-[20px] border border-brand-ink/[0.06] bg-white/70 p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-ink/45">{copy.introWhat}</p>
              <ul className="mt-3 space-y-2 text-[14px] leading-relaxed text-brand-ink/65">
                <li>· {copy.introBullet1}</li>
                <li>· {copy.introBullet2}</li>
                <li>· {copy.introBullet3}</li>
              </ul>
              <p className="mt-4 text-[12px] text-brand-ink/45">{copy.disclaimer}</p>
            </div>

            <p className="mt-4 text-[12px] text-brand-ink/45">
              {copy.source} :{' '}
              <a href={test.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                {test.source}
              </a>
            </p>
            {mode === 'member' && memberEmail ? (
              <p className="mt-4 text-[13px] text-brand-ink/50">
                {locale === 'es' ? 'Conectada como' : 'Connectée en tant que'} {memberFirstName ?? memberEmail}
              </p>
            ) : null}
            <div className="mt-8 flex flex-wrap gap-3">
              {isBigFive && !initialFormat ? (
                <button
                  type="button"
                  onClick={() => {
                    setAnswers({});
                    setBatchIndex(0);
                    setPhase('choose');
                  }}
                  className="rounded-full border border-brand-ink/15 bg-white/80 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-brand-ink/60"
                >
                  ← {copy.back}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setPhase('questions')}
                className="rounded-full bg-[#c45d3e] px-8 py-3.5 text-[11px] font-bold uppercase tracking-[0.16em] text-white shadow-[0_10px_24px_rgba(196,93,62,0.28)] transition hover:bg-[#b35338]"
              >
                {copy.introCta} →
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-ink/45">
                <span>
                  {copy.batch} {batchIndex + 1} {copy.of} {batches.length}
                </span>
                <span>
                  {copy.progress} {progressPct}%
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-brand-ink/8">
                <div
                  className="h-full rounded-full bg-[#c45d3e] transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            <p className="mb-6 text-[14px] text-brand-ink/55">{copy.pick}</p>

            <div className="space-y-8">
              {currentBatch.map((item) => (
                <fieldset key={item.id} className="rounded-[20px] border border-brand-ink/[0.06] bg-white/85 p-5 shadow-sm">
                  <legend className="text-[15px] font-medium leading-snug text-brand-ink">{item.text[locale]}</legend>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {(Array.from({ length: test.likertMax }, (_, i) => (i + 1) as LikertValue)).map((v) => (
                      <button
                        key={v}
                        type="button"
                        aria-pressed={answers[item.id] === v}
                        onClick={() => pickAnswer(item.id, v)}
                        className={`min-w-[2.75rem] rounded-full border px-3 py-2 text-[13px] font-semibold transition ${
                          answers[item.id] === v
                            ? 'border-[#c45d3e] bg-[#c45d3e] text-white shadow-md'
                            : 'border-brand-ink/10 bg-white text-brand-ink/70 hover:border-[#c45d3e]/40'
                        }`}
                        title={test.likertLabels[locale][v - 1]}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-[10px] text-brand-ink/40">
                    1 = {test.likertLabels[locale][0]} · {test.likertMax} ={' '}
                    {test.likertLabels[locale][test.likertMax - 1]}
                  </p>
                </fieldset>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {batchIndex > 0 ? (
                <button
                  type="button"
                  onClick={() => setBatchIndex((i) => i - 1)}
                  className="rounded-full border border-brand-ink/15 bg-white/80 px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-brand-ink/60"
                >
                  ← {copy.back}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setPhase('intro')}
                  className="rounded-full border border-brand-ink/15 bg-white/80 px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-brand-ink/60"
                >
                  ← {copy.back}
                </button>
              )}
              <button
                type="button"
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
                className="flex-1 rounded-full bg-[#c45d3e] px-6 py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-white shadow-md transition hover:bg-[#b35338] disabled:opacity-50 sm:flex-none"
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
              <p className="mt-4 text-[13px] text-red-600" role="alert">
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
