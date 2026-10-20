import Link from 'next/link';

import { ManageCookiesButton } from '@/components/Marketing/ManageCookiesButton';
import { A_VALIDER_LOT1 } from '@/content/a-valider';

/** Pied de page sobre des pages publiques secondaires (maquette D08). */
export function PublicSiteFooter({ lang = 'fr' }: { lang?: 'fr' | 'es' }) {
  const es = lang === 'es';
  return (
    <footer className="border-t border-brand-ink/[0.06] bg-white/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 text-[12.5px] text-brand-ink/55 md:flex-row md:items-center md:justify-between md:px-8">
        <p>© {new Date().getFullYear()} FitMangas · {es ? 'Pilates y Barre en visio con Alejandra' : 'Pilates & Barre en visio avec Alejandra'}</p>
        <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label={es ? 'Información legal' : 'Informations légales'}>
          <Link href="/terms" className="hover:text-brand-ink">
            {es ? 'Condiciones' : 'CGV'}
          </Link>
          <Link href="/privacy" className="hover:text-brand-ink">
            {es ? 'Privacidad' : 'Confidentialité'}
          </Link>
          <Link href="/mentions-legales" className="hover:text-brand-ink">
            {es ? 'Aviso legal' : 'Mentions légales'}
          </Link>
          <ManageCookiesButton label={A_VALIDER_LOT1.cookies.manage[lang]} className="hover:text-brand-ink" />
        </nav>
      </div>
    </footer>
  );
}
