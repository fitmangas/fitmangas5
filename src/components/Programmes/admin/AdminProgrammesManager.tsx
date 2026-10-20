'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCheck, CircleAlert, Eye, EyeOff, LoaderCircle, Plus, Search, Trash2, X } from 'lucide-react';

import { AdminWeeksTab } from './AdminWeeksTab';
import { AutoField, CHIP_OFF, CHIP_ON, FIELD, useRelativeTime, useSaver } from './AdminFormBits';
import { createProgramAction, saveProgramFieldsAction, saveProgramStepAction, saveProgramWeekAction } from '@/app/admin/programmes/actions';
import {
  ADMIN_GOALS,
  ADMIN_LEVELS,
  ADMIN_TRACKS,
  type AdminListItem,
  type AdminProgramDetail,
  type AdminStats,
  type AdminStep,
  type AdminTest,
  type AdminVideo,
  type AdminWeek,
  type L10n,
} from '@/lib/programmes/admin-types';

type Tab = 'info' | 'weeks' | 'tests' | 'es';
type Filter = 'all' | 'published' | 'draft';

const COVERS = [
  'alejandra-tapis.jpg',
  'alejandra-mug.jpg',
  'barre-arabesque.jpg',
  'barre-cercle.jpg',
  'barre-douce.jpg',
  'barre-exterieur.jpg',
  'dance-studio.jpg',
  'hiit-bande.jpg',
  'pm-centre-ballon.jpg',
  'pm-plage.jpg',
  'pm-pont-exterieur.jpg',
  'pm-rouleau.jpg',
].map((f) => `/programmes/${f}`);

