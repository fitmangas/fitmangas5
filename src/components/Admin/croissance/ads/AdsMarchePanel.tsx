'use client';

import type { ReactNode } from 'react';
import {
  MARCHE_MARKETS,
  MARCHE_POSITIONING,
  MARCHE_PUB_CONCLUSION,
  MARCHE_TRENDS,
  MARCHE_WANTS,
  DOC_SOURCES_NOTE,
} from '@/lib/acquisition/ads/marche-content';
import type { IntelligenceBundle } from '@/lib/acquisition/ads/intelligence-repository';
import { acq } from '@/components/acquisition/tokens';

type Props = { intelligence: IntelligenceBundle };

function Section({
  title,
  children,
  testId,
}: {
  title: string;
  children: ReactNode;
  testId?: string;
}) {
  return (
    <section
      data-testid={testId}
      className="rounded-[1.5rem] border bg-white/90 p-5 sm:p-6"
      style={{ borderColor: acq.warmBeigeDeep, boxShadow: acq.shadowCard }}
    >
      <h3 className="font-serif text-lg font-semibold sm:text-xl" style={{ color: acq.ink }}>
        {title}
      </h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function AdsMarchePanel({ intelligence }: Props) {
  const account = intelligence.organicAccount;
  const age = intelligence.breakdowns.age.slice(0, 5);
  const gender = intelligence.breakdowns.gender.slice(0, 4);
  const country = intelligence.breakdowns.country.slice(0, 5);

  return (
    <div className="space-y-5 sm:space-y-6" data-testid="ads-tab-marche">
      <Section title="Ce que veulent les femmes" testId="ads-marche-wants">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MARCHE_WANTS.map((w) => (
            <div key={w.id} className="rounded-2xl border px-4 py-3" style={{ borderColor: acq.warmBeigeDeep, background: acq.cream }}>
              <p className="text-sm font-semibold" style={{ color: acq.terracotta }}>
                {w.title}
              </p>
              <p className="mt-1 text-sm leading-relaxed" style={{ color: acq.muted }}>
                {w.detail}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Tendances Pilates / wellness 2025–2026" testId="ads-marche-trends">
        <ul className="space-y-3">
          {MARCHE_TRENDS.map((t) => (
            <li key={t.title} className="rounded-2xl border px-4 py-3" style={{ borderColor: acq.warmBeigeDeep }}>
              <p className="text-sm font-semibold" style={{ color: acq.ink }}>
                {t.title}
              </p>
              <p className="mt-1 text-sm" style={{ color: acq.muted }}>
                → {t.implication}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Positionnement : large vs niche" testId="ads-marche-positioning">
        <p className="text-sm" style={{ color: acq.muted }}>
          <span className="font-semibold text-red-700">Trop niche : </span>
          {MARCHE_POSITIONING.tooNiche}
        </p>
        <p className="mt-3 rounded-2xl border px-4 py-3 text-sm leading-relaxed" style={{ borderColor: 'rgba(196,93,62,0.25)', background: acq.terracottaSoft, color: acq.ink }}>
          <span className="font-semibold">Message large : </span>
          {MARCHE_POSITIONING.wideMessage}
        </p>
        <p className="mt-2 text-xs" style={{ color: acq.muted }}>
          {MARCHE_POSITIONING.rule}
        </p>
      </Section>

      <div className="grid gap-5 lg:grid-cols-2" data-testid="ads-marche-fr-mx">
        {MARCHE_MARKETS.map((m) => (
          <Section key={m.id} title={m.label} testId={`ads-marche-${m.id}`}>
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: acq.terracotta }}>
              Codes culturels
            </p>
            <ul className="mt-2 list-inside list-disc text-sm" style={{ color: acq.muted }}>
              {m.codes.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
            <p className="mt-4 text-[10px] font-bold uppercase tracking-wider" style={{ color: acq.terracotta }}>
              Angles pub prioritaires
            </p>
            <ol className="mt-2 list-inside list-decimal text-sm font-medium" style={{ color: acq.ink }}>
              {m.anglesPriority.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ol>
            <p className="mt-3 text-xs" style={{ color: acq.muted }}>
              À doser : {m.anglesSecondary.join(' · ')}
            </p>
            <p className="mt-1 text-xs text-red-700">Éviter : {m.avoid.join(' · ')}</p>
          </Section>
        ))}
      </div>

      <Section title="Qui te suit vraiment (Meta) vs qui tu pourrais toucher" testId="ads-marche-demo">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border p-4" style={{ borderColor: acq.warmBeigeDeep, background: acq.cream }}>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: acq.terracotta }}>
              Organique compte
            </p>
            {account ? (
              <ul className="mt-2 space-y-1 text-sm" style={{ color: acq.ink }}>
                <li>Abonnés : {account.followersCount?.toLocaleString('fr-FR') ?? '—'}</li>
                <li>Portée (snap) : {account.reach?.toLocaleString('fr-FR') ?? '—'}</li>
                <li>Vues profil : {account.profileViews?.toLocaleString('fr-FR') ?? '—'}</li>
                <li>Clics bio : {account.websiteClicks?.toLocaleString('fr-FR') ?? '—'}</li>
              </ul>
            ) : (
              <p className="mt-2 text-sm" style={{ color: acq.muted }}>
                Pas encore de snapshot compte — Sync intelligence.
              </p>
            )}
          </div>
          <div className="rounded-2xl border p-4" style={{ borderColor: acq.warmBeigeDeep }}>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: acq.terracotta }}>
              Breakdowns ads (âge / genre / pays)
            </p>
            {age.length === 0 && gender.length === 0 && country.length === 0 ? (
              <p className="mt-2 text-sm" style={{ color: acq.muted }}>
                Zéros honnêtes : pas de dépense ads → pas de démographie pub. Tu peux quand même parler large (30–55, FR puis MX).
              </p>
            ) : (
              <div className="mt-2 space-y-2 text-sm" style={{ color: acq.ink }}>
                {age.length > 0 ? <p>Âge : {age.map((r) => `${r.key} (${r.impressions} imp.)`).join(' · ')}</p> : null}
                {gender.length > 0 ? <p>Genre : {gender.map((r) => `${r.key}`).join(' · ')}</p> : null}
                {country.length > 0 ? <p>Pays : {country.map((r) => r.key).join(' · ')}</p> : null}
              </div>
            )}
          </div>
        </div>
        <p className="mt-3 text-sm leading-relaxed" style={{ color: acq.muted }}>
          Lecture : ton audience IG est déjà « wellness / midlife ». En pub froide, élargis le message au-delà de « Pilates experte » pour toucher celles qui ont lâché seule — pas seulement les déjà converties Pilates.
        </p>
      </Section>

      <Section title="Conclusion — comment te vendre par la pub" testId="ads-marche-conclusion">
        <ol className="list-inside list-decimal space-y-2 text-sm leading-relaxed" style={{ color: acq.ink }}>
          {MARCHE_PUB_CONCLUSION.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ol>
        <p className="mt-4 text-[11px]" style={{ color: acq.mutedLight }}>
          {DOC_SOURCES_NOTE}
        </p>
      </Section>
    </div>
  );
}
