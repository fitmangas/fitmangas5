'use client';

import Image from 'next/image';
import type { ReactNode } from 'react';

import { acq } from '@/components/acquisition/tokens';
import type { ActionPlanItem } from '@/lib/acquisition/ads/action-plan';
import {
  type AdsSubTab,
  type AdsUiLang,
  pickLang,
} from '@/lib/acquisition/ads/ads-glossary';
import {
  DOC_SOURCES_NOTE,
  MARCHE_MARKETS,
  MARCHE_POSITIONING,
  MARCHE_PUB_CONCLUSION,
  MARCHE_TRENDS,
  MARCHE_WANTS,
} from '@/lib/acquisition/ads/marche-content';
import type { IntelligenceBundle } from '@/lib/acquisition/ads/intelligence-repository';
import { demoShare, summarizeOrganicPeriod, topDemo } from '@/lib/acquisition/ads/stats-compute';
import { AdsTermHint, HBar, num } from './ads-ui';

type Props = {
  intelligence: IntelligenceBundle;
  plan: ActionPlanItem[];
  lang: AdsUiLang;
  onGoTo: (sub: AdsSubTab) => void;
};

const COUNTRY: Record<string, string> = {
  FR: 'France',
  MX: 'Mexique',
  ES: 'Espagne',
  US: 'États-Unis',
  BE: 'Belgique',
  CH: 'Suisse',
};

const GENDER: Record<string, { fr: string; es: string }> = {
  F: { fr: 'Femmes', es: 'Mujeres' },
  M: { fr: 'Hommes', es: 'Hombres' },
  U: { fr: 'Non renseigné', es: 'Sin dato' },
};