function StatusPill({ status, big = false }: { status: AdminListItem['status']; big?: boolean }) {
  const pad = big ? 'px-2.5' : 'px-2';
  if (status === 'published') return <span className={`rounded-full bg-success-50 ${pad} py-0.5 text-[10px] font-semibold uppercase tracking-wider text-success`}>Publié</span>;
  if (status === 'archived') return <span className={`rounded-full bg-black/[0.06] ${pad} py-0.5 text-[10px] font-semibold uppercase tracking-wider text-luxury-soft`}>Archivé</span>;
  return <span className={`rounded-full bg-black/[0.06] ${pad} py-0.5 text-[10px] font-semibold uppercase tracking-wider text-luxury-muted`}>Brouillon</span>;
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

function NewProgramModal({ onClose, preview }: { onClose: () => void; preview: boolean }) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [level, setLevel] = useState(1);
  const [track, setTrack] = useState('pilates');
  const [weeks, setWeeks] = useState(3);
  const [perWeek, setPerWeek] = useState(3);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  async function create() {
    if (preview) return onClose();
    setBusy(true);
    setErr(null);
    const res = await createProgramAction({ titleFr: title, level, track, weeks, perWeek });
    setBusy(false);
    if (!res.ok) return setErr(res.message);
    onClose();
    router.push(`/admin/programmes?p=${res.id}&onglet=info`);
    router.refresh();
  }
  return (
    <div className="fixed inset-0 z-[150] flex items-end justify-center bg-black/25 p-4 md:items-center" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label="Nouveau programme" className="w-full max-w-md rounded-[1.6rem] bg-white p-6 shadow-[0_30px_70px_-10px_rgba(29,26,23,0.4)]">
        <div className="flex items-center justify-between">
          <p className="text-[16px] font-semibold text-luxury-ink">Nouveau programme</p>
          <button type="button" onClick={onClose} aria-label="Fermer" className="text-luxury-soft hover:text-luxury-ink">
            <X size={18} />
          </button>
        </div>
        <p className="mt-1 text-[13px] text-luxury-muted">Créé en brouillon : les clientes ne le voient qu’une fois publié.</p>
        <label className="mt-4 block text-[12px] font-medium text-luxury-muted">
          Titre
          <input className={FIELD} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex. : Pilates au mur" autoFocus />
        </label>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="block text-[12px] font-medium text-luxury-muted">
            Niveau
            <select className={FIELD} value={level} onChange={(e) => setLevel(Number(e.target.value))}>
              {Object.entries(ADMIN_LEVELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-[12px] font-medium text-luxury-muted">
            Parcours
            <select className={FIELD} value={track} onChange={(e) => setTrack(e.target.value)}>
              {Object.entries(ADMIN_TRACKS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-[12px] font-medium text-luxury-muted">
            Semaines
            <input type="number" min={1} max={8} className={FIELD} value={weeks} onChange={(e) => setWeeks(Number(e.target.value))} />
          </label>
          <label className="block text-[12px] font-medium text-luxury-muted">
            Séances par semaine
            <input type="number" min={1} max={6} className={FIELD} value={perWeek} onChange={(e) => setPerWeek(Number(e.target.value))} />
          </label>
        </div>
        {err ? <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-[13px] text-red-800">{err}</p> : null}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="btn-luxury-ghost !px-4 !py-2.5" onClick={onClose}>
            Annuler
          </button>
          <button type="button" className="btn-luxury-primary !px-4 !py-2.5" disabled={busy || title.trim().length < 3} onClick={() => void create()}>
            {busy ? <LoaderCircle size={14} className="animate-spin" /> : <Plus size={14} />}
            Créer le brouillon
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminProgrammesManager({
  programs,
  detail,
  videos,
  stats,
  tablesMissing,
  preview = false,
  initialTab = 'weeks',
}: {
  programs: AdminListItem[];
  detail: AdminProgramDetail | null;
  videos: AdminVideo[];
  stats: AdminStats | null;
  tablesMissing?: boolean;
  preview?: boolean;
  initialTab?: Tab;
}) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [tab, setTab] = useState<Tab>(initialTab);
  const [creating, setCreating] = useState(false);
  const [program, setProgram] = useState<AdminProgramDetail | null>(detail);
  const [weeks, setWeeks] = useState<AdminWeek[]>(detail?.weekRows ?? []);
  const [steps, setSteps] = useState<AdminStep[]>(detail?.steps ?? []);
  const { state: save, run } = useSaver(preview, detail?.updatedAt ? new Date(detail.updatedAt).getTime() : null);
  const savedLabel = useRelativeTime(save.at);

  useEffect(() => {
    setProgram(detail);
    setWeeks(detail?.weekRows ?? []);
    setSteps(detail?.steps ?? []);
  }, [detail]);

  const published = programs.filter((p) => p.status === 'published').length;
  const drafts = programs.filter((p) => p.status === 'draft').length;
  const totalSessions = programs.reduce((a, p) => a + p.sessions, 0);
  const filtered = useMemo(
    () =>
      programs.filter((p) => {
        if (filter === 'published' && p.status !== 'published') return false;
        if (filter === 'draft' && p.status !== 'draft') return false;
        if (q && !p.title.toLowerCase().includes(q.toLowerCase())) return false;
        return true;
      }),
    [programs, filter, q],
  );

  function select(id: string) {
    if (preview) return;
    router.push(`/admin/programmes?p=${encodeURIComponent(id)}&onglet=${tab}`);
  }

  /** Enregistre un ou plusieurs champs du programme (copie locale mise à jour tout de suite). */
  function saveProgram(local: Partial<AdminProgramDetail>, db: Record<string, unknown>) {
    if (!program) return;
    setProgram({ ...program, ...local });
    void run(() => saveProgramFieldsAction(program.id, db));
  }

  function saveL10n(key: 'title' | 'promise' | 'forWho' | 'notFor' | 'coachNote', column: string, lang: 'fr' | 'es', value: string) {
    if (!program) return;
    const next: L10n = { ...program[key], [lang]: value };
    saveProgram({ [key]: next } as Partial<AdminProgramDetail>, { [column]: next });
  }

  function saveTests(next: AdminTest[]) {
    if (!program) return;
    saveProgram({ tests: next }, { tests: next.map((t) => ({ key: t.key, type: t.type, label: t.label, how: t.how, ...(t.type === 'scale' ? { scale: t.scale ?? { fr: [], es: [] } } : {}) })) });
  }

  const chip = (active: boolean) => (active ? `flex-1 rounded-full px-3 py-1.5 text-center ${CHIP_ON}` : 'flex-1 rounded-full px-3 py-1.5 text-center text-luxury-muted');
  const listItem = programs.find((p) => p.id === program?.id);
  const videosById = useMemo(() => new Map(videos.map((v) => [v.id, v])), [videos]);

  return (
    <div className="mx-auto max-w-[1320px] space-y-6 pb-16 pt-8 md:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4 px-1">
        <div>
          <p className="fm-kicker">Admin · Programmes</p>
          <h1 className="hero-signature-title mt-2 text-[3rem] text-luxury-ink">Programmes</h1>
          <p className="hero-signature-subtitle mt-2 text-[14px]">
            {programs.length} programmes · {published} publiés · {drafts} brouillons · {totalSessions} séances sur {videos.length} vidéos
          </p>
        </div>
        <button type="button" className="btn-luxury-primary" onClick={() => setCreating(true)} disabled={tablesMissing}>
          <Plus size={14} strokeWidth={2.4} />
          Nouveau programme
        </button>
      </header>
      {tablesMissing ? (
        <p className="rounded-2xl border border-[#E8DCCB] bg-white/80 px-4 py-3 text-sm text-luxury-muted">
          Tables programmes non créées (migration du lot 3 en attente de GO) : rien n’est modifiable pour l’instant.
        </p>
      ) : null}

      <div className="grid items-start gap-6 xl:grid-cols-[330px_minmax(0,1fr)]">
        <aside className="glass-card admin-form-refined p-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-luxury-soft" size={16} aria-hidden />
            <input className={`${FIELD} !mt-0 pl-10`} placeholder="Rechercher un programme" value={q} onChange={(e) => setQ(e.target.value)} />
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
              const active = p.id === program?.id;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => select(p.id)}
                    className={`flex w-full items-center gap-3 rounded-2xl p-2 text-left ${active ? CHIP_ON : 'hover:bg-black/[0.03]'}`}
                    aria-current={active ? 'true' : undefined}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.coverUrl} alt="" className="h-11 w-11 shrink-0 rounded-xl object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-medium text-luxury-ink">{p.id === program?.id ? program.title.fr || p.title : p.title}</p>
                      <p className="text-[11.5px] text-luxury-muted">
                        {ADMIN_LEVELS[p.level] ?? '—'} · {p.weeks} sem. · {p.sessions} séances
                      </p>
                    </div>
                    <StatusPill status={p.id === program?.id ? program.status : p.status} />
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {program ? (
          <section className="glass-card admin-form-refined overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/[0.06] p-5 md:p-6">
              <div className="flex items-center gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={program.coverUrl} alt="" className="h-14 w-14 rounded-2xl object-cover" />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-[20px] font-semibold tracking-tight text-luxury-ink">{program.title.fr || listItem?.title}</h2>
                    <StatusPill status={program.status} big />
                  </div>
                  <p className={`mt-0.5 inline-flex items-center gap-1.5 text-[12px] ${save.kind === 'error' ? 'text-red-700' : 'text-luxury-muted'}`} aria-live="polite">
                    {save.kind === 'saving' ? (
                      <>
                        <LoaderCircle size={14} className="animate-spin" /> Enregistrement…
                      </>
                    ) : save.kind === 'error' ? (
                      <>
                        <CircleAlert size={14} /> Non enregistré : {save.message}
                      </>
                    ) : save.at ? (
                      <>
                        <CheckCheck className="text-success" size={14} /> Enregistré automatiquement {savedLabel}
                      </>
                    ) : (
                      'Chaque champ s’enregistre tout seul quand tu le quittes.'
                    )}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <Link href={`/compte/programmes/${program.slug}`} target="_blank" className="btn-luxury-ghost !px-4 !py-2.5">
                  <Eye size={14} />
                  Voir comme une cliente
                </Link>
                <button
                  type="button"
                  className="btn-luxury-ghost !px-4 !py-2.5"
                  onClick={() => {
                    const next = program.status === 'published' ? 'draft' : 'published';
                    saveProgram({ status: next }, { status: next });
                  }}
                >
                  {program.status === 'published' ? <EyeOff size={14} /> : <Eye size={14} />}
                  {program.status === 'published' ? 'Dépublier' : 'Publier'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-px bg-black/[0.05] md:grid-cols-4">
              <Stat label="Inscrites en cours" value={String(stats?.active ?? 0)} hint={stats?.activeNew7 ? `+${stats.activeNew7} cette semaine` : 'aucune nouvelle cette semaine'} />
              <Stat label="Ont terminé" value={String(stats?.completed ?? 0)} hint="certificats envoyés" />
              <Stat
                label="Taux de fin"
                value={stats?.finishRate != null ? `${stats.finishRate} %` : '—'}
                hint={stats?.catalogRate != null ? `moyenne du catalogue : ${stats.catalogRate} %` : 'pas encore d’inscription'}
              />
              <Stat
                label="Abandon le plus fréquent"
                value={stats?.drop ? `Séance ${stats.drop.n}` : '—'}
                hint={
                  stats?.drop
                    ? `${stats.drop.title}${stats.drop.hardPct != null ? ` · ressenti « Difficile » ${stats.drop.hardPct} %` : ''}`
                    : 'pas d’abandon pour l’instant'
                }
              />
            </div>

            <div className="flex gap-1.5 overflow-x-auto border-b border-black/[0.06] px-5 pt-4 text-[13px] font-medium md:px-6" role="tablist">
              {(
                [
                  ['info', 'Informations'],
                  ['weeks', 'Semaines & séances'],
                  ['tests', 'Tests de progrès'],
                  ['es', 'Textes ES'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={tab === id}
                  onClick={() => setTab(id)}
                  className={`shrink-0 rounded-t-2xl px-4 py-2.5 ${tab === id ? 'bg-white text-luxury-ink shadow-[0_-2px_8px_rgba(31,27,22,0.05)]' : 'text-luxury-muted hover:text-luxury-ink'}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {tab === 'info' ? (
              <div className="grid gap-4 bg-white/40 p-5 md:grid-cols-2 md:p-6">
                <AutoField label="Titre" value={program.title.fr} onCommit={(v) => saveL10n('title', 'title', 'fr', v)} />
                <AutoField label="Promesse (une phrase)" value={program.promise.fr} onCommit={(v) => saveL10n('promise', 'promise', 'fr', v)} />
                <AutoField label="Pour qui" multiline value={program.forWho.fr} onCommit={(v) => saveL10n('forWho', 'for_who', 'fr', v)} />
                <AutoField label="Pas pour qui" multiline value={program.notFor.fr} onCommit={(v) => saveL10n('notFor', 'not_for', 'fr', v)} />
                <label className="block text-[12px] font-medium text-luxury-muted">
                  Niveau
                  <select className={FIELD} value={program.level} onChange={(e) => saveProgram({ level: Number(e.target.value) }, { level: Number(e.target.value) })}>
                    {Object.entries(ADMIN_LEVELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-[12px] font-medium text-luxury-muted">
                  Parcours
                  <select className={FIELD} value={program.track} onChange={(e) => saveProgram({ track: e.target.value }, { track: e.target.value })}>
                    {Object.entries(ADMIN_TRACKS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="text-[12px] font-medium text-luxury-muted md:col-span-2">
                  Objectifs (filtres du catalogue)
                  <div className="mt-2 flex flex-wrap gap-2">
                    {Object.entries(ADMIN_GOALS).map(([k, v]) => {
                      const on = program.goals.includes(k);
                      return (
                        <button
                          key={k}
                          type="button"
                          className={`rounded-full px-3 py-2 text-[12px] ${on ? CHIP_ON : CHIP_OFF}`}
                          aria-pressed={on}
                          onClick={() => {
                            const goals = on ? program.goals.filter((g) => g !== k) : [...program.goals, k];
                            saveProgram({ goals }, { goals });
                          }}
                        >
                          {v}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <AutoField
                  label="Durée des séances (affichée)"
                  value={program.minutesRange}
                  placeholder="Ex. : 20–40 min"
                  onCommit={(v) => saveProgram({ minutesRange: v }, { minutes_range: v })}
                />
                <label className="block text-[12px] font-medium text-luxury-muted">
                  Séances par semaine (conseil)
                  <input
                    type="number"
                    min={1}
                    max={6}
                    className={FIELD}
                    defaultValue={program.perWeek}
                    onBlur={(e) => {
                      const v = Math.min(6, Math.max(1, Number(e.target.value) || program.perWeek));
                      if (v !== program.perWeek) saveProgram({ perWeek: v }, { sessions_per_week: v });
                    }}
                  />
                </label>
                <AutoField
                  label="Style du live de la semaine"
                  value={program.liveStyle}
                  placeholder="Pilates, Barre, Cardio… ou Tous"
                  hint="Le prochain live dont le titre contient ce mot est proposé chaque semaine."
                  onCommit={(v) => saveProgram({ liveStyle: v }, { live_style: v || null })}
                />
                <label className="block text-[12px] font-medium text-luxury-muted">
                  Programme suivant (« La suite logique »)
                  <select
                    className={FIELD}
                    value={program.nextProgramId ?? ''}
                    onChange={(e) => saveProgram({ nextProgramId: e.target.value || null }, { next_program_id: e.target.value || null })}
                  >
                    <option value="">Aucun</option>
                    {programs
                      .filter((p) => p.id !== program.id)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title}
                        </option>
                      ))}
                  </select>
                </label>
                <div className="text-[12px] font-medium text-luxury-muted md:col-span-2">
                  Photo de couverture
                  <div className="mt-2 flex flex-wrap gap-2">
                    {COVERS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        aria-pressed={program.coverUrl === c}
                        onClick={() => saveProgram({ coverUrl: c }, { cover_url: c })}
                        className={`h-14 w-14 overflow-hidden rounded-xl ${program.coverUrl === c ? 'ring-[3px] ring-luxury-orange ring-offset-2' : 'opacity-80 hover:opacity-100'}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={c} alt="" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
                <AutoField
                  className="md:col-span-2"
                  label="Mot d’Alejandra (facultatif)"
                  multiline
                  rows={4}
                  value={program.coachNote.fr}
                  placeholder="Affiché sur la page du programme seulement quand tu l’as écrit."
                  onCommit={(v) => saveL10n('coachNote', 'coach_note', 'fr', v)}
                />
              </div>
            ) : null}

            {tab === 'weeks' ? (
              <AdminWeeksTab detail={program} weeks={weeks} setWeeks={setWeeks} steps={steps} setSteps={setSteps} videos={videos} run={run} preview={preview} />
            ) : null}

            {tab === 'tests' ? (
              <div className="space-y-4 bg-white/40 p-5 md:p-6">
                <p className="text-[13px] text-luxury-muted">Mesures de performance seulement (aucune donnée de santé). Faites au départ puis à la fin du programme.</p>
                {program.tests.map((t, i) => (
                  <div key={`${t.key}-${i}`} className="rounded-2xl border border-[#E8DCCB] bg-white p-4">
                    <div className="flex flex-wrap items-end gap-3">
                      <AutoField
                        className="min-w-[220px] flex-1"
                        label={`Test ${i + 1}`}
                        value={t.label.fr}
                        onCommit={(v) => saveTests(program.tests.map((x, j) => (j === i ? { ...x, label: { ...x.label, fr: v } } : x)))}
                      />
                      <label className="block text-[12px] font-medium text-luxury-muted">
                        Mesure
                        <select
                          className={FIELD}
                          value={t.type}
                          onChange={(e) =>
                            saveTests(
                              program.tests.map((x, j) =>
                                j === i ? { ...x, type: e.target.value as AdminTest['type'], scale: e.target.value === 'scale' ? x.scale ?? { fr: [], es: [] } : undefined } : x,
                              ),
                            )
                          }
                        >
                          <option value="seconds">Secondes tenues</option>
                          <option value="count">Répétitions</option>
                          <option value="scale">Échelle (choix)</option>
                        </select>
                      </label>
                      <button
                        type="button"
                        className="mb-2 text-luxury-soft hover:text-red-700"
                        aria-label="Retirer ce test"
                        onClick={() => {
                          if (window.confirm('Retirer ce test du programme ?')) saveTests(program.tests.filter((_, j) => j !== i));
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <AutoField
                      className="mt-3"
                      label="Comment le faire"
                      value={t.how.fr}
                      onCommit={(v) => saveTests(program.tests.map((x, j) => (j === i ? { ...x, how: { ...x.how, fr: v } } : x)))}
                    />
                    {t.type === 'scale' ? (
                      <AutoField
                        className="mt-3"
                        label="Les choix, du moins bon au meilleur (séparés par des virgules)"
                        value={(t.scale?.fr ?? []).join(', ')}
                        onCommit={(v) =>
                          saveTests(
                            program.tests.map((x, j) =>
                              j === i ? { ...x, scale: { fr: v.split(',').map((s) => s.trim()).filter(Boolean), es: x.scale?.es ?? [] } } : x,
                            ),
                          )
                        }
                      />
                    ) : null}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => saveTests([...program.tests, { key: `test_${Date.now().toString(36)}`, type: 'seconds', label: { fr: 'Nouveau test', es: '' }, how: { fr: '', es: '' } }])}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#D9C9B4] px-4 py-3 text-[13px] font-medium text-luxury-muted hover:text-luxury-ink"
                >
                  <Plus size={15} /> Ajouter un test
                </button>
              </div>
            ) : null}

            {tab === 'es' ? (
              <div className="space-y-5 bg-white/40 p-5 md:p-6">
                <p className="text-[13px] text-luxury-muted">Textes vus par les clientes hispanophones. Vide = le texte français s’affiche.</p>
                <div className="grid gap-4 md:grid-cols-2">
                  <AutoField label={`Título · « ${program.title.fr} »`} value={program.title.es} onCommit={(v) => saveL10n('title', 'title', 'es', v)} />
                  <AutoField label="Promesa" value={program.promise.es} placeholder={program.promise.fr} onCommit={(v) => saveL10n('promise', 'promise', 'es', v)} />
                  <AutoField label="Para quién" multiline value={program.forWho.es} placeholder={program.forWho.fr} onCommit={(v) => saveL10n('forWho', 'for_who', 'es', v)} />
                  <AutoField label="Para quién no" multiline value={program.notFor.es} placeholder={program.notFor.fr} onCommit={(v) => saveL10n('notFor', 'not_for', 'es', v)} />
                  <AutoField
                    className="md:col-span-2"
                    label="Palabras de Alejandra"
                    multiline
                    value={program.coachNote.es}
                    placeholder={program.coachNote.fr}
                    onCommit={(v) => saveL10n('coachNote', 'coach_note', 'es', v)}
                  />
                </div>
                {weeks.map((w) => {
                  const cues = [0, 1, 2].map((i) => w.cues[i] ?? { fr: '', es: '' });
                  const weekSteps = steps.filter((s) => s.week === w.week && s.kind === 'video').sort((a, b) => a.position - b.position);
                  return (
                    <div key={w.id} className="rounded-[1.4rem] border border-white/80 bg-white/75 p-5">
                      <p className="text-[14px] font-semibold text-luxury-ink">
                        Semana {w.week} · <span className="font-normal text-luxury-muted">{w.focus.fr}</span>
                      </p>
                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        <AutoField
                          label="Tema de la semana"
                          value={w.focus.es}
                          placeholder={w.focus.fr}
                          onCommit={(es) => {
                            const next = { ...w, focus: { ...w.focus, es } };
                            setWeeks((cur) => cur.map((x) => (x.id === w.id ? next : x)));
                            void run(() => saveProgramWeekAction(w.id, { focus: next.focus, cues: next.cues }));
                          }}
                        />
                        {cues.map((c, i) =>
                          c.fr ? (
                            <AutoField
                              key={i}
                              label={`Consigna ${i + 1}`}
                              value={c.es}
                              placeholder={c.fr}
                              onCommit={(es) => {
                                const nextCues = cues.map((x, j) => (j === i ? { ...x, es } : x)).filter((x) => x.fr || x.es);
                                const next = { ...w, cues: nextCues };
                                setWeeks((cur) => cur.map((x) => (x.id === w.id ? next : x)));
                                void run(() => saveProgramWeekAction(w.id, { focus: next.focus, cues: next.cues }));
                              }}
                            />
                          ) : null,
                        )}
                        {weekSteps.map((s) => (
                          <AutoField
                            key={s.id}
                            label={`Sesión · ${s.objective.fr || videosById.get(s.videoId ?? '')?.title || ''}`}
                            value={s.objective.es}
                            placeholder={s.objective.fr}
                            onCommit={(es) => {
                              const objective = { ...s.objective, es };
                              setSteps((cur) => cur.map((x) => (x.id === s.id ? { ...x, objective } : x)));
                              void run(() => saveProgramStepAction(s.id, { objective }));
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </section>
        ) : (
          <section className="glass-card p-8 text-center text-[14px] text-luxury-muted">Aucun programme pour l’instant : crée le premier avec « Nouveau programme ».</section>
        )}
      </div>

      {creating ? <NewProgramModal onClose={() => setCreating(false)} preview={preview} /> : null}
    </div>
  );
}
