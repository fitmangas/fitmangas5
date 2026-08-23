'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { createPromoCodeAction, deletePromoCodeAction } from '@/app/admin/promos/actions';
import { ADMIN_BTN_PRIMARY, ADMIN_FIELD_CLASS, ADMIN_HEAD_TR, ADMIN_SURFACE_BAR } from '@/components/Admin/adminSurfaceClasses';
import { formatPromoBenefitLabel, parsePromoMetadata, type PromoBenefitType } from '@/lib/promo-codes/types';

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
  metadata: unknown;
};

const fieldClass = ADMIN_FIELD_CLASS;
const primaryCtaClass = `${ADMIN_BTN_PRIMARY} px-7 py-3 text-[10px] font-bold uppercase tracking-widest`;

function defaultValidFromLocal(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export function PromoCodesManager({ promos }: { promos: PromoRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [okMessage, setOkMessage] = useState<string | null>(null);
  const [benefitType, setBenefitType] = useState<PromoBenefitType>('percent');
  const [unlimitedUsage, setUnlimitedUsage] = useState(false);

  return (
    <div className="space-y-8">
      <section className="glass-card border-white/80 bg-white/45 p-5 backdrop-blur-2xl md:p-6">
        <div className="mb-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-luxury-soft">Promotion</p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-luxury-ink">Nouveau code</h2>
          <p className="mt-2 text-xs text-luxury-muted">
            Champs obligatoires marqués * — le code est en majuscules. Chaque création génère aussi un coupon + code promo
            Stripe.
          </p>
        </div>

        <form
          className="grid gap-4 md:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const fd = new FormData(form);
            setErr(null);
            setOkMessage(null);
            const selectedBenefit = (fd.get('benefitType') as PromoBenefitType) || benefitType;
            const isUnlimited = fd.get('unlimitedUsage') === 'on';
            startTransition(async () => {
              try {
                const res = await createPromoCodeAction({
                  code: String(fd.get('code') ?? ''),
                  description: String(fd.get('description') ?? '') || null,
                  benefitType: selectedBenefit,
                  discountPercent:
                    selectedBenefit === 'percent' && fd.get('discountPercent')
                      ? Number(fd.get('discountPercent'))
                      : undefined,
                  freeMonths:
                    selectedBenefit === 'free_months' && fd.get('freeMonths')
                      ? Number(fd.get('freeMonths'))
                      : undefined,
                  unlimitedUsage: isUnlimited,
                  maxRedemptions: isUnlimited
                    ? null
                    : fd.get('maxRedemptions')
                      ? Number(fd.get('maxRedemptions'))
                      : null,
                  validFrom: String(fd.get('validFrom') ?? ''),
                  validUntil: String(fd.get('validUntil') ?? '') || null,
                  active: fd.get('active') === 'on',
                });
                if (!res.ok) {
                  setErr(res.message);
                  return;
                }
                if (form.isConnected) form.reset();
                setBenefitType('percent');
                setUnlimitedUsage(false);
                setOkMessage('Code créé et synchronisé avec Stripe.');
                router.refresh();
              } catch (caught) {
                setErr(caught instanceof Error ? caught.message : 'Erreur inattendue.');
              }
            });
          }}
        >
          {err ? (
            <div className="md:col-span-2 rounded-2xl border border-red-200/80 bg-red-50/90 px-4 py-3 text-sm text-red-900 backdrop-blur-sm">
              {err}
            </div>
          ) : null}
          {okMessage ? (
            <div className="md:col-span-2 rounded-2xl border border-emerald-200/80 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-900 backdrop-blur-sm">
              {okMessage}
            </div>
          ) : null}

          <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-luxury-soft">
            Code *
            <input name="code" required placeholder="FAMILLE1MOIS" className={`${fieldClass} font-mono uppercase`} />
          </label>

          <fieldset className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-luxury-soft">
            Type d&apos;avantage *
            <div className="mt-2 flex flex-wrap gap-3">
              <label className="flex cursor-pointer items-center gap-2 rounded-2xl border border-white/55 bg-white/35 px-4 py-3 text-xs normal-case tracking-normal text-luxury-ink backdrop-blur-md">
                <input
                  type="radio"
                  name="benefitType"
                  value="percent"
                  checked={benefitType === 'percent'}
                  onChange={() => setBenefitType('percent')}
                  className="size-4 text-luxury-orange focus:ring-luxury-orange/30"
                />
                Réduction (%)
              </label>
              <label className="flex cursor-pointer items-center gap-2 rounded-2xl border border-white/55 bg-white/35 px-4 py-3 text-xs normal-case tracking-normal text-luxury-ink backdrop-blur-md">
                <input
                  type="radio"
                  name="benefitType"
                  value="free_months"
                  checked={benefitType === 'free_months'}
                  onChange={() => setBenefitType('free_months')}
                  className="size-4 text-luxury-orange focus:ring-luxury-orange/30"
                />
                Mois gratuit(s)
              </label>
            </div>
          </fieldset>

          <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-luxury-soft md:col-span-2">
            Description
            <input
              name="description"
              placeholder="Famille / amis proches — test 1 mois offert"
              className={`${fieldClass} admin-form-refined`}
            />
          </label>

          {benefitType === 'percent' ? (
            <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-luxury-soft">
              Réduction (%) *
              <input
                name="discountPercent"
                type="number"
                min={1}
                max={100}
                step={1}
                required
                placeholder="10"
                className={fieldClass}
              />
            </label>
          ) : (
            <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-luxury-soft">
              Durée gratuite *
              <select name="freeMonths" required defaultValue="1" className={fieldClass}>
                <option value="1">1 mois gratuit</option>
                <option value="2">2 mois gratuits</option>
                <option value="3">3 mois gratuits</option>
              </select>
            </label>
          )}

          <div className="space-y-3">
            <label className="flex items-center gap-3 rounded-2xl border border-white/55 bg-white/35 px-4 py-3 text-sm text-luxury-ink backdrop-blur-md">
              <input
                name="unlimitedUsage"
                type="checkbox"
                checked={unlimitedUsage}
                onChange={(e) => setUnlimitedUsage(e.target.checked)}
                className="size-4 rounded border-white/60 text-luxury-orange focus:ring-luxury-orange/30"
              />
              Utilisations illimitées
            </label>
            {!unlimitedUsage ? (
              <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-luxury-soft">
                Max utilisations *
                <input name="maxRedemptions" type="number" min={1} required placeholder="50" className={fieldClass} />
              </label>
            ) : null}
          </div>

          <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-luxury-soft">
            Valide depuis *
            <input name="validFrom" type="datetime-local" required defaultValue={defaultValidFromLocal()} className={fieldClass} />
          </label>

          <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-luxury-soft">
            Valide jusqu&apos;au
            <input name="validUntil" type="datetime-local" className={fieldClass} />
          </label>

          <label className="flex items-center gap-3 rounded-2xl border border-white/55 bg-white/35 px-4 py-3 text-sm text-luxury-ink backdrop-blur-md md:col-span-2">
            <input
              name="active"
              type="checkbox"
              defaultChecked
              className="size-4 rounded border-white/60 text-luxury-orange focus:ring-luxury-orange/30"
            />
            Code actif dès la création
          </label>

          <div className="md:col-span-2">
            <button type="submit" disabled={pending} className={primaryCtaClass}>
              {pending ? 'Création…' : 'Créer'}
            </button>
          </div>
        </form>
      </section>

      <section className="glass-card glass-card--dark overflow-hidden">
        <div className={`${ADMIN_SURFACE_BAR} px-6 py-4`}>
          <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-white/90">Codes existants</h3>
          <p className="mt-1 text-[11px] text-white/50">Synchronisés avec Stripe — compteur d&apos;utilisations mis à jour au paiement.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className={ADMIN_HEAD_TR}>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Avantage</th>
                <th className="px-4 py-3">Utilisations</th>
                <th className="px-4 py-3">Valide</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="text-white/90">
              {promos.map((p) => {
                const meta = parsePromoMetadata(p.metadata);
                const benefitLabel = formatPromoBenefitLabel(meta, Number(p.discount_percent));
                const stripeOk = Boolean(meta.stripe_promotion_code_id);
                return (
                  <tr key={p.id} className="border-b border-white/10 transition hover:bg-white/[0.06]">
                    <td className="px-4 py-3 font-mono font-semibold">{p.code}</td>
                    <td className="px-4 py-3">
                      {benefitLabel}
                      {!stripeOk ? (
                        <span className="ml-2 text-[10px] text-amber-300">(Stripe manquant)</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {p.redeemed_count}
                      {p.max_redemptions != null ? ` / ${p.max_redemptions}` : ' / ∞'}
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
                            setErr(null);
                            setOkMessage(null);
                            try {
                              const res = await deletePromoCodeAction(p.id);
                              if (!res.ok) {
                                setErr(res.message);
                                return;
                              }
                              setOkMessage('Code désactivé dans Stripe et retiré de la liste.');
                              router.refresh();
                            } catch (caught) {
                              setErr(caught instanceof Error ? caught.message : 'Suppression impossible.');
                            }
                          })
                        }
                        className="text-xs font-medium text-red-300 underline-offset-4 transition hover:text-red-100 hover:underline disabled:opacity-50"
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                );
              })}
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