function Section({
  title,
  emoji,
  children,
  testId,
  index,
  accent,
}: {
  title: string;
  emoji?: string;
  children: ReactNode;
  testId?: string;
  index?: number;
  accent?: string;
}) {
  return (
    <section
      data-testid={testId}
      className="relative overflow-hidden rounded-[1.75rem] border p-5 sm:p-6"
      style={{ borderColor: 'rgba(232,223,212,0.9)', boxShadow: acq.shadowCard, background: 'linear-gradient(165deg,#FFFFFF 0%,#FFFAF5 100%)' }}
    >
      {accent ? <div className="absolute inset-x-0 top-0 h-1.5" style={{ backgroundColor: accent }} aria-hidden /> : null}
      <div className="flex items-center gap-3">
        {index != null ? (
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl font-serif text-sm font-semibold" style={{ backgroundColor: acq.terracottaSoft, color: acq.terracotta }}>
            {String(index).padStart(2, '0')}
          </span>
        ) : null}
        {emoji ? (
          <span className="text-xl" aria-hidden>
            {emoji}
          </span>
        ) : null}
        <h3 className="font-serif text-xl font-semibold tracking-tight sm:text-[1.4rem]" style={{ color: acq.ink }}>
          {title}
        </h3>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function AdsMarchePanel({ intelligence, plan, lang, onGoTo }: Props) {
  const period = summarizeOrganicPeriod(intelligence.organicDaily ?? [], 28);
  const gender = demoShare(intelligence.demographics.gender);
  const age = demoShare(intelligence.demographics.age).slice(0, 5);
  const country = demoShare(intelligence.demographics.country).slice(0, 5);
  const planWants = new Set(plan.map((p) => p.wantId).filter(Boolean));
  const topCountry = topDemo(country);
  const topGender = topDemo(gender);
  const topAge = topDemo(age);

  return (
    <div className="space-y-5 sm:space-y-6" data-testid="ads-tab-marche">
      <div className="flex items-center justify-between gap-3 px-1" data-testid="ads-marche-hero">
        <div className="min-w-0">
          <h2 className="font-serif text-xl font-semibold tracking-tight sm:text-2xl" style={{ color: acq.ink }}>
            {lang === 'es' ? 'A quién le hablas' : 'À qui tu parles'}
          </h2>
          <p className="mt-0.5 text-sm" style={{ color: acq.muted }}>
            {lang === 'es'
              ? 'El mercado dice qué quieren. Tus cifras dicen quién ya está aquí.'
              : 'Le marché dit ce qu’elles veulent. Tes chiffres disent qui est déjà là.'}
          </p>
        </div>
        <Image
          src="/library/portraits/portrait-05-1x1.webp"
          alt=""
          width={44}
          height={44}
          className="hidden h-11 w-11 shrink-0 rounded-2xl object-cover sm:block"
        />
      </div>

      <Section
        index={1}
        emoji="💛"
        title={lang === 'es' ? 'Lo que quieren las mujeres' : 'Ce que veulent les femmes'}
        testId="ads-marche-wants"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MARCHE_WANTS.map((w) => {
            const inPlan = planWants.has(w.id);
            return (
              <div key={w.id} className="rounded-2xl border border-l-4 bg-white px-4 py-3.5" style={{ borderColor: acq.warmBeigeDeep, borderLeftColor: acq.terracotta }}>
                <p className="text-sm font-semibold" style={{ color: acq.terracotta }}>
                  <span className="mr-1" aria-hidden>
                    {w.emoji}
                  </span>
                  {pickLang(w.title, lang)}
                </p>
                <p className="mt-1 text-sm leading-relaxed" style={{ color: acq.muted }}>
                  {pickLang(w.detail, lang)}
                </p>
                {inPlan ? (
                  <button type="button" onClick={() => onGoTo('plan')} className="mt-2 text-[11px] font-semibold underline" style={{ color: acq.terracotta }} data-testid={`ads-marche-want-plan-${w.id}`}>
                    {lang === 'es' ? 'Ya está en el plan →' : 'Déjà dans le plan →'}
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      </Section>

      <Section
        index={2}
        emoji="📡"
        title={lang === 'es' ? 'Tendencias Pilates / bienestar 2025–2026' : 'Tendances Pilates / bien-être 2025–2026'}
        testId="ads-marche-trends"
      >
        <ul className="grid gap-3 md:grid-cols-2">
          {MARCHE_TRENDS.map((t) => (
            <li key={pickLang(t.title, 'fr')} className="rounded-2xl border bg-white px-4 py-3.5" style={{ borderColor: acq.warmBeigeDeep }}>
              <p className="text-sm font-semibold" style={{ color: acq.ink }}>
                <span className="mr-1" aria-hidden>
                  {t.emoji}
                </span>
                {pickLang(t.title, lang)}
              </p>
              <p className="mt-1 text-sm" style={{ color: acq.muted }}>
                → {pickLang(t.implication, lang)}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        index={3}
        emoji="🎯"
        title={lang === 'es' ? 'Posicionamiento: amplio vs nicho' : 'Positionnement : large vs trop étroit'}
        testId="ads-marche-positioning"
      >
        <p className="text-sm" style={{ color: acq.muted }}>
          <span className="font-semibold text-red-700">{lang === 'es' ? 'Demasiado nicho : ' : 'Trop étroit : '}</span>
          {pickLang(MARCHE_POSITIONING.tooNiche, lang)}
        </p>
        <p className="mt-3 rounded-2xl border px-4 py-3 text-sm leading-relaxed" style={{ borderColor: 'rgba(196,93,62,0.25)', background: acq.terracottaSoft, color: acq.ink }}>
          <span className="font-semibold">{lang === 'es' ? 'Mensaje amplio : ' : 'Message large : '}</span>
          {pickLang(MARCHE_POSITIONING.wideMessage, lang)}
        </p>
        <p className="mt-2 text-xs" style={{ color: acq.muted }}>
          {pickLang(MARCHE_POSITIONING.rule, lang)}
        </p>
      </Section>

      <div className="grid gap-5 lg:grid-cols-2" data-testid="ads-marche-fr-mx">
        {MARCHE_MARKETS.map((m) => (
          <Section key={m.id} emoji={m.id === 'fr' ? '🇫🇷' : '🇲🇽'} title={m.label} testId={`ads-marche-${m.id}`} accent={m.id === 'fr' ? acq.terracotta : '#C98A1E'}>
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: acq.terracotta }}>
              {lang === 'es' ? 'Códigos culturales' : 'Codes culturels'}
            </p>
            <ul className="mt-2 list-inside list-disc text-sm" style={{ color: acq.muted }}>
              {m.codes.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
            <p className="mt-4 text-[10px] font-bold uppercase tracking-wider" style={{ color: acq.terracotta }}>
              {lang === 'es' ? 'Ángulos de anuncio prioritarios' : 'Angles pub prioritaires'}
            </p>
            <ol className="mt-2 list-inside list-decimal text-sm font-medium" style={{ color: acq.ink }}>
              {m.anglesPriority.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ol>
            <p className="mt-3 text-xs" style={{ color: acq.muted }}>
              {lang === 'es' ? 'A dosificar : ' : 'À doser : '}
              {m.anglesSecondary.join(' · ')}
            </p>
            <p className="mt-1 text-xs text-red-700">
              {lang === 'es' ? 'Evitar : ' : 'Éviter : '}
              {m.avoid.join(' · ')}
            </p>
          </Section>
        ))}
      </div>

      <Section
        index={4}
        emoji="📊"
        title={lang === 'es' ? 'Quién te sigue de verdad vs a quién podrías llegar' : 'Qui te suit vraiment vs qui tu pourrais toucher'}
        testId="ads-marche-demo"
      >
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border p-4" style={{ borderColor: acq.warmBeigeDeep, background: acq.cream }}>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: acq.terracotta }}>
              {lang === 'es' ? 'Instagram 28 días (sin anuncio)' : 'Instagram 28 jours (sans pub)'}
            </p>
            {period.coveredDays > 0 ? (
              <ul className="mt-2 space-y-1 text-sm" style={{ color: acq.ink }}>
                <li>{lang === 'es' ? 'Visitas al perfil' : 'Visites du profil'} : {num(period.totals.profileViews)}</li>
                <li>{lang === 'es' ? 'Clics al sitio' : 'Clics vers le site'} : {num((period.totals.websiteClicks ?? 0) + (period.totals.profileLinksTaps ?? 0))}</li>
                <li>{lang === 'es' ? 'Crecimiento neto' : 'Croissance nette'} : {period.netFollowers != null ? `${period.netFollowers >= 0 ? '+' : ''}${period.netFollowers}` : '—'}</li>
              </ul>
            ) : (
              <p className="mt-2 text-sm" style={{ color: acq.muted }}>
                {lang === 'es' ? 'Aún no hay serie — sincroniza los datos.' : 'Pas encore de série — synchronise les données.'}
              </p>
            )}
            <button type="button" onClick={() => onGoTo('stats')} className="mt-3 text-xs font-semibold underline" style={{ color: acq.terracotta }}>
              {lang === 'es' ? 'Ver el detalle en Mis cifras →' : 'Voir le détail dans Mes stats →'}
            </button>
          </div>
          <div className="rounded-2xl border p-4 lg:col-span-2" style={{ borderColor: acq.warmBeigeDeep }}>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: acq.terracotta }}>
              {lang === 'es' ? 'Tus seguidoras (edad / género / país)' : 'Tes abonnées (âge / genre / pays)'}
            </p>
            {gender.length === 0 && age.length === 0 && country.length === 0 ? (
              <p className="mt-2 text-sm" style={{ color: acq.muted }}>
                {lang === 'es'
                  ? 'Aún no hay demografía. Puedes hablar en amplio (30–55, FR luego MX).'
                  : 'Pas encore de démographie. Tu peux parler large (30–55, France puis Mexique).'}
              </p>
            ) : (
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div className="space-y-2">
                  {gender.map((g) => (
                    <HBar key={g.key} label={pickLang(GENDER[g.key] ?? { fr: g.key, es: g.key }, lang)} value={`${Math.round(g.pct)} %`} pctValue={g.pct} />
                  ))}
                </div>
                <div className="space-y-2">
                  {age.map((a) => (
                    <HBar key={a.key} label={a.key} value={`${Math.round(a.pct)} %`} pctValue={a.pct} color="#D9826A" />
                  ))}
                </div>
                <div className="space-y-2">
                  {country.map((c) => (
                    <HBar key={c.key} label={COUNTRY[c.key] ?? c.key} value={`${Math.round(c.pct)} %`} pctValue={c.pct} color="#8C4A33" />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <p className="mt-3 text-sm leading-relaxed" style={{ color: acq.muted }}>
          {(() => {
            const who = [
              topGender ? `${Math.round(topGender.pct)} % ${pickLang(GENDER[topGender.key] ?? { fr: topGender.key, es: topGender.key }, lang).toLowerCase()}` : null,
              topAge ? (lang === 'es' ? `tramo ${topAge.key}` : `tranche ${topAge.key}`) : null,
              topCountry ? (lang === 'es' ? `país nº1 ${COUNTRY[topCountry.key] ?? topCountry.key}` : `pays n°1 ${COUNTRY[topCountry.key] ?? topCountry.key}`) : null,
            ]
              .filter(Boolean)
              .join(', ');
            if (lang === 'es') {
              return `Lectura: ${who || 'audiencia bienestar'}. En anuncio frío, ensancha el mensaje más allá de « Pilates experta ».`;
            }
            return `Lecture : ${who || 'audience bien-être'}. En pub froide, élargis le message au-delà de « Pilates experte » — parle à celles qui ont lâché seules.`;
          })()}
        </p>
      </Section>

      <Section
        index={5}
        emoji="📣"
        title={lang === 'es' ? 'Conclusión — cómo venderte en anuncio' : 'Conclusion — comment te vendre par la pub'}
        testId="ads-marche-conclusion"
      >
        <ol className="list-inside list-decimal space-y-2 text-sm leading-relaxed" style={{ color: acq.ink }}>
          {MARCHE_PUB_CONCLUSION.map((c) => (
            <li key={pickLang(c, 'fr')}>{pickLang(c, lang)}</li>
          ))}
        </ol>
        <p className="mt-3 text-sm" style={{ color: acq.muted }}>
          {lang === 'es' ? (
            <>
              Un anuncio frío gana con un vídeo natural 15–30 s, un <AdsTermHint term="hook" lang={lang} /> de 3 s y un{' '}
              <AdsTermHint term="cta" lang={lang} /> « prueba 7 días ».
            </>
          ) : (
            <>
              Une pub froide gagne avec un film naturel 15–30 s, une <AdsTermHint term="hook" lang={lang} /> de 3 s et un{' '}
              <AdsTermHint term="cta" lang={lang} /> « essai 7 jours ».
            </>
          )}
        </p>
        <button
          type="button"
          onClick={() => onGoTo('plan')}
          className="mt-4 rounded-full px-4 py-2.5 text-xs font-semibold text-white"
          style={{ backgroundColor: acq.terracotta }}
          data-testid="ads-marche-to-plan"
        >
          {lang === 'es' ? 'Ver el plan de acción →' : 'Voir le plan d’action →'}
        </button>
        <p className="mt-4 text-[11px]" style={{ color: acq.mutedLight }}>
          {pickLang(DOC_SOURCES_NOTE, lang)}
        </p>
      </Section>
    </div>
  );
}
