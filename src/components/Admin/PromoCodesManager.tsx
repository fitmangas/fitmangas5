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

const ADMIN_TABLE_HEAD_ROW =
  'border-b border-white/10 bg-[rgba(29,29,31,0.78)] text-[10px] uppercase tracking-wider text-white/80 backdrop-blur-md';

const fieldClass =
  'mt-2 w-full rounded-2xl border border-white/85 bg-white/55 px-4 py-3 text-sm text-luxury-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] outline-none focus:ring-2 focus:ring-[#ff7a00]/25';

const primaryCtaClass =
  'rounded-full bg-[#ff7a00] px-7 py-3 text-[10px] font-bold uppercase tracking-widest text-white shadow-[0_0_0_1px_rgba(255,255,255,0.25)_inset,0_8px_26px_rgba(255,122,0,0.45)] transition hover:-translate-y-0.5 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.25)_inset,0_12px_32px_rgba(255,122,0,0.58)] disabled:opacity-50';

export function PromoCodesManager({ promos }: { promos: PromoRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      <section className="glass-card border-white/80 bg-white/45 p-5 backdrop-blur-2xl md:p-6">
        <div className="mb-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-luxury-soft">Promotion</p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-luxury-ink">Nouveau code</h2>
          <p className="mt-2 text-xs text-luxury-muted">Champs obligatoires marqués * — le code est en majuscules.</p>
        </div>

        <form
          className="grid gap-4 md:grid-cols-2"
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
          {err ? (
            <div className="md:col-span-2 rounded-2xl border border-red-200/80 bg-red-50/90 px-4 py-3 text-sm text-red-900 backdrop-blur-sm">
              {err}
            </div>
          ) : null}

          <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-luxury-soft">
            Code *
            <input name="code" required placeholder="CODE" className={`${fieldClass} font-mono uppercase`} />
          </label>

          <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-luxury-soft md:col-span-2">
            Description
            <input name="description" placeholder="Usage interne, note…" className={fieldClass} />
          </label>

          <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-luxury-soft">
            Réduction (%) *
            <input name="discountPercent" type="number" min={0} max={100} step={1} required placeholder="%" className={fieldClass} />
          </label>

          <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-luxury-soft">
            Max utilisations
            <input name="maxRedemptions" type="number" min={1} placeholder="Vide = illimité" className={fieldClass} />
          </label>

          <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-luxury-soft">
            Valide depuis *
            <input name="validFrom" type="datetime-local" required className={fieldClass} />
          </label>

          <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-luxury-soft">
            Valide jusqu’au
            <input name="validUntil" type="datetime-local" className={fieldClass} />
          </label>

          <label className="flex items-center gap-3 rounded-2xl border border-white/55 bg-white/35 px-4 py-3 text-sm text-luxury-ink backdrop-blur-md md:col-span-2">
            <input name="active" type="checkbox" defaultChecked className="size-4 rounded border-white/60 text-[#ff7a00] focus:ring-[#ff7a00]/30" />
            Code actif dès la création
          </label>

          <div className="md:col-span-2">
            <button type="submit" disabled={pending} className={primaryCtaClass}>
              Créer
            </button>
          </div>
        </form>
      </section>

      <section className="glass-card glass-card--dark overflow-hidden">
        <div className="border-b border-white/10 px-6 py-4 backdrop-blur-md">
          <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-white/90">Codes existants</h3>
          <p className="mt-1 text-[11px] text-white/50">Récapitulatif — même style que les tableaux premium du dashboard.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className={ADMIN_TABLE_HEAD_ROW}>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">%</th>
                <th className="px-4 py-3">Utilisations</th>
                <th className="px-4 py-3">Valide</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="text-white/90">
              {promos.map((p) => (
                <tr key={p.id} className="border-b border-white/10 transition hover:bg-white/[0.06]">
                  <td className="px-4 py-3 font-mono font-semibold">{p.code}</td>
                  <td className="px-4 py-3 tabular-nums">{Number(p.discount_percent)}%</td>
                  <td className="px-4 py-3 tabular-nums">
                    {p.redeemed_count}
                    {p.max_redemptions != null ? ` / ${p.max_redemptions}` : ''}
                  </td>
                  <td className="px-4 py-3 text-xs text-white/75">
                    {p.active ? <span className="text-emerald-300">oui</span> : <span className="text-white/45">non</span>}
                    {' · '}
                    {p.valid_until ? new Date(p.valid_until).toLocaleDateString('fr-FR') : 'sans fin'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() =>
                        startTransition(async () => {
                          await deletePromoCodeAction(p.id);
                          router.refresh();
                        })
                      }
                      className="text-xs font-medium text-red-300 underline-offset-4 transition hover:text-red-100 hover:underline disabled:opacity-50"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
              {promos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-white/50">
                    Aucun code promo. Crée-en un ci-dessus.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
