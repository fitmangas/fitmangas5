/**
 * Surfaces alignées sur GlassCard variant="dark" du dashboard :
 * rgba(29,29,31,0.78) + backdrop-filter blur(20px) — voir `.admin-calendar-surface` dans globals.css.
 */
export const ADMIN_SURFACE_BAR =
  'admin-calendar-surface border-b border-[rgba(255,255,255,0.22)]';

export const ADMIN_HEAD_TR = `${ADMIN_SURFACE_BAR} text-[10px] uppercase tracking-wider text-white/85`;

/** Champs formulaires admin — fond blanc franc + bordure visible pour bien détacher du fond */
export const ADMIN_FIELD_CLASS =
  'mt-2 w-full rounded-2xl border border-[#D9C9B4] bg-white px-4 py-3 text-sm text-luxury-ink shadow-[inset_0_1px_3px_rgba(31,27,22,0.08)] outline-none focus:border-[#C45D3E]/60 focus:ring-2 focus:ring-[#C45D3E]/25';

/** CTA principal (terracotta) */
export const ADMIN_BTN_PRIMARY = 'btn-luxury-primary disabled:opacity-50';

/** Onglet / toggle actif */
export const ADMIN_TAB_ACTIVE =
  'bg-[#C9A96E]/35 text-[#2D2D2D] shadow-sm ring-1 ring-[#C9A96E]/50';

/** Panneau / encadré admin (formulaire, liste) — relief + typo cohérente */
export const ADMIN_PANEL_CLASS =
  'glass-card admin-form-refined border border-white/70 bg-white/52 p-5 shadow-[0_14px_36px_rgba(31,27,22,0.18),0_34px_64px_-24px_rgba(21,18,15,0.38),0_2px_8px_rgba(31,27,22,0.1)] backdrop-blur-2xl';

/** Carte mobile dans une liste admin */
export const ADMIN_LIST_CARD_CLASS =
  'admin-form-refined rounded-2xl border border-white/55 bg-white/45 p-4 text-sm text-luxury-ink shadow-[0_12px_30px_rgba(31,27,22,0.16),0_24px_48px_-22px_rgba(21,18,15,0.32),0_1px_4px_rgba(31,27,22,0.08)]';
