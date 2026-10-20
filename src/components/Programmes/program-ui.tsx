import {
  Activity,
  Crosshair,
  Dumbbell,
  Feather,
  Flame,
  HeartPulse,
  Leaf,
  Moon,
  Mountain,
  MoveDiagonal2,
  Music,
  PersonStanding,
  Repeat,
  Scale,
  ShieldCheck,
  Smile,
  Sparkles,
  Sprout,
  Sunrise,
  Target,
  Timer,
  Wind,
  Zap,
  type LucideIcon,
} from 'lucide-react';

import { LEVELS_TEXT } from '@/lib/programmes/texts';

/** Icônes des bénéfices du catalogue (noms lucide en kebab-case). */
const BENEFIT_ICONS: Record<string, LucideIcon> = {
  activity: Activity,
  crosshair: Crosshair,
  dumbbell: Dumbbell,
  feather: Feather,
  flame: Flame,
  'heart-pulse': HeartPulse,
  leaf: Leaf,
  moon: Moon,
  mountain: Mountain,
  'move-diagonal-2': MoveDiagonal2,
  music: Music,
  'person-standing': PersonStanding,
  repeat: Repeat,
  scale: Scale,
  'shield-check': ShieldCheck,
  smile: Smile,
  sparkles: Sparkles,
  sprout: Sprout,
  sunrise: Sunrise,
  target: Target,
  timer: Timer,
  wind: Wind,
  zap: Zap,
};

export function BenefitIcon({ name, size = 16 }: { name?: string | null; size?: number }) {
  const Icon = (name && BENEFIT_ICONS[name]) || Sparkles;
  return <Icon size={size} aria-hidden />;
}

export const LEVELS = LEVELS_TEXT;

export const GOAL_LABELS: Record<string, { fr: string; es: string }> = {
  debuter: { fr: 'Débuter en douceur', es: 'Empezar con calma' },
  tonifier: { fr: 'Tonifier', es: 'Tonificar' },
  dos: { fr: 'Dos & posture', es: 'Espalda y postura' },
  cardio: { fr: 'Cardio', es: 'Cardio' },
  souplesse: { fr: 'Souplesse', es: 'Flexibilidad' },
  express: { fr: 'Peu de temps', es: 'Poco tiempo' },
};

/** Pastille de niveau (barres ; feuille pour « Tous niveaux »). */
export function ProgramLevelPill({ level, lang = 'fr', className = '' }: { level: number; lang?: 'fr' | 'es'; className?: string }) {
  const label = LEVELS[level]?.[lang] ?? '';
  return (
    <span className={`fm-level fm-level--${level} ${className}`}>
      {level ? (
        <span className="fm-level__bars" aria-hidden>
          <i />
          <i />
          <i />
        </span>
      ) : (
        <Leaf size={12} strokeWidth={2.2} aria-hidden />
      )}
      {label}
    </span>
  );
}

export function mmss(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}` : `${m}:${String(r).padStart(2, '0')}`;
}
