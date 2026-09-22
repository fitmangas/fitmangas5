import { redirect } from 'next/navigation';

/** Compat : ancienne URL santé → Mon corps */
export default function SanteRedirect() {
  redirect('/compte/connaissance-de-soi/corps');
}
