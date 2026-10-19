'use client';

export type DemoGift = {
  id: string;
  code: string;
  months: number;
  buyer: string;
  recipient: string;
  status: string;
  amount: string;
};

const DEMO: DemoGift[] = [
  { id: '1', code: 'FM-7K2Q-9XW4', months: 3, buyer: 'Sandrine', recipient: 'Julie', status: 'sent', amount: '109 €' },
  { id: '2', code: 'FM-3H8P-2LM5', months: 1, buyer: 'FitMangas', recipient: 'Léa', status: 'activated', amount: '39 €' },
];

export function AdminGiftsManager({ preview, rows = DEMO }: { preview?: boolean; rows?: DemoGift[] }) {
  return (
    <div className="luxury-shell admin-area min-h-screen px-6 py-10 md:pl-28">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-luxury-orange">Admin · Cartes cadeaux</p>
      <h1 className="mt-2 text-2xl font-semibold text-luxury-ink">Cartes cadeaux</h1>
      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        {[
          ['Vendues', '12'],
          ['En attente d’envoi', '2'],
          ['Activées', '7'],
          ['Remboursées', '0'],
        ].map(([l, n]) => (
          <div key={l} className="glass-card p-4">
            <p className="text-[11px] uppercase tracking-wider text-luxury-muted">{l}</p>
            <p className="mt-1 text-2xl font-semibold">{n}</p>
          </div>
        ))}
      </div>
      {preview ? <p className="mt-4 text-[13px] text-luxury-muted">Aperçu fictif — table `gift_cards` non créée (GO Lot 4).</p> : null}
      <div className="glass-card mt-6 overflow-x-auto">
        <table className="w-full text-left text-[13px]">
          <thead className="text-[11px] uppercase tracking-wider text-luxury-muted">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Mois</th>
              <th className="px-4 py-3">Acheteuse</th>
              <th className="px-4 py-3">Destinataire</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Montant</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-black/[0.06]">
                <td className="px-4 py-3 font-mono">{r.code}</td>
                <td className="px-4 py-3">{r.months}</td>
                <td className="px-4 py-3">{r.buyer}</td>
                <td className="px-4 py-3">{r.recipient}</td>
                <td className="px-4 py-3">{r.status}</td>
                <td className="px-4 py-3">{r.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-[12px] text-luxury-muted">Remboursement (14 j) et carte manuelle : actions serveur prêtes, inactives tant que SQL + Stripe test ne sont pas en place.</p>
    </div>
  );
}
