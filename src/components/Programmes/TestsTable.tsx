export function TestsTable({
  rows,
}: {
  rows: Array<{ label: string; start?: string; end?: string }>;
}) {
  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="text-[11px] uppercase tracking-[0.14em] text-luxury-soft">
          <th className="py-2">Mesure</th>
          <th className="py-2">Départ</th>
          <th className="py-2">Fin</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.label} className="border-t border-black/[0.06]">
            <td className="py-2.5 text-luxury-ink">{r.label}</td>
            <td className="py-2.5 tabular-nums">{r.start ?? '—'}</td>
            <td className="py-2.5 tabular-nums">{r.end ?? '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
