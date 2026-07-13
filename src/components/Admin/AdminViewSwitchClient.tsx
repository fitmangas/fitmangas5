'use client';

type Props = {
  clientView: boolean;
};

export function getAdminViewSwitchConfig(clientView: boolean) {
  const href = clientView ? '/api/demo-mode/disable' : '/api/demo-mode/enable';
  const label = clientView ? 'Vue admin' : 'Passer en vue client';
  const menuLabel = clientView ? 'Vue admin' : 'Vue client';
  const title = clientView
    ? 'Revenir au dashboard admin (/admin)'
    : 'Voir l’espace client comme une cliente (/compte)';
  return { href, label, menuLabel, title };
}

/** Lien menu (dashboard admin) — même navigation que l’ancien bouton flottant. */
export function AdminViewSwitchMenuLink({
  clientView,
  className = 'mt-1 block rounded-2xl px-4 py-2 text-sm text-luxury-ink transition hover:bg-white/70',
}: Props & { className?: string }) {
  const { href, menuLabel, title } = getAdminViewSwitchConfig(clientView);
  return (
    <a href={href} className={className} title={title}>
      {menuLabel}
    </a>
  );
}

/** Navigation document complète (pas Link) — les routes API posent un cookie puis redirigent vers /compte ou /admin. */
export function AdminViewSwitchClient({ clientView }: Props) {
  const { href, label, title } = getAdminViewSwitchConfig(clientView);

  return (
    <a
      href={href}
      className="fixed bottom-4 right-4 z-[210] max-w-[9.5rem] rounded-full border border-white/70 bg-white/90 px-3 py-1.5 text-center text-xs font-bold uppercase leading-tight tracking-[0.1em] text-luxury-ink shadow-[0_10px_28px_rgba(15,23,42,0.14)] backdrop-blur transition hover:-translate-y-0.5 hover:border-luxury-orange/40 md:hidden"
      title={title}
    >
      {label}
    </a>
  );
}
