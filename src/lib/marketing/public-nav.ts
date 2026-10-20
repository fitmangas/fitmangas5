import { isGiftsEnabled } from '@/lib/gifts/flag';
import { isProgrammesEnabled } from '@/lib/programmes/flag';

export type PublicNavItem = {
  href: string;
  labelFr: string;
  labelEs: string;
  badge?: string;
  badgeEs?: string;
};

export function publicNavItems(opts?: { gifts?: boolean; levelTest?: boolean }): PublicNavItem[] {
  const gifts = opts?.gifts ?? isGiftsEnabled();
  const levelTest = opts?.levelTest ?? isProgrammesEnabled();
  const items: PublicNavItem[] = [
    { href: '/cours-pilates-visio', labelFr: 'Les cours', labelEs: 'Las clases' },
    { href: '/#tarifs', labelFr: 'Tarifs', labelEs: 'Tarifas' },
  ];
  if (levelTest) {
    items.push({ href: '/test-niveau', labelFr: 'Test de niveau', labelEs: 'Test de nivel' });
  }
  items.push({ href: '/blog', labelFr: 'Blog', labelEs: 'Blog' });
  if (gifts) {
    items.push({ href: '/offrir', labelFr: 'Offrir', labelEs: 'Regalar', badge: 'Nouveau', badgeEs: 'Nuevo' });
  }
  return items;
}

export function slugifyProductName(name: string, id: number): string {
  const base = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
  return `${base || 'produit'}-${id}`;
}
