'use client';

import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';
import { ArrowLeft, X } from 'lucide-react';

import type { NotifObservabilitySummary, NotifTypeKey } from '@/lib/admin/notification-observability-shared';
import { NOTIF_TYPE_LABELS } from '@/lib/admin/notification-observability-shared';
import {
  listNotificationTemplateCatalog,
  renderCatalogTemplatePreview,
  type NotifTemplateCatalogItem,
  type TemplatePreviewResult,
} from '@/lib/admin/notification-templates-catalog';

const GROUP_ORDER: NotifTypeKey[] = [
  'in_app',
  'email_courses',
  'email_content',
  'email_shop',
  'email_community',
  'email_newsletter',
  'email_transactional',
];

export function AdminNotificationsPageClient({
  initialSummary,
}: {
  initialSummary: NotifObservabilitySummary;
}) {
  const [period, setPeriod] = useState<'month' | 'all'>(initialSummary.period);
  const [summary, setSummary] = useState(initialSummary);
  const [pending, startTransition] = useTransition();
  const [previewItem, setPreviewItem] = useState<NotifTemplateCatalogItem | null>(null);
  const [preview, setPreview] = useState<TemplatePreviewResult | null>(null);

  const catalog = useMemo(() => listNotificationTemplateCatalog(), []);

  const statsByGroup = useMemo(() => {
    const map = new Map(summary.types.map((t) => [t.key, t]));
    return map;
  }, [summary.types]);

  function switchPeriod(next: 'month' | 'all') {
    if (next === period) return;
    setPeriod(next);
    startTransition(async () => {
      const res = await fetch(`/api/admin/notifications/observability?period=${next}`);
      if (!res.ok) return;
      setSummary((await res.json()) as NotifObservabilitySummary);
    });
  }

  function openTemplate(item: NotifTemplateCatalogItem) {
    setPreviewItem(item);
    setPreview(renderCatalogTemplatePreview(item));
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 pb-24 pt-6 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-luxury-muted hover:text-luxury-ink"
          >
            <ArrowLeft size={14} /> Dashboard
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-luxury-ink">Notifications &amp; emails</h1>
          <p className="mt-1 text-sm text-luxury-muted">
            {pending ? '…' : summary.totalTracked} envois suivis · {summary.periodLabel}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => switchPeriod('month')}
            className={`rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] ${
              period === 'month' ? 'bg-[#C45D3E] text-white' : 'border border-[#E8D9C8] text-luxury-muted'
            }`}
          >
            Mois en cours
          </button>
          <button
            type="button"
            onClick={() => switchPeriod('all')}
            className={`rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] ${
              period === 'all' ? 'bg-[#C45D3E] text-white' : 'border border-[#E8D9C8] text-luxury-muted'
            }`}
          >
            Tout
          </button>
        </div>
      </div>

      {summary.gaps.length ? (
        <ul className="space-y-1 rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-[12px] text-amber-900">
          {summary.gaps.map((g) => (
            <li key={g}>⚠ {g}</li>
          ))}
        </ul>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2">
        {GROUP_ORDER.map((key) => {
          const stat = statsByGroup.get(key);
          return (
            <div
              key={key}
              className="rounded-2xl border border-[#E8D9C8]/80 bg-white/80 px-4 py-3 shadow-sm"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-luxury-soft">
                {NOTIF_TYPE_LABELS[key]}
              </p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-luxury-ink">
                {stat?.tracked ? (stat.count ?? '—') : 'n/d'}
              </p>
              <p className="mt-1 text-[11px] text-luxury-muted">
                {stat?.lastSentAt
                  ? `Dernier : ${new Date(stat.lastSentAt).toLocaleString('fr-FR')}`
                  : 'Aucun envoi suivi'}
              </p>
            </div>
          );
        })}
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-luxury-soft">
          Templates (aperçu réel)
        </h2>
        <p className="mt-1 text-xs text-luxury-muted">
          Clique un template pour voir exactement ce que reçoit la cliente (email complet ou notif in-app).
        </p>
        <div className="mt-4 space-y-6">
          {GROUP_ORDER.map((group) => {
            const items = catalog.filter((c) => c.group === group);
            if (!items.length) return null;
            return (
              <div key={group}>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7a2e1a]">
                  {NOTIF_TYPE_LABELS[group]}
                </p>
                <div className="space-y-2">
                  {items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => openTemplate(item)}
                      className="flex w-full items-start justify-between gap-3 rounded-2xl border border-[#E8D9C8]/80 bg-[#FBF7F2]/70 px-4 py-3 text-left transition hover:border-[#C45D3E]/45"
                    >
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-luxury-ink">{item.label}</p>
                        {item.description ? (
                          <p className="mt-0.5 text-[11px] text-luxury-muted">{item.description}</p>
                        ) : null}
                        {!item.trackedInLog && item.missingReason ? (
                          <p className="mt-1 text-[11px] text-amber-800">n/d — {item.missingReason}</p>
                        ) : null}
                      </div>
                      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7a2e1a]">
                        Aperçu
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {preview && previewItem ? (
        <div
          className="fixed inset-0 z-[220] flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => {
            setPreview(null);
            setPreviewItem(null);
          }}
        >
          <div
            className="max-h-[92vh] w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-black/5 px-4 py-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7a2e1a]">
                  Aperçu cliente
                </p>
                <p className="text-sm font-semibold text-luxury-ink">{previewItem.label}</p>
              </div>
              <button
                type="button"
                className="rounded-full border border-[#E8D9C8] p-2"
                onClick={() => {
                  setPreview(null);
                  setPreviewItem(null);
                }}
                aria-label="Fermer"
              >
                <X size={16} />
              </button>
            </div>
            <div className="max-h-[78vh] overflow-y-auto p-4">
              {preview.kind === 'missing' ? (
                <p className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900">
                  {preview.note}
                </p>
              ) : null}
              {preview.kind === 'in_app' ? (
                <div className="mx-auto max-w-sm rounded-2xl border border-[#E8D9C8] bg-[#FBF7F2] p-4 shadow-sm">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-luxury-soft">
                    Cloche FitMangas
                  </p>
                  <p className="mt-2 text-sm font-semibold text-luxury-ink">{preview.title}</p>
                  {preview.body ? <p className="mt-1 text-sm text-luxury-muted">{preview.body}</p> : null}
                </div>
              ) : null}
              {preview.kind === 'email' || preview.kind === 'newsletter' ? (
                <div>
                  <p className="mb-2 text-[12px] text-luxury-muted">
                    Objet : <strong className="text-luxury-ink">{preview.subject}</strong>
                  </p>
                  {preview.note ? (
                    <p className="mb-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
                      {preview.note}
                    </p>
                  ) : null}
                  <iframe
                    title="Aperçu email"
                    srcDoc={preview.html || '<p>Email vide</p>'}
                    className="h-[65vh] w-full rounded-xl border border-[#E8D9C8] bg-white"
                    sandbox=""
                  />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
