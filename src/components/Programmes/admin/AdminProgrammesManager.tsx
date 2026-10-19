'use client';

import { useMemo, useState } from 'react';
import {
  CheckCheck,
  ChevronDown,
  CircleCheck,
  Crosshair,
  Eye,
  EyeOff,
  GripVertical,
  Plus,
  Radio,
  Search,
  Trash2,
  TriangleAlert,
  X,
} from 'lucide-react';

import {
  DEMO_ADMIN_STATS,
  type AdminProgramListItem,
  type AdminVideoOption,
} from './demo-data';
import { saveProgramStepAction, setProgramStatusAction } from '@/app/admin/programmes/actions';

type Tab = 'info' | 'weeks' | 'tests' | 'es';
type Filter = 'all' | 'published' | 'draft';

type StepDraft = {
  id: string;
  title: string;
  thumb: string;
  category: string;
  durationLabel: string;
  excerpt: boolean;
  start: string;
  end: string;
  objective: string;
  toValidate: boolean;
};

const LEVEL_LABEL: Record<number, string> = { 0: 'Tous niveaux', 1: 'Débutante', 2: 'Intermédiaire', 3: 'Avancée' };

export function AdminProgrammesManager({
  programs,
  videos,
  tablesMissing,
  preview,
}: {
  programs: AdminProgramListItem[];
  videos: AdminVideoOption[];
  tablesMissing?: boolean;
  preview?: boolean;
}) {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [selectedId, setSelectedId] = useState(programs[0]?.id ?? '');
  const [tab, setTab] = useState<Tab>('weeks');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState('fondations');
  const [pickerStepId, setPickerStepId] = useState<string | null>(null);
  const [spotOpen, setSpotOpen] = useState(false);
  const [statusNote, setStatusNote] = useState('Enregistré automatiquement il y a 2 min');
  const [steps, setSteps] = useState<StepDraft[]>([
    { id: 's1', title: 'Pilates Mat 3', thumb: '/programmes/alejandra-tapis.jpg', category: 'PILATES MAT', durationLabel: '16:50', excerpt: false, start: '0:00', end: '', objective: 'Découvrir la respiration latérale et le centre', toValidate: false },
    { id: 's2', title: 'Pilates Mat Débutant : Les Fondations (60 Min)', thumb: '/programmes/alejandra-tapis.jpg', category: 'PILATES MAT', durationLabel: '61:11', excerpt: true, start: '0:00', end: '30:00', objective: 'Les bases au sol, partie 1', toValidate: true },
    { id: 's3', title: 'Stretching Flow Dynamique (20 min)', thumb: '/programmes/alejandra-tapis.jpg', category: 'STRETCHING', durationLabel: '19:32', excerpt: false, start: '0:00', end: '', objective: 'Assouplir le dos et les hanches', toValidate: false },
  ]);
  const [dragId, setDragId] = useState<string | null>(null);
  const [coachNote, setCoachNote] = useState('');
  const [objectiveLong, setObjectiveLong] = useState('');

  const published = programs.filter((p) => p.status === 'published').length;
  const drafts = programs.filter((p) => p.status === 'draft').length;
  const selected = programs.find((p) => p.id === selectedId) ?? programs[0];

  const filtered = useMemo(() => {
    return programs.filter((p) => {
      if (filter === 'published' && p.status !== 'published') return false;
      if (filter === 'draft' && p.status !== 'draft') return false;
      if (q && !p.titleFr.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [programs, filter, q]);

  const pickerList = videos.filter((v) => v.title.toLowerCase().includes(pickerQuery.toLowerCase()));

  async function persistStatus(next: 'draft' | 'published') {
    if (!selected || preview) {
      setStatusNote('Aperçu — aucun enregistrement');
      return;
    }
    const res = await setProgramStatusAction(selected.id, next);
    setStatusNote(res.ok ? 'Enregistré automatiquement à l’instant' : res.message);
  }

  function onDrop(targetId: string) {
    if (!dragId || dragId === targetId) return;
    setSteps((cur) => {
      const next = [...cur];
      const from = next.findIndex((s) => s.id === dragId);
      const to = next.findIndex((s) => s.id === targetId);
      if (from < 0 || to < 0) return cur;
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setDragId(null);
  }

  function pickVideo(video: AdminVideoOption) {
    if (!pickerStepId) return;
    setSteps((cur) =>
      cur.map((s) =>
        s.id === pickerStepId
          ? { ...s, title: video.title, thumb: video.thumb, category: video.category, durationLabel: video.durationLabel }
          : s,
      ),
    );
    setPickerOpen(false);
    if (!preview && pickerStepId) {
      void saveProgramStepAction(pickerStepId, { video_id: video.id });
    }
  }

  const chip = (active: boolean) =>
    active
      ? 'flex-1 rounded-full px-3 py-1.5 text-center bg-[#C9A96E]/35 text-[#2D2D2D] shadow-sm ring-1 ring-[#C9A96E]/50'
      : 'flex-1 rounded-full px-3 py-1.5 text-center text-luxury-muted';

  return (
    <div className="mx-auto max-w-[1320px] space-y-6 pb-16 pt-8 md:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4 px-1">
        <div>
          <p className="fm-kicker">Admin · Programmes</p>
          <h1 className="hero-signature-title mt-2 text-[3rem] text-luxury-ink">Programmes</h1>
          <p className="hero-signature-subtitle mt-2 text-[14px]">
            {programs.length} programmes · {published} publiés · {drafts} brouillons
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <span className="btn-luxury-primary inline-flex cursor-default items-center gap-2">
            <Plus size={14} strokeWidth={2.4} />
            Nouveau programme
          </span>
        </div>
      </header>
      {tablesMissing ? (
        <p className="rounded-2xl border border-[#E8DCCB] bg-white/80 px-4 py-3 text-sm text-luxury-muted">
          Tables programmes non créées (migration Lot 3 en attente de GO). Aperçu avec données fictives.
        </p>
      ) : null}

      <div className="grid items-start gap-6 xl:grid-cols-[330px_minmax(0,1fr)]">
        <aside className="glass-card admin-form-refined p-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-luxury-soft" size={16} />
            <input
              className="mt-2 w-full rounded-2xl border border-[#D9C9B4] bg-white px-4 py-3 pl-10 text-sm text-luxury-ink shadow-[inset_0_1px_3px_rgba(31,27,22,0.08)] !mt-0"
              placeholder="Rechercher un programme"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="mt-3 flex gap-1.5 rounded-full bg-black/[0.04] p-1 text-[12px] font-medium">
            <button type="button" className={chip(filter === 'all')} onClick={() => setFilter('all')}>
              Tous · {programs.length}
            </button>
            <button type="button" className={chip(filter === 'published')} onClick={() => setFilter('published')}>
              Publiés · {published}
            </button>
            <button type="button" className={chip(filter === 'draft')} onClick={() => setFilter('draft')}>
              Brouillons · {drafts}
            </button>
          </div>
          <ul className="mt-4 space-y-1.5">
            {filtered.map((p) => {
              const active = p.id === selected?.id;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(p.id)}
                    className={`flex w-full items-center gap-3 rounded-2xl p-2 text-left ${
                      active ? 'bg-[#C9A96E]/35 text-[#2D2D2D] shadow-sm ring-1 ring-[#C9A96E]/50' : ''
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.coverUrl} alt="" className="h-11 w-11 shrink-0 rounded-xl object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-medium text-luxury-ink">{p.titleFr}</p>
                      <p className="text-[11.5px] text-luxury-muted">
                        {p.levelLabel} · {p.weeks} sem. · {p.sessions} séances
                      </p>
                    </div>
                    <span
                      className={
                        p.status === 'published'
                          ? 'rounded-full bg-success-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-success'
                          : 'rounded-full bg-black/[0.06] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-luxury-muted'
                      }
                    >
                      {p.status === 'published' ? 'Publié' : 'Brouillon'}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {selected ? (
          <section className="glass-card admin-form-refined overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/[0.06] p-5 md:p-6">
              <div className="flex items-center gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selected.coverUrl} alt="" className="h-14 w-14 rounded-2xl object-cover" />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-[20px] font-semibold tracking-tight text-luxury-ink">{selected.titleFr}</h2>
                    <span
                      className={
                        selected.status === 'published'
                          ? 'rounded-full bg-success-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-success'
                          : 'rounded-full bg-black/[0.06] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-luxury-muted'
                      }
                    >
                      {selected.status === 'published' ? 'Publié' : 'Brouillon'}
                    </span>
                  </div>
                  <p className="mt-0.5 inline-flex items-center gap-1.5 text-[12px] text-luxury-muted">
                    <CheckCheck className="text-success" size={14} />
                    {statusNote}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <a href={`/compte/programmes/${selected.slug}`} className="btn-luxury-ghost !px-4 !py-2.5 inline-flex items-center gap-2">
                  <Eye size={14} />
                  Voir comme une cliente
                </a>
                <button
                  type="button"
                  className="btn-luxury-ghost !px-4 !py-2.5 inline-flex items-center gap-2"
                  onClick={() => persistStatus(selected.status === 'published' ? 'draft' : 'published')}
                >
                  {selected.status === 'published' ? <EyeOff size={14} /> : <Eye size={14} />}
                  {selected.status === 'published' ? 'Dépublier' : 'Publier'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-px bg-black/[0.05] md:grid-cols-4">
              <Stat label="Inscrites en cours" value={String(DEMO_ADMIN_STATS.active)} hint={DEMO_ADMIN_STATS.activeHint} />
              <Stat label="Ont terminé" value={String(DEMO_ADMIN_STATS.completed)} hint={DEMO_ADMIN_STATS.completedHint} />
              <Stat label="Taux de fin" value={DEMO_ADMIN_STATS.finishRate} hint={DEMO_ADMIN_STATS.finishHint} />
              <Stat label="Abandon le plus fréquent" value={DEMO_ADMIN_STATS.dropStep} hint={DEMO_ADMIN_STATS.dropHint} />
            </div>

            <div className="flex gap-1.5 border-b border-black/[0.06] px-5 pt-4 text-[13px] font-medium md:px-6">
              {([
                ['info', 'Informations'],
                ['weeks', 'Semaines & séances'],
                ['tests', 'Tests de progrès'],
                ['es', 'Textes ES'],
              ] as const).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={`rounded-t-2xl px-4 py-2.5 ${tab === id ? 'bg-white text-luxury-ink shadow-[0_-2px_8px_rgba(31,27,22,0.05)]' : 'text-luxury-muted'}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {tab === 'info' ? (
              <div className="space-y-4 bg-white/40 p-5 md:p-6">
                <label className="block text-[12px] font-medium text-luxury-muted">
                  Mot d’Alejandra
                  <textarea
                    className="mt-2 w-full rounded-2xl border border-[#D9C9B4] bg-white px-4 py-3 text-sm text-luxury-ink"
                    rows={4}
                    value={coachNote}
                    onChange={(e) => setCoachNote(e.target.value)}
                    placeholder="Affiché seulement quand tu l’as écrit."
                  />
                </label>
                <label className="block text-[12px] font-medium text-luxury-muted">
                  Objectif du jour (long, facultatif)
                  <textarea
                    className="mt-2 w-full rounded-2xl border border-[#D9C9B4] bg-white px-4 py-3 text-sm text-luxury-ink"
                    rows={3}
                    value={objectiveLong}
                    onChange={(e) => setObjectiveLong(e.target.value)}
                  />
                </label>
              </div>
            ) : null}

            {tab === 'weeks' ? (
              <div className="space-y-5 bg-white/40 p-5 md:p-6">
                <div className="rounded-[1.4rem] border border-white/80 bg-white/75 p-5 shadow-[0_10px_26px_rgba(31,27,22,0.08)]">
                  <div className="flex items-center justify-between gap-3">
                    <p className="flex items-center gap-3 text-[15px] font-semibold text-luxury-ink">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-luxury-ink text-[13px] text-white">S1</span>
                      Semaine 1
                    </p>
                    <span className="text-[12px] text-luxury-muted">3 séances vidéo · 1 live · 70 min</span>
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-[1fr_1.4fr]">
                    <label className="block text-[12px] font-medium text-luxury-muted">
                      Thème de la semaine
                      <input className="mt-2 w-full rounded-2xl border border-[#D9C9B4] bg-white px-4 py-3 text-sm text-luxury-ink shadow-[inset_0_1px_3px_rgba(31,27,22,0.08)]" defaultValue="Respirer et trouver ton centre" />
                    </label>
                    <div className="text-[12px] font-medium text-luxury-muted">
                      Les 3 consignes (affichées sur chaque séance)
                      <input className="mt-2 w-full rounded-2xl border border-[#D9C9B4] bg-white px-4 py-3 text-sm !mt-1.5 !py-2" defaultValue="Inspire par le nez, les côtes s'ouvrent sur les côtés" />
                      <input className="mt-2 w-full rounded-2xl border border-[#D9C9B4] bg-white px-4 py-3 text-sm !mt-1.5 !py-2" defaultValue="Expire longuement, le nombril rentre vers la colonne" />
                      <input className="mt-2 w-full rounded-2xl border border-[#D9C9B4] bg-white px-4 py-3 text-sm !mt-1.5 !py-2" defaultValue="Bassin neutre : ni creusé, ni rentré" />
                    </div>
                  </div>
                  <ol className="mt-5 space-y-3">
                    {steps.map((step, i) => (
                      <li
                        key={step.id}
                        draggable
                        onDragStart={() => setDragId(step.id)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => onDrop(step.id)}
                        className={`rounded-2xl border border-[#E8DCCB] bg-white p-3.5 ${step.toValidate ? 'ring-2 ring-[#C45D3E]/25' : ''}`}
                      >
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="cursor-grab text-luxury-soft">
                            <GripVertical size={18} />
                          </span>
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-terracotta-50 text-[12px] font-semibold text-luxury-orange">
                            {i + 1}
                          </span>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={step.thumb} alt="" className="h-11 w-16 rounded-lg object-cover" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13.5px] font-medium text-luxury-ink">{step.title}</p>
                            <p className="text-[11.5px] text-luxury-muted">
                              <span className="rounded bg-black/[0.05] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider">{step.category}</span>
                              {' · durée '}
                              {step.durationLabel}
                            </p>
                          </div>
                          <button
                            type="button"
                            className="rounded-full border border-[#D9C9B4] bg-white px-3 py-1.5 text-[12px] font-medium text-luxury-ink"
                            onClick={() => {
                              setPickerStepId(step.id);
                              setPickerOpen(true);
                            }}
                          >
                            Changer de vidéo
                          </button>
                          <span className="text-luxury-soft" title="Supprimer">
                            <Trash2 size={16} />
                          </span>
                        </div>
                        <div className="mt-3 grid gap-3 md:grid-cols-[auto_auto_1fr] md:items-end">
                          <div className="text-[12px] font-medium text-luxury-muted">
                            Partie de la vidéo
                            <div className="mt-2 flex items-center gap-2">
                              <span className={`rounded-full px-3 py-2 text-[12px] ${!step.excerpt ? 'bg-[#C9A96E]/35 text-[#2D2D2D] shadow-sm ring-1 ring-[#C9A96E]/50' : 'border border-[#D9C9B4] bg-white text-luxury-muted'}`}>
                                Toute la vidéo
                              </span>
                              <span className={`rounded-full px-3 py-2 text-[12px] ${step.excerpt ? 'bg-[#C9A96E]/35 text-[#2D2D2D] shadow-sm ring-1 ring-[#C9A96E]/50' : 'border border-[#D9C9B4] bg-white text-luxury-muted'}`}>
                                Un extrait
                              </span>
                            </div>
                          </div>
                          {step.excerpt ? (
                            <div className="flex items-end gap-2 text-[12px] font-medium text-luxury-muted">
                              <label>
                                Début
                                <input className="mt-2 w-24 rounded-2xl border border-[#D9C9B4] bg-white px-4 py-2 text-center text-sm tabular-nums" defaultValue={step.start} />
                              </label>
                              <span className="pb-2.5">→</span>
                              <label>
                                Fin
                                <input className="mt-2 w-24 rounded-2xl border border-[#D9C9B4] bg-white px-4 py-2 text-center text-sm tabular-nums" defaultValue={step.end} />
                              </label>
                              <button type="button" className="mb-1 inline-flex items-center gap-1 rounded-full bg-black/[0.04] px-3 py-1.5 text-[11.5px] text-luxury-ink" onClick={() => setSpotOpen(true)}>
                                <Crosshair size={13} />
                                Repérer dans la vidéo
                              </button>
                            </div>
                          ) : (
                            <div />
                          )}
                          <label className="block text-[12px] font-medium text-luxury-muted">
                            Objectif affiché à la cliente
                            <input className="mt-2 w-full rounded-2xl border border-[#D9C9B4] bg-white px-4 py-2 text-sm" defaultValue={step.objective} />
                          </label>
                        </div>
                        {step.toValidate ? (
                          <p className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#fff4e5] px-3 py-2 text-[12px] text-[#8a5a1f]">
                            <TriangleAlert size={14} />
                            Minutage proposé automatiquement (moitié de la vidéo) : à vérifier en regardant la vidéo.
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ol>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <span className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#D9C9B4] px-4 py-3 text-[13px] font-medium text-luxury-muted">
                      <Plus size={15} /> Ajouter une séance vidéo
                    </span>
                    <div className="flex items-center gap-3 rounded-2xl border border-dashed border-luxury-orange/40 bg-terracotta-50/70 px-4 py-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-luxury-ink text-[#f3c58e]">
                        <Radio size={15} />
                      </span>
                      <div className="min-w-0 flex-1 text-[12.5px] leading-snug text-luxury-ink">
                        <b className="font-semibold">Live de la semaine</b> · automatique
                        <br />
                        <span className="text-luxury-muted">Prochain live « Pilates » publié, dans la langue de la cliente</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-[1.4rem] border border-white/80 bg-white/60 px-5 py-4">
                  <p className="flex items-center gap-3 text-[15px] font-semibold text-luxury-ink">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/[0.06] text-[13px] text-luxury-ink">S2</span>
                    Stabiliser
                  </p>
                  <span className="inline-flex items-center gap-3 text-[12px] text-luxury-muted">
                    3 séances · 1 live <ChevronDown size={16} />
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-[1.4rem] border border-white/80 bg-white/60 px-5 py-4">
                  <p className="flex items-center gap-3 text-[15px] font-semibold text-luxury-ink">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/[0.06] text-[13px] text-luxury-ink">S3</span>
                    Enchaîner avec fluidité
                  </p>
                  <span className="inline-flex items-center gap-3 text-[12px] text-luxury-muted">
                    3 séances · 1 live <ChevronDown size={16} />
                  </span>
                </div>
              </div>
            ) : null}

            {tab === 'tests' ? (
              <div className="space-y-3 bg-white/40 p-5 text-sm text-luxury-ink md:p-6">
                <p>Planche sur les genoux · Pont fessier tenu · Flexion avant debout</p>
                <p className="text-luxury-muted">Mesures de performance uniquement. Aucune donnée de santé.</p>
              </div>
            ) : null}
            {tab === 'es' ? (
              <div className="space-y-3 bg-white/40 p-5 text-sm text-luxury-muted md:p-6">
                Textes espagnols du programme (à relire par Alejandra).
              </div>
            ) : null}
          </section>
        ) : null}
      </div>

      {pickerOpen ? (
        <div className="fixed inset-0 z-[150] flex items-end justify-center bg-black/20 p-4 md:items-center">
          <div className="w-full max-w-[440px] rounded-[1.6rem] border border-white/80 bg-white/95 p-4 shadow-[0_30px_70px_-10px_rgba(29,26,23,0.4)]">
            <div className="flex items-center justify-between">
              <p className="text-[14px] font-semibold text-luxury-ink">Choisir une vidéo</p>
              <button type="button" onClick={() => setPickerOpen(false)} className="text-luxury-soft">
                <X size={16} />
              </button>
            </div>
            <div className="relative mt-3">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-luxury-soft" size={15} />
              <input
                className="w-full rounded-2xl border border-[#C45D3E]/50 bg-white py-2.5 pl-10 pr-4 text-sm ring-2 ring-[#C45D3E]/20"
                value={pickerQuery}
                onChange={(e) => setPickerQuery(e.target.value)}
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
              <span className="rounded-full bg-luxury-ink px-2.5 py-1 text-white">Toutes</span>
              <span className="rounded-full bg-black/[0.05] px-2.5 py-1 text-luxury-muted">Pilates Mat</span>
            </div>
            <ul className="mt-3 space-y-1.5">
              {pickerList.map((v, i) => (
                <li key={v.id}>
                  <button type="button" onClick={() => pickVideo(v)} className={`flex w-full items-center gap-3 rounded-2xl p-2 text-left ${i === 0 ? 'bg-terracotta-50 ring-1 ring-luxury-orange/30' : ''}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={v.thumb} alt="" className="h-10 w-14 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-luxury-ink">{v.title}</p>
                      <p className="text-[11px] text-luxury-muted">
                        {v.category} · {v.durationLabel} · {v.usedIn > 0 ? `Utilisée dans ${v.usedIn} programme${v.usedIn > 1 ? 's' : ''}` : 'Pas encore utilisée'}
                      </p>
                    </div>
                    {i === 0 ? <CircleCheck className="text-luxury-orange" size={18} /> : null}
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[11.5px] text-luxury-muted">Seules les vidéos publiées et visibles de la bibliothèque sont proposées.</p>
          </div>
        </div>
      ) : null}

      {spotOpen ? (
        <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-[1.6rem] bg-white p-5">
            <p className="font-semibold text-luxury-ink">Repérer dans la vidéo</p>
            <p className="mt-2 text-sm text-luxury-muted">Le lecteur Vimeo (dnt) sera branché ici après import. Temps courant renvoyé dans Début / Fin.</p>
            <button type="button" className="btn-luxury-primary mt-4" onClick={() => setSpotOpen(false)}>
              Fermer
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="bg-white/70 px-5 py-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-luxury-soft">{label}</p>
      <p className="mt-1 text-[22px] font-semibold tabular-nums text-luxury-ink">{value}</p>
      <p className="text-[11.5px] text-luxury-muted">{hint}</p>
    </div>
  );
}

export { LEVEL_LABEL };
