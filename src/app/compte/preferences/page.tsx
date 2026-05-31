import { redirect } from 'next/navigation';

/** Ancienne URL — tout est regroupé sur /compte/profil. */
export default function PreferencesRedirectPage() {
  redirect('/compte/profil#notifications');
}
