import { redirect } from 'next/navigation';

/** Ancienne URL — le dashboard pointe désormais vers le hub. */
export default function CompteProgressionRedirect() {
  redirect('/compte/connaissance-de-soi/progression');
}
