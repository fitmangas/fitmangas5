'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import {
  CalendarDays,
  PlayCircle,
  Film,
  LineChart,
  MapPin,
  Users,
  User,
  ShoppingBag,
  Check,
  X,
  type LucideIcon,
} from 'lucide-react';
import type { Course, Language } from '@/types';

const PILLAR_CARD_CLASS =
  'flex flex-col gap-1.5 rounded-[20px] border border-[#E5D5C0] bg-white/75 p-3 shadow-[0_4px_16px_rgba(243,197,142,0.16),0_2px_8px_rgba(31,27,22,0.07)] md:gap-2 md:rounded-3xl md:p-4';

type Props = {
  course: Course;
  lang: Language;
  onsiteCityLabel?: string;
};

function isVisioOffer(course: Course): boolean {
  return course.id.startsWith('v-');
}

function isGroupOnsite(course: Course): boolean {
  return course.id.endsWith('-coll');
}

function FeaturePillar({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
}) {
  return (
    <div className={PILLAR_CARD_CLASS}>
      <Icon size={16} className="text-brand-accent/60 md:h-[18px] md:w-[18px]" aria-hidden />
      <div>
        <p className="text-[9px] font-bold uppercase tracking-wider text-brand-ink/70 md:text-[10px]">{title}</p>
        <p className="mt-0.5 text-[10px] leading-snug text-brand-ink/45 md:text-[11px]">{subtitle}</p>
      </div>
    </div>
  );
}

function ExpandablePanel({
  triggerLabel,
  children,
  panelId,
}: {
  triggerLabel: string;
  children: ReactNode;
  panelId: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (rootRef.current && !rootRef.current.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="relative mt-3 md:mt-4"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-1.5 rounded-full border border-brand-ink/[0.08] bg-brand-beige/30 px-3 py-1.5 text-[10px] font-semibold tracking-wide text-brand-ink/65 transition hover:border-brand-accent/25 hover:bg-brand-sand/20 hover:text-brand-ink"
        aria-expanded={open}
        aria-controls={panelId}
      >
        <Check size={11} className="text-brand-accent/80" aria-hidden />
        {triggerLabel}
      </button>
      {open ? (
        <div
          id={panelId}
          className="relative mt-2 rounded-2xl border border-brand-ink/[0.06] bg-white p-4 shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
          role="region"
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-2 top-2 rounded-full p-1 text-brand-ink/35 transition hover:bg-brand-sand/30 hover:text-brand-ink"
            aria-label="Fermer"
          >
            <X size={14} />
          </button>
          {children}
        </div>
      ) : null}
    </div>
  );
}

function copy(lang: Language, onsiteCityLabel: string, course: Course) {
  const isGroup = isGroupOnsite(course);
  if (lang === 'ES') {
    return {
      visioPillars: [
        { title: 'Clases LIVE cada semana', subtitle: '2 lives FR por semana' },
        { title: 'Replay ilimitado', subtitle: 'Todos los lives, a la carta' },
        { title: 'Biblioteca 25h+', subtitle: 'Pilates, Barre, Stretch — 24h/24' },
        { title: 'Seguimiento de progreso', subtitle: 'En 3 niveles' },
      ],
      visioIncludedTrigger: 'Y además',
      visioIncludedItems: [
        'Bonus: 2 lives adicionales en español / semana',
        'Programas de entrenamiento estructurados todo el año',
        'Blog bienestar — 8 artículos nuevos al mes',
        'Tienda fitness integrada',
      ],
      onsitePillars: [
        { title: 'Coaching en persona', subtitle: `Correcciones directas en el estudio, ${onsiteCityLabel}` },
        {
          title: 'Formato',
          subtitle: isGroup ? 'En grupo reducido' : 'Sesión 100% individual',
        },
        { title: 'Tienda y comunidad', subtitle: 'Tienda fitness + grupo WhatsApp' },
      ],
    };
  }
  return {
    visioPillars: [
      { title: 'Cours live chaque semaine', subtitle: '2 lives FR par semaine' },
      { title: 'Replay illimité', subtitle: 'Tous les lives, à la demande' },
      { title: 'Bibliothèque 25h+', subtitle: 'Pilates, Barre, Stretch — 24h/24' },
      { title: 'Suivi de progression', subtitle: 'Sur 3 niveaux' },
    ],
    visioIncludedTrigger: 'Et aussi',
    visioIncludedItems: [
      'Bonus : 2 lives supplémentaires en espagnol / semaine',
      "Programmes d'entraînement structurés toute l'année",
      'Blog bien-être — 8 nouveaux articles par mois',
      'Boutique fitness intégrée',
    ],
    onsitePillars: [
      { title: 'Coaching en personne', subtitle: `Corrections directes au studio, ${onsiteCityLabel}` },
      {
        title: 'Format',
        subtitle: isGroup ? 'En petit groupe' : 'Séance 100% individuelle',
      },
      { title: 'Boutique & communauté', subtitle: 'Boutique fitness + groupe WhatsApp' },
    ],
  };
}

export function OfferCardFeatures({ course, lang, onsiteCityLabel = 'Nantes' }: Props) {
  const panelId = useId();
  const t = copy(lang, onsiteCityLabel, course);

  if (isVisioOffer(course)) {
    const icons = [CalendarDays, PlayCircle, Film, LineChart] as const;
    return (
      <div>
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          {t.visioPillars.map((pillar, index) => (
            <FeaturePillar key={pillar.title} icon={icons[index]} title={pillar.title} subtitle={pillar.subtitle} />
          ))}
        </div>
        <ExpandablePanel triggerLabel={t.visioIncludedTrigger} panelId={panelId}>
          <ul className="space-y-2 pr-6 text-[11px] leading-relaxed text-brand-ink/65 md:text-xs">
            {t.visioIncludedItems.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <Check size={12} className="mt-0.5 shrink-0 text-brand-accent/70" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </ExpandablePanel>
      </div>
    );
  }

  const onsiteIcons = [MapPin, isGroupOnsite(course) ? Users : User, ShoppingBag] as const;
  return (
    <div className="grid grid-cols-2 gap-3 md:gap-4">
      {t.onsitePillars.map((pillar, index) => (
        <FeaturePillar key={pillar.title} icon={onsiteIcons[index]} title={pillar.title} subtitle={pillar.subtitle} />
      ))}
    </div>
  );
}
