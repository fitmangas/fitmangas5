/**
 * Surfaces alignées sur GlassCard variant="dark" du dashboard :
 * rgba(29,29,31,0.78) + backdrop-filter blur(20px) — voir `.admin-calendar-surface` dans globals.css.
 */
export const ADMIN_SURFACE_BAR =
  'admin-calendar-surface border-b border-[rgba(255,255,255,0.22)]';

export const ADMIN_HEAD_TR = `${ADMIN_SURFACE_BAR} text-[10px] uppercase tracking-wider text-white/85`;

/** Champs formulaires admin */
export const ADMIN_FIELD_CLASS =
  'mt-2 w-full rounded-2xl border border-white/85 bg-white/55 px-4 py-3 text-sm text-luxury-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] outline-none focus:ring-2 focus:ring-[#C45D3E]/25';

/** CTA principal (terracotta) */
export const ADMIN_BTN_PRIMARY = 'btn-luxury-primary disabled:opacity-50';

/** Onglet / toggle actif */
export const ADMIN_TAB_ACTIVE =
  'bg-[#C9A96E]/35 text-[#2D2D2D] shadow-sm ring-1 ring-[#C9A96E]/50';
