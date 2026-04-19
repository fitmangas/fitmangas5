'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { createPromoCodeAction, deletePromoCodeAction } from '@/app/admin/promos/actions';

export type PromoRow = {
  id: string;
  code: string;
  description: string | null;
  discount_percent: number;
  max_redemptions: number | null;
  redeemed_count: number;
  valid_from: string;
  valid_until: string | null;
  active: boolean;
};

export function PromoCodesManager({ promos }: { promos: PromoRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  return (
    <div className="space-y-10">
      <form
        className="max-w-lg space-y-3 rounded-lg border border-neutral-200 bg-white p-6"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          setErr(null);
          startTransition(async () => {
            const res = await createPromoCodeAction({
              code: String(fd.get('code') ?? ''),
              description: String(fd.get('description') ?? '') || null,
              discountPercent: Number(fd.get('discountPercent')),
              maxRedemptions: fd.get('maxRedemptions') ? Number(fd.get('maxRedemptions')) : null,
              validFrom: String(fd.get('validFrom') ?? ''),
              validUntil: String(fd.get('validUntil') ?? '') || null,
              active: fd.get('active') === 'on',
            });
            if (!res.ok) setErr(res.message);
            else router.refresh();
          });
        }}
      >
        <h2 className="text-sm font-semibold text-neutral-900">Nouveau code</h2>
        {err ? <p className="text-sm text-red-600">{err}</p> : null}
        <input name="code" required placeholder="CODE" className="mt-2 w-full rounded border border-neutral-200 px-3 py-2 text-sm uppercase" />
        <input name="description" placeholder="Description" className="mt-2 w-full rounded border border-neutral-200 px-3 py-2 text-sm" />
        <div className="flex gap-2">
          <input
            name="discountPercent"
            type="number"
            min={0}
            max={100}
            step={1}
            required
            placeholder="%"
            className="mt-2 w-24 rounded border border-neutral-200 px-3 py-2 text-sm"
          />
          <input
            name="maxRedemptions"
            type="number"
            min={1}
            placeholder="Max utilisations (vide = illimité)"
            className="mt-2 flex-1 rounded border border-neutral-200 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex gap-2">
          <input name="validFrom" type="datetime-local" required className="mt-2 flex-1 rounded border border-neutral-200 px-3 py-2 text-sm" />
          <input name="validUntil" type="datetime-local" className="mt-2 flex-1 rounded border border-neutral-200 px-3 py-2 text-sm" />
        </div>
        <label className="mt-2 flex items-center gap-2 text-sm">
          <input name="active" type="checkbox" defaultChecked className="rounded" />
          Actif
        </label>
        <button
          type="submit"
          disabled={pending}
          className="mt-4 rounded bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Créer
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase text-neutral-600">
            <tr>
              <th className="px-3 py-2">Code</th>
              <th className="px-3 py-2">%</th>
              <th className="px-3 py-2">Utilisations</th>
              <th className="px-3 py-2">Valide</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {promos.map((p) => (
              <tr key={p.id} className="border-b border-neutral-100">
                <td className="px-3 py-2 font-mono font-semibold">{p.code}</td>
                <td className="px-3 py-2">{Number(p.discount_percent)}%</td>
                <td className="px-3 py-2">
                  {p.redeemed_count}
                  {p.max_redemptions != null ? ` / ${p.max_redemptions}` : ''}
                </td>
                <td className="px-3 py-2">
                  {p.active ? 'oui' : 'non'} ·{' '}
                  {p.valid_until ? new Date(p.valid_until).toLocaleDateString('fr-FR') : 'sans fin'}
                </td>
                <td className="px-3 py-2 text-right">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        await deletePromoCodeAction(p.id);
                        router.refresh();
                      })
                    }
                    className="text-xs text-red-600 underline disabled:opacity-50"
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
