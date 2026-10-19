import { LevelTestClient } from '@/components/Programmes/LevelTestClient';
import { isProgrammesEnabled } from '@/lib/programmes/flag';
import { notFound } from 'next/navigation';

export default function TestNiveauPage() {
  if (!isProgrammesEnabled()) notFound();
  return (
    <main className="luxury-shell min-h-screen px-4 py-16">
      <LevelTestClient />
    </main>
  );
}
