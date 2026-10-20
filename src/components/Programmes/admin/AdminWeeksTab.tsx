'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, CircleCheck, Crosshair, GripVertical, Plus, Radio, Search, Trash2, TriangleAlert, X } from 'lucide-react';

import { AutoField, CHIP_OFF, CHIP_ON, FIELD } from './AdminFormBits';
import {
  addProgramStepAction,
  addProgramWeekAction,
  deleteProgramStepAction,
  reorderProgramStepsAction,
  saveProgramStepAction,
  saveProgramWeekAction,
  setWeekLiveAction,
  type AdminProgramResult,
} from '@/app/admin/programmes/actions';
import { formatClock, parseClock, type AdminProgramDetail, type AdminStep, type AdminVideo, type AdminWeek } from '@/lib/programmes/admin-types';

type Run = (fn: () => Promise<AdminProgramResult>) => Promise<AdminProgramResult>;

const cleanTitle = (t: string) =>
  t
    .replace(/\.(mp4|mov|m4v)$/i, '')
    .replace(/[\p{Extended_Pictographic}️‍]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();

/* ——— Sélecteur de vidéo ——— */

function VideoPicker({
  videos,
  currentId,
  onPick,
  onClose,
}: {
  videos: AdminVideo[];
  currentId: string | null;
  onPick: (v: AdminVideo) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState('');
  const [folder, setFolder] = useState('all');
  const folders = useMemo(() => Array.from(new Set(videos.map((v) => v.folder))).sort(), [videos]);
  const list = videos
    .filter((v) => folder === 'all' || v.folder === folder)
    .filter((v) => !q || v.title.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (a.id === currentId ? -1 : b.id === currentId ? 1 : 0))
    .slice(0, 60);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[150] flex items-end justify-center bg-black/20 p-4 md:items-center" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label="Choisir une vidéo" className="flex max-h-[86vh] w-full max-w-[460px] flex-col rounded-[1.6rem] border border-white/80 bg-white/95 p-4 shadow-[0_30px_70px_-10px_rgba(29,26,23,0.4)] backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <p className="text-[14px] font-semibold text-luxury-ink">Choisir une vidéo</p>
          <button type="button" onClick={onClose} className="text-luxury-soft hover:text-luxury-ink" aria-label="Fermer">
            <X size={16} />
          </button>
        </div>
        <div className="relative mt-3">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-luxury-soft" size={15} aria-hidden />
          <input
            autoFocus
            className="w-full rounded-2xl border border-[#C45D3E]/50 bg-white py-2.5 pl-10 pr-4 text-sm ring-2 ring-[#C45D3E]/20 focus:outline-none"
            placeholder="Rechercher une vidéo"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
          {['all', ...folders].map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFolder(f)}
              className={`rounded-full px-2.5 py-1 ${folder === f ? 'bg-luxury-ink text-white' : 'bg-black/[0.05] text-luxury-muted'}`}
            >
              {f === 'all' ? 'Toutes' : f}
            </button>
          ))}
        </div>
        <ul className="mt-3 min-h-0 flex-1 space-y-1.5 overflow-y-auto">
          {list.map((v) => {
            const on = v.id === currentId;
            return (
              <li key={v.id}>
                <button
                  type="button"
                  onClick={() => onPick(v)}
                  className={`flex w-full items-center gap-3 rounded-2xl p-2 text-left hover:bg-black/[0.03] ${on ? 'bg-terracotta-50 ring-1 ring-luxury-orange/30' : ''}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={v.thumb} alt="" className="h-10 w-14 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-luxury-ink">{cleanTitle(v.title)}</p>
                    <p className="text-[11px] text-luxury-muted">
                      {v.folder.toUpperCase()} · {formatClock(v.durationS) || '—'} ·{' '}
                      {v.usedIn > 0 ? `Utilisée dans ${v.usedIn} programme${v.usedIn > 1 ? 's' : ''}` : 'Pas encore utilisée'}
                    </p>
                  </div>
                  {on ? <CircleCheck className="text-luxury-orange" size={18} aria-hidden /> : null}
                </button>
              </li>
            );
          })}
          {!list.length ? <li className="px-2 py-6 text-center text-[13px] text-luxury-muted">Aucune vidéo trouvée.</li> : null}
        </ul>
        <p className="mt-3 text-[11.5px] text-luxury-muted">Seules les vidéos publiées et visibles de la bibliothèque sont proposées.</p>
      </div>
    </div>
  );
}

/* ——— Repérer dans la vidéo (lecteur Vimeo) ——— */

function SpotModal({ video, onUse, onClose }: { video: AdminVideo; onUse: (which: 'start' | 'end', seconds: number) => void; onClose: () => void }) {
  const host = useRef<HTMLDivElement | null>(null);
  const player = useRef<{ getCurrentTime: () => Promise<number>; destroy: () => Promise<void> } | null>(null);
  const [time, setTime] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { default: Player } = await import('@vimeo/player');
        if (!host.current || !alive) return;
        const opts: Record<string, unknown> = { dnt: true, responsive: true };
        if (video.embedUrl) opts.url = video.embedUrl;
        else if (video.vimeoId) opts.id = Number(video.vimeoId);
        else throw new Error('no-video');
        const p = new Player(host.current, opts);
        player.current = p as unknown as typeof player.current;
        p.on('timeupdate', (d: { seconds: number }) => alive && setTime(d.seconds));
      } catch {
        if (alive) setError('Lecteur indisponible pour cette vidéo : saisis le minutage à la main.');
      }
    })();
    return () => {
      alive = false;
      void player.current?.destroy().catch(() => undefined);
    };
  }, [video]);

  async function use(which: 'start' | 'end') {
    let s = time;
    try {
      if (player.current) s = await player.current.getCurrentTime();
    } catch {
      /* temps affiché */
    }
    onUse(which, Math.round(s));
  }

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/40 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label="Repérer dans la vidéo" className="w-full max-w-2xl rounded-[1.6rem] bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="font-semibold text-luxury-ink">Repérer dans la vidéo</p>
          <button type="button" onClick={onClose} className="text-luxury-soft hover:text-luxury-ink" aria-label="Fermer">
            <X size={18} />
          </button>
        </div>
        <p className="mt-1 truncate text-[12.5px] text-luxury-muted">{cleanTitle(video.title)}</p>
        <div className="mt-4 overflow-hidden rounded-2xl bg-black">
          <div ref={host} className="aspect-video w-full [&>div]:!h-full [&>div]:!pt-0 [&_iframe]:h-full [&_iframe]:w-full" />
        </div>
        {error ? <p className="mt-3 text-[13px] text-[#8a5a1f]">{error}</p> : null}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[13px] text-luxury-muted">
            Position : <b className="font-semibold tabular-nums text-luxury-ink">{formatClock(time)}</b>
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-luxury-ghost !px-4 !py-2.5" onClick={() => void use('start')}>
              Prendre comme début
            </button>
            <button type="button" className="btn-luxury-primary !px-4 !py-2.5" onClick={() => void use('end')}>
              Prendre comme fin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ——— Une séance ——— */

function StepRow({
  step,
  n,
  video,
  onChange,
  onPickVideo,
  onSpot,
  onDelete,
  dragProps,
}: {
  step: AdminStep;
  n: number;
  video: AdminVideo | null;
  onChange: (patch: Partial<AdminStep>, db: Record<string, unknown>) => void;
  onPickVideo: () => void;
  onSpot: () => void;
  onDelete: () => void;
  dragProps: React.LiHTMLAttributes<HTMLLIElement>;
}) {
  const excerpt = step.startS != null || step.endS != null;
  const duration = video?.durationS ?? null;
  const [start, setStart] = useState(formatClock(step.startS ?? 0));
  const [end, setEnd] = useState(formatClock(step.endS ?? duration));
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    setStart(formatClock(step.startS ?? 0));
    setEnd(formatClock(step.endS ?? duration));
  }, [step.startS, step.endS, duration]);

  function commitSegment(nextStart: string, nextEnd: string) {
    const a = parseClock(nextStart);
    const b = parseClock(nextEnd);
    if (a == null || b == null) return setErr('Format attendu : 12:30 ou 1:02:30.');
    if (b <= a) return setErr('La fin doit être après le début.');
    if (duration && b > duration + 2) return setErr(`La vidéo dure ${formatClock(duration)}.`);
    setErr(null);
    if (a === step.startS && b === step.endS && !step.toValidate) return;
    const minutes = Math.max(1, Math.round((b - a) / 60));
    onChange({ startS: a, endS: b, toValidate: false, minutes }, { start_s: a, end_s: b, segment_to_validate: false, minutes });
  }

  return (
    <li {...dragProps} className={`rounded-2xl border border-[#E8DCCB] bg-white p-3.5 ${step.toValidate ? 'ring-2 ring-[#C45D3E]/25' : ''}`}>
      <div className="flex flex-wrap items-center gap-3">
        <span className="cursor-grab text-luxury-soft" title="Glisser pour changer l’ordre" aria-hidden>
          <GripVertical size={18} />
        </span>
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-terracotta-50 text-[12px] font-semibold text-luxury-orange">{n}</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={video?.thumb ?? '/programmes/alejandra-tapis.jpg'} alt="" className="h-11 w-16 rounded-lg object-cover" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13.5px] font-medium text-luxury-ink">{video ? cleanTitle(video.title) : 'Vidéo à choisir'}</p>
          <p className="text-[11.5px] text-luxury-muted">
            {video ? (
              <>
                <span className="rounded bg-black/[0.05] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider">{video.folder}</span>
                {` · durée ${formatClock(video.durationS) || '—'}`}
              </>
            ) : (
              'Aucune vidéo de la bibliothèque n’est encore liée à cette séance.'
            )}
          </p>
        </div>
        <button type="button" className="rounded-full border border-[#D9C9B4] bg-white px-3 py-1.5 text-[12px] font-medium text-luxury-ink hover:border-luxury-ink/40" onClick={onPickVideo}>
          {video ? 'Changer de vidéo' : 'Choisir une vidéo'}
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={step.hasProgress}
          title={step.hasProgress ? 'Des clientes ont déjà suivi cette séance : remplace plutôt la vidéo.' : 'Supprimer la séance'}
          className="text-luxury-soft hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Supprimer la séance"
        >
          <Trash2 size={16} />
        </button>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-[auto_auto_1fr] md:items-end">
        <div className="text-[12px] font-medium text-luxury-muted">
          Partie de la vidéo
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              className={`rounded-full px-3 py-2 text-[12px] ${!excerpt ? CHIP_ON : CHIP_OFF}`}
              onClick={() => {
                if (!excerpt) return;
                const minutes = duration ? Math.max(1, Math.round(duration / 60)) : step.minutes;
                onChange({ startS: null, endS: null, toValidate: false, minutes }, { start_s: null, end_s: null, segment_to_validate: false, minutes });
              }}
            >
              Toute la vidéo
            </button>
            <button
              type="button"
              className={`rounded-full px-3 py-2 text-[12px] ${excerpt ? CHIP_ON : CHIP_OFF}`}
              onClick={() => {
                if (excerpt) return;
                const half = duration ? Math.round(duration / 2) : 1800;
                onChange(
                  { startS: 0, endS: half, toValidate: true, minutes: Math.max(1, Math.round(half / 60)) },
                  { start_s: 0, end_s: half, segment_to_validate: true, minutes: Math.max(1, Math.round(half / 60)) },
                );
              }}
            >
              Un extrait
            </button>
          </div>
        </div>
        {excerpt ? (
          <div className="flex flex-wrap items-end gap-2 text-[12px] font-medium text-luxury-muted">
            <label>
              Début
              <input
                className={`${FIELD} !w-24 !py-2 text-center tabular-nums`}
                value={start}
                onChange={(e) => setStart(e.target.value)}
                onBlur={() => commitSegment(start, end)}
              />
            </label>
            <span className="pb-2.5" aria-hidden>
              →
            </span>
            <label>
              Fin
              <input className={`${FIELD} !w-24 !py-2 text-center tabular-nums`} value={end} onChange={(e) => setEnd(e.target.value)} onBlur={() => commitSegment(start, end)} />
            </label>
            {video ? (
              <button type="button" className="mb-1 inline-flex items-center gap-1 rounded-full bg-black/[0.04] px-3 py-1.5 text-[11.5px] text-luxury-ink hover:bg-black/[0.07]" onClick={onSpot}>
                <Crosshair size={13} aria-hidden />
                Repérer dans la vidéo
              </button>
            ) : null}
          </div>
        ) : (
          <div />
        )}
        <AutoField
          label="Objectif affiché à la cliente"
          value={step.objective.fr}
          inputClassName="!py-2"
          onCommit={(fr) => onChange({ objective: { ...step.objective, fr } }, { objective: { ...step.objective, fr } })}
        />
      </div>
      {err ? <p className="mt-2 text-[12px] text-red-700">{err}</p> : null}
      {step.toValidate ? (
        <p className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#fff4e5] px-3 py-2 text-[12px] text-[#8a5a1f]">
          <TriangleAlert size={14} aria-hidden />
          Minutage proposé automatiquement (moitié de la vidéo) : à vérifier en regardant la vidéo.
        </p>
      ) : null}
    </li>
  );
}

/* ——— Onglet « Semaines & séances » ——— */

export function AdminWeeksTab({
  detail,
  weeks,
  setWeeks,
  steps,
  setSteps,
  videos,
  run,
  preview,
}: {
  detail: AdminProgramDetail;
  weeks: AdminWeek[];
  setWeeks: React.Dispatch<React.SetStateAction<AdminWeek[]>>;
  steps: AdminStep[];
  setSteps: React.Dispatch<React.SetStateAction<AdminStep[]>>;
  videos: AdminVideo[];
  run: Run;
  preview: boolean;
}) {
  const router = useRouter();
  const byId = useMemo(() => new Map(videos.map((v) => [v.id, v])), [videos]);
  const [open, setOpen] = useState<number[]>(() => {
    const flagged = steps.find((s) => s.toValidate)?.week;
    return [flagged ?? weeks[0]?.week ?? 1];
  });
  const [picker, setPicker] = useState<{ mode: 'replace'; stepId: string } | { mode: 'add'; week: number } | null>(null);
  const [spot, setSpot] = useState<{ stepId: string; video: AdminVideo } | null>(null);
  const [drag, setDrag] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const videoOrder = steps.filter((s) => s.kind === 'video').sort((a, b) => a.week - b.week || a.position - b.position);
  const numberOf = (id: string) => videoOrder.findIndex((s) => s.id === id) + 1;

  function patchStep(id: string, patch: Partial<AdminStep>, db: Record<string, unknown>) {
    setSteps((cur) => cur.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    void run(() => saveProgramStepAction(id, db));
  }

  function patchWeek(w: AdminWeek, patch: Partial<AdminWeek>) {
    const next = { ...w, ...patch };
    setWeeks((cur) => cur.map((x) => (x.id === w.id ? next : x)));
    void run(() => saveProgramWeekAction(w.id, { focus: next.focus, cues: next.cues }));
  }

  async function reorder(week: number, fromId: string, toId: string) {
    const inWeek = steps.filter((s) => s.week === week).sort((a, b) => a.position - b.position);
    const vids = inWeek.filter((s) => s.kind === 'video');
    const from = vids.findIndex((s) => s.id === fromId);
    const to = vids.findIndex((s) => s.id === toId);
    if (from < 0 || to < 0 || from === to) return;
    const [moved] = vids.splice(from, 1);
    vids.splice(to, 0, moved);
    const ordered = [...vids, ...inWeek.filter((s) => s.kind === 'live')];
    const positions = new Map(ordered.map((s, i) => [s.id, i + 1]));
    setSteps((cur) => cur.map((s) => (positions.has(s.id) ? { ...s, position: positions.get(s.id)! } : s)));
    const res = await run(() => reorderProgramStepsAction(detail.id, week, ordered.map((s) => s.id)));
    if (!res.ok) router.refresh();
  }

  async function pick(v: AdminVideo) {
    if (!picker) return;
    if (picker.mode === 'replace') {
      const step = steps.find((s) => s.id === picker.stepId);
      setPicker(null);
      if (!step) return;
      const whole = step.startS == null && step.endS == null;
      const minutes = whole && v.durationS ? Math.max(1, Math.round(v.durationS / 60)) : step.minutes;
      patchStep(step.id, { videoId: v.id, minutes, toValidate: whole ? false : true }, { video_id: v.id, minutes, segment_to_validate: whole ? false : true });
      return;
    }
    const week = picker.week;
    setPicker(null);
    const res = await run(() => addProgramStepAction(detail.id, week, v.id));
    if (res.ok) {
      if (preview) {
        const pos = steps.filter((s) => s.week === week && s.kind === 'video').length + 1;
        setSteps((cur) => [
          ...cur,
          {
            id: `new-${Date.now()}`,
            week,
            position: pos,
            kind: 'video',
            videoId: v.id,
            startS: null,
            endS: null,
            toValidate: false,
            minutes: v.durationS ? Math.round(v.durationS / 60) : null,
            objective: { fr: cleanTitle(v.title), es: '' },
            objectiveLong: null,
            liveStyle: null,
            hasProgress: false,
          },
        ]);
      } else router.refresh();
    }
  }

  async function remove(step: AdminStep) {
    if (!window.confirm('Supprimer cette séance du programme ?')) return;
    const res = await run(() => deleteProgramStepAction(step.id));
    if (res.ok) setSteps((cur) => cur.filter((s) => s.id !== step.id));
    else setNotice(res.message);
  }

  async function toggleLive(week: number, on: boolean) {
    const res = await run(() => setWeekLiveAction(detail.id, week, on, detail.liveStyle || null));
    if (!res.ok) return;
    if (preview) {
      if (!on) setSteps((cur) => cur.filter((s) => !(s.week === week && s.kind === 'live')));
      else
        setSteps((cur) => [
          ...cur,
          { id: `live-${week}`, week, position: 99, kind: 'live', videoId: null, startS: null, endS: null, toValidate: false, minutes: null, objective: { fr: '', es: '' }, objectiveLong: null, liveStyle: detail.liveStyle, hasProgress: false },
        ]);
    } else router.refresh();
  }

  return (
    <div className="space-y-5 bg-white/40 p-5 md:p-6">
      {notice ? (
        <p className="flex items-start justify-between gap-3 rounded-2xl border border-[#f1d9b5] bg-[#fff4e5] px-4 py-3 text-[13px] text-[#8a5a1f]">
          {notice}
          <button type="button" onClick={() => setNotice(null)} aria-label="Fermer">
            <X size={15} />
          </button>
        </p>
      ) : null}
      {weeks.map((w) => {
        const isOpen = open.includes(w.week);
        const inWeek = steps.filter((s) => s.week === w.week).sort((a, b) => a.position - b.position);
        const vids = inWeek.filter((s) => s.kind === 'video');
        const hasLive = inWeek.some((s) => s.kind === 'live');
        const minutes = vids.reduce((a, s) => a + (s.minutes ?? 0), 0);
        const summary = `${vids.length} séance${vids.length > 1 ? 's' : ''} vidéo${hasLive ? ' · 1 live' : ''}${minutes ? ` · ${minutes} min` : ''}`;
        if (!isOpen) {
          return (
            <button
              key={w.id}
              type="button"
              onClick={() => setOpen([...open, w.week])}
              className="flex w-full items-center justify-between gap-3 rounded-[1.4rem] border border-white/80 bg-white/60 px-5 py-4 text-left hover:bg-white/80"
            >
              <span className="flex items-center gap-3 text-[15px] font-semibold text-luxury-ink">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/[0.06] text-[13px] text-luxury-ink">S{w.week}</span>
                {w.focus.fr || `Semaine ${w.week}`}
              </span>
              <span className="inline-flex items-center gap-3 text-[12px] text-luxury-muted">
                {vids.some((s) => s.toValidate) ? <TriangleAlert size={14} className="text-[#b9772b]" aria-label="Minutage à vérifier" /> : null}
                {summary} <ChevronDown size={16} aria-hidden />
              </span>
            </button>
          );
        }
        const cues = [0, 1, 2].map((i) => w.cues[i] ?? { fr: '', es: '' });
        return (
          <div key={w.id} className="rounded-[1.4rem] border border-white/80 bg-white/75 p-5 shadow-[0_10px_26px_rgba(31,27,22,0.08)]">
            <button type="button" onClick={() => setOpen(open.filter((x) => x !== w.week))} className="flex w-full items-center justify-between gap-3 text-left">
              <span className="flex items-center gap-3 text-[15px] font-semibold text-luxury-ink">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-luxury-ink text-[13px] text-white">S{w.week}</span>
                Semaine {w.week}
              </span>
              <span className="text-[12px] text-luxury-muted">{summary}</span>
            </button>
            <div className="mt-4 grid gap-4 md:grid-cols-[1fr_1.4fr]">
              <AutoField label="Thème de la semaine" value={w.focus.fr} onCommit={(fr) => patchWeek(w, { focus: { ...w.focus, fr } })} />
              <div className="text-[12px] font-medium text-luxury-muted">
                Les 3 consignes (affichées sur chaque séance)
                {cues.map((c, i) => (
                  <AutoField
                    key={i}
                    value={c.fr}
                    inputClassName="!mt-1.5 !py-2"
                    placeholder={`Consigne ${i + 1}`}
                    onCommit={(fr) => {
                      const next = cues.map((x, j) => (j === i ? { ...x, fr } : x)).filter((x) => x.fr || x.es);
                      patchWeek(w, { cues: next });
                    }}
                  />
                ))}
              </div>
            </div>
            <ol className="mt-5 space-y-3">
              {vids.map((s) => (
                <StepRow
                  key={s.id}
                  step={s}
                  n={numberOf(s.id)}
                  video={s.videoId ? byId.get(s.videoId) ?? null : null}
                  onChange={(patch, db) => patchStep(s.id, patch, db)}
                  onPickVideo={() => setPicker({ mode: 'replace', stepId: s.id })}
                  onSpot={() => {
                    const v = s.videoId ? byId.get(s.videoId) : null;
                    if (v) setSpot({ stepId: s.id, video: v });
                  }}
                  onDelete={() => void remove(s)}
                  dragProps={{
                    draggable: true,
                    onDragStart: () => setDrag(s.id),
                    onDragOver: (e) => e.preventDefault(),
                    onDrop: () => {
                      if (drag) void reorder(w.week, drag, s.id);
                      setDrag(null);
                    },
                  }}
                />
              ))}
            </ol>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <button
                type="button"
                onClick={() => setPicker({ mode: 'add', week: w.week })}
                className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#D9C9B4] px-4 py-3 text-[13px] font-medium text-luxury-muted hover:border-luxury-ink/30 hover:text-luxury-ink"
              >
                <Plus size={15} aria-hidden /> Ajouter une séance vidéo
              </button>
              <div className="flex items-center gap-3 rounded-2xl border border-dashed border-luxury-orange/40 bg-terracotta-50/70 px-4 py-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-luxury-ink text-[#f3c58e]">
                  <Radio size={15} aria-hidden />
                </span>
                <div className="min-w-0 flex-1 text-[12.5px] leading-snug text-luxury-ink">
                  <b className="font-semibold">Live de la semaine</b> · automatique
                  <br />
                  <span className="text-luxury-muted">
                    Prochain live {detail.liveStyle && detail.liveStyle.toLowerCase() !== 'tous' ? `« ${detail.liveStyle} » ` : ''}publié, dans la langue de la cliente
                  </span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={hasLive}
                  aria-label="Live de la semaine"
                  onClick={() => void toggleLive(w.week, !hasLive)}
                  className={`fm-switch ${hasLive ? 'fm-switch--on' : ''}`}
                />
              </div>
            </div>
          </div>
        );
      })}
      <button
        type="button"
        onClick={async () => {
          const res = await run(() => addProgramWeekAction(detail.id));
          if (res.ok && !preview) router.refresh();
        }}
        className="flex w-full items-center justify-center gap-2 rounded-[1.4rem] border-2 border-dashed border-[#D9C9B4] px-4 py-3.5 text-[13px] font-medium text-luxury-muted hover:border-luxury-ink/30 hover:text-luxury-ink"
      >
        <Plus size={15} aria-hidden /> Ajouter une semaine
      </button>

      {picker ? (
        <VideoPicker
          videos={videos}
          currentId={picker.mode === 'replace' ? steps.find((s) => s.id === picker.stepId)?.videoId ?? null : null}
          onPick={(v) => void pick(v)}
          onClose={() => setPicker(null)}
        />
      ) : null}
      {spot ? (
        <SpotModal
          video={spot.video}
          onClose={() => setSpot(null)}
          onUse={(which, seconds) => {
            const s = steps.find((x) => x.id === spot.stepId);
            if (!s) return;
            const a = which === 'start' ? seconds : s.startS ?? 0;
            const b = which === 'end' ? seconds : s.endS ?? spot.video.durationS ?? seconds + 60;
            if (b <= a) return;
            const minutes = Math.max(1, Math.round((b - a) / 60));
            patchStep(s.id, { startS: a, endS: b, toValidate: false, minutes }, { start_s: a, end_s: b, segment_to_validate: false, minutes });
          }}
        />
      ) : null}
    </div>
  );
}
