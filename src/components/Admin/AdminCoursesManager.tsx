'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, Play, Pencil, Trash2, UserCheck, X } from 'lucide-react';
import { createCourseAction, deleteCourseAction, updateCourseAction } from '@/app/admin/courses/actions';

export type AdminCourseRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  course_format: 'online' | 'onsite';
  course_category: 'individual' | 'group';
  starts_at: string;
  ends_at: string;
  timezone: string;
  capacity_max: number | null;
  location: string | null;
  live_url: string | null;
  jitsi_link: string | null;
  replay_url: string | null;
  spotify_playlist_url?: string | null;
  is_published: boolean;
  created_at: string;
};

type Props = {
  courses: AdminCourseRow[];
};

/** Pour inputs datetime-local (heure locale navigateur). */
function toDatetimeLocalValue(iso: string) {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day}T${h}:${min}`;
}

function isoFromDatetimeLocal(value: string) {
  return new Date(value).toISOString();
}

type FormState = {
  title: string;
  description: string;
  courseType: 'pilates-mat' | 'yoga-flow' | 'postural' | 'renfo-core';
  startsLocal: string;
  endsLocal: string;
  courseFormat: 'online' | 'onsite';
  courseCategory: 'individual' | 'group';
  capacityMax: string;
  isPublished: boolean;
  location: string;
  liveUrl: string;
  city: 'Nantes' | 'Mexico';
  jitsiLink: string;
  replayUrl: string;
  spotifyPlaylistUrl: string;
};

const COURSE_TYPE_OPTIONS: Array<{ value: FormState['courseType']; label: string }> = [
  { value: 'pilates-mat', label: 'Pilates Mat' },
  { value: 'yoga-flow', label: 'Yoga Flow' },
  { value: 'postural', label: 'Postural' },
  { value: 'renfo-core', label: 'Renfo Core' },
];

const DESCRIPTION_TEMPLATES: Record<FormState['courseType'], string> = {
  'pilates-mat':
    'Session Pilates Mat axee sur le centre, la posture et la fluidite des mouvements. Travail progressif pour renforcer en profondeur et gagner en stabilite.',
  'yoga-flow':
    'Yoga Flow dynamique, respiration guidee et enchainements fluides pour relacher les tensions, retrouver de la mobilite et renforcer tout le corps.',
  postural:
    'Cours postural focalise sur l alignement, la mobilite articulaire et le renforcement doux. Ideal pour corriger les compensations et prevenir les douleurs.',
  'renfo-core':
    'Renforcement du core avec sequences ciblees sur sangle abdominale, dos et bassin. Intensite adaptable, priorite a la technique et au controle.',
};

const TEMPLATE_STORAGE_KEY = 'admin-course-description-templates-v1';

/** En-têtes tableau : même gris anthracite que la carte calendrier du dashboard. */
const ADMIN_TABLE_HEAD_ROW =
  'border-b border-white/10 bg-[rgba(29,29,31,0.78)] text-[10px] uppercase tracking-wider text-white/80 backdrop-blur-md';

function getCourseTypeLabel(courseType: FormState['courseType']): string {
  return COURSE_TYPE_OPTIONS.find((opt) => opt.value === courseType)?.label ?? 'Cours';
}

function inferCourseTypeFromTitle(title: string): FormState['courseType'] {
  const normalized = title.toLowerCase();
  if (normalized.includes('yoga')) return 'yoga-flow';
  if (normalized.includes('postural')) return 'postural';
  if (normalized.includes('renfo') || normalized.includes('core')) return 'renfo-core';
  return 'pilates-mat';
}

function computeDefaultPoints(courseFormat: FormState['courseFormat']): number {
  return courseFormat === 'onsite' ? 30 : 15;
}

function buildAutoJitsiLink(title: string, startsLocal: string): string | null {
  const cleanTitle = title
    .trim()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 42);
  if (!cleanTitle) return null;
  const date = startsLocal.replace(/[^0-9]/g, '').slice(0, 12);
  return `https://meet.jit.si/FitMangas-${cleanTitle}-${date || 'session'}`;
}

function emptyCreateForm(): FormState {
  const start = new Date();
  start.setMinutes(0, 0, 0);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  return {
    title: getCourseTypeLabel('pilates-mat'),
    description: DESCRIPTION_TEMPLATES['pilates-mat'],
    courseType: 'pilates-mat',
    startsLocal: toDatetimeLocalValue(start.toISOString()),
    endsLocal: toDatetimeLocalValue(end.toISOString()),
    courseFormat: 'online',
    courseCategory: 'group',
    capacityMax: '',
    isPublished: true,
    location: '',
    liveUrl: '',
    city: 'Nantes',
    jitsiLink: '',
    replayUrl: '',
    spotifyPlaylistUrl: '',
  };
}

function courseToFormState(c: AdminCourseRow): FormState {
  const inferredType = inferCourseTypeFromTitle(c.title);
  return {
    title: c.title,
    description: c.description ?? '',
    courseType: inferredType,
    startsLocal: toDatetimeLocalValue(c.starts_at),
    endsLocal: toDatetimeLocalValue(c.ends_at),
    courseFormat: c.course_format,
    courseCategory: c.course_category,
    capacityMax: c.capacity_max != null ? String(c.capacity_max) : '',
    isPublished: c.is_published,
    location: c.location ?? '',
    liveUrl: c.live_url ?? '',
    city: c.location?.toLowerCase().includes('mex') ? 'Mexico' : 'Nantes',
    jitsiLink: c.jitsi_link ?? '',
    replayUrl: c.replay_url ?? '',
    spotifyPlaylistUrl: c.spotify_playlist_url ?? '',
  };
}

function parseCapacity(cap: string): number | null {
  const t = cap.trim();
  if (!t) return null;
  const n = Number.parseInt(t, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function formToPayload(f: FormState) {
  const autoPoints = computeDefaultPoints(f.courseFormat);
  const pointsPrefix = `[${autoPoints} pts]`;
  const normalizedDescription = f.description.trim();
  const autoTitle = getCourseTypeLabel(f.courseType);
  const autoJitsi = buildAutoJitsiLink(autoTitle, f.startsLocal);
  return {
    title: autoTitle,
    description: `${pointsPrefix} ${normalizedDescription}`.trim() || pointsPrefix,
    startsAt: isoFromDatetimeLocal(f.startsLocal),
    endsAt: isoFromDatetimeLocal(f.endsLocal),
    courseFormat: f.courseFormat,
    courseCategory: f.courseCategory,
    capacityMax: f.courseFormat === 'onsite' ? parseCapacity(f.capacityMax) : null,
    isPublished: f.isPublished,
    location: f.courseFormat === 'onsite' ? f.city : null,
    liveUrl: f.courseFormat === 'online' ? autoJitsi : null,
    jitsiLink: f.courseFormat === 'online' ? autoJitsi : null,
    replayUrl: null,
    spotifyPlaylistUrl: null,
    timezone: 'Europe/Paris',
  };
}

export function AdminCoursesManager({ courses }: Props) {
  const router = useRouter();
  const [notice, setNotice] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [editing, setEditing] = useState<AdminCourseRow | null>(null);
  const [editForm, setEditForm] = useState<FormState | null>(null);
  const [createForm, setCreateForm] = useState<FormState>(() => emptyCreateForm());
  const [templates, setTemplates] = useState<Record<FormState['courseType'], string>>(DESCRIPTION_TEMPLATES);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(TEMPLATE_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<Record<FormState['courseType'], string>>;
      const merged = { ...DESCRIPTION_TEMPLATES, ...parsed };
      setTemplates(merged);
      setCreateForm((s) => ({ ...s, description: merged[s.courseType] }));
    } catch {
      // ignore parse issues
    }
  }, []);

  function saveTemplate(type: FormState['courseType'], description: string) {
    const next = { ...templates, [type]: description };
    setTemplates(next);
    try {
      window.localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(next));
      setNotice({ type: 'ok', text: `Template enregistré pour ${getCourseTypeLabel(type)}.` });
    } catch {
      setNotice({ type: 'err', text: 'Impossible d’enregistrer le template localement.' });
    }
  }

  function refreshData() {
    router.refresh();
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setNotice(null);
    startTransition(async () => {
      const res = await createCourseAction(formToPayload(createForm));
      if (res.ok) {
        setNotice({ type: 'ok', text: 'Séance créée.' });
        setCreateForm((s) => ({ ...emptyCreateForm(), description: templates[s.courseType] ?? templates['pilates-mat'] }));
        refreshData();
      } else {
        setNotice({ type: 'err', text: res.message });
      }
    });
  }

  function openEdit(c: AdminCourseRow) {
    setEditing(c);
    setEditForm(courseToFormState(c));
    setNotice(null);
  }

  function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editing || !editForm) return;
    setNotice(null);
    startTransition(async () => {
      const res = await updateCourseAction(editing.id, formToPayload(editForm));
      if (res.ok) {
        setNotice({ type: 'ok', text: 'Séance mise à jour.' });
        setEditing(null);
        setEditForm(null);
        refreshData();
      } else {
        setNotice({ type: 'err', text: res.message });
      }
    });
  }

  function handleDelete(id: string) {
    if (!window.confirm('Supprimer cette séance ? Les inscriptions associées seront supprimées.')) return;
    setNotice(null);
    startTransition(async () => {
      const res = await deleteCourseAction(id);
      if (res.ok) {
        setNotice({ type: 'ok', text: 'Séance supprimée.' });
        refreshData();
      } else {
        setNotice({ type: 'err', text: res.message });
      }
    });
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-luxury-ink">Séances</h2>
        </div>
        <Link
          href="/admin"
          className="btn-luxury-ghost px-4 py-2 text-[10px] tracking-[0.12em]"
        >
          ← Dashboard
        </Link>
      </div>

      {notice ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            notice.type === 'ok'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-red-200 bg-red-50 text-red-900'
          }`}
        >
          {notice.text}
        </div>
      ) : null}

      <section className="glass-card border-white/80 bg-white/45 p-5 backdrop-blur-2xl">
        <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-2">
          <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-luxury-soft">
            Type de cours
            <select
              value={createForm.courseType}
              onChange={(e) => {
                const selected = e.target.value as FormState['courseType'];
                setCreateForm((s) => ({ ...s, courseType: selected, description: templates[selected], title: getCourseTypeLabel(selected) }));
              }}
              className="mt-2 w-full rounded-2xl border border-white/85 bg-white/55 px-4 py-3 text-sm text-luxury-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] outline-none focus:ring-2 focus:ring-[#ff7a00]/25"
            >
              {COURSE_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label className="md:col-span-2 block text-[10px] font-semibold uppercase tracking-[0.18em] text-luxury-soft">
            Description
            <textarea
              rows={3}
              value={createForm.description}
              onChange={(e) => setCreateForm((s) => ({ ...s, description: e.target.value }))}
              className="mt-2 w-full rounded-2xl border border-white/85 bg-white/55 px-4 py-3 text-sm text-luxury-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] outline-none focus:ring-2 focus:ring-[#ff7a00]/25"
            />
            <button
              type="button"
              onClick={() => saveTemplate(createForm.courseType, createForm.description)}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/55 bg-white/45 px-4 py-2.5 text-xs font-semibold normal-case tracking-normal text-luxury-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] backdrop-blur-md transition hover:border-[#ff7a00]/45 hover:bg-white/60 hover:shadow-[0_0_0_1px_rgba(255,122,0,0.15)]"
            >
              💾 Enregistrer comme description par défaut pour ce type
            </button>
          </label>
          <div className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-luxury-soft">
            Format
            <div className="mt-2 inline-flex rounded-full border border-white/80 bg-white/45 p-1">
              <button
                type="button"
                onClick={() => setCreateForm((s) => ({ ...s, courseFormat: 'online', capacityMax: '' }))}
                className={`rounded-full px-4 py-1.5 text-[11px] font-semibold normal-case transition ${
                  createForm.courseFormat === 'online'
                    ? 'bg-gradient-to-br from-[#ff7a00] to-orange-600 text-white shadow-[0_4px_16px_rgba(255,122,0,0.42)]'
                    : 'text-luxury-muted'
                }`}
              >
                Visio
              </button>
              <button
                type="button"
                onClick={() => setCreateForm((s) => ({ ...s, courseFormat: 'onsite' }))}
                className={`rounded-full px-4 py-1.5 text-[11px] font-semibold normal-case transition ${
                  createForm.courseFormat === 'onsite'
                    ? 'bg-gradient-to-br from-[#ff7a00] to-orange-600 text-white shadow-[0_4px_16px_rgba(255,122,0,0.42)]'
                    : 'text-luxury-muted'
                }`}
              >
                Présentiel
              </button>
            </div>
          </div>
          <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-luxury-soft">
            Début *
            <input
              type="datetime-local"
              required
              value={createForm.startsLocal}
              onChange={(e) => setCreateForm((s) => ({ ...s, startsLocal: e.target.value }))}
              className="mt-2 w-full rounded-2xl border border-white/85 bg-white/55 px-4 py-3 text-sm text-luxury-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] outline-none focus:ring-2 focus:ring-[#ff7a00]/25"
            />
          </label>
          <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-luxury-soft">
            Fin *
            <input
              type="datetime-local"
              required
              value={createForm.endsLocal}
              onChange={(e) => setCreateForm((s) => ({ ...s, endsLocal: e.target.value }))}
              className="mt-2 w-full rounded-2xl border border-white/85 bg-white/55 px-4 py-3 text-sm text-luxury-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] outline-none focus:ring-2 focus:ring-[#ff7a00]/25"
            />
          </label>
          {createForm.courseFormat === 'onsite' ? (
            <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-luxury-soft">
              Ville
              <select
                value={createForm.city}
                onChange={(e) => setCreateForm((s) => ({ ...s, city: e.target.value as 'Nantes' | 'Mexico' }))}
                className="mt-2 w-full rounded-2xl border border-white/85 bg-white/55 px-4 py-3 text-sm text-luxury-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] outline-none focus:ring-2 focus:ring-[#ff7a00]/25"
              >
                <option value="Nantes">Nantes</option>
                <option value="Mexico">Mexico</option>
              </select>
            </label>
          ) : null}
          {createForm.courseFormat === 'onsite' ? (
            <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-luxury-soft">
              Capacité (places)
              <input
                type="number"
                min={1}
                value={createForm.capacityMax}
                onChange={(e) => setCreateForm((s) => ({ ...s, capacityMax: e.target.value }))}
                placeholder="Illimité si vide"
                className="mt-2 w-full rounded-2xl border border-white/85 bg-white/55 px-4 py-3 text-sm text-luxury-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] outline-none focus:ring-2 focus:ring-[#ff7a00]/25"
              />
            </label>
          ) : null}
          <label className="md:col-span-2 flex items-center gap-2 text-sm text-brand-ink/70">
            <input
              type="checkbox"
              checked={!createForm.isPublished}
              onChange={(e) => setCreateForm((s) => ({ ...s, isPublished: !e.target.checked }))}
              className="rounded border-brand-ink/20"
            />
            Enregistrer comme Brouillon
          </label>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-full bg-[#ff7a00] px-7 py-3 text-[10px] font-bold uppercase tracking-widest text-white shadow-[0_0_0_1px_rgba(255,255,255,0.25)_inset,0_8px_26px_rgba(255,122,0,0.45)] transition hover:-translate-y-0.5 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.25)_inset,0_12px_32px_rgba(255,122,0,0.58)] disabled:opacity-50"
            >
              Créer la séance
            </button>
          </div>
        </form>
      </section>

      <section className="glass-card overflow-hidden">
        <div className="border-b border-white/10 bg-[rgba(29,29,31,0.78)] px-6 py-4 backdrop-blur-md">
          <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-white/90">Toutes les séances</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className={ADMIN_TABLE_HEAD_ROW}>
                <th className="px-4 py-3">Titre</th>
                <th className="px-4 py-3">Début</th>
                <th className="px-4 py-3">Format</th>
                <th className="px-4 py-3">Places max</th>
                <th className="px-4 py-3">Publié</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-brand-ink/85">
              {courses.map((c) => {
                const coursePast = new Date(c.ends_at).getTime() < Date.now();
                return (
                <tr key={c.id} className="border-b border-white/20 hover:bg-white/25">
                  <td className="max-w-[200px] truncate px-4 py-3 font-medium">{c.title}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs">
                    {new Date(c.starts_at).toLocaleString('fr-FR', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {c.course_format === 'online' ? 'Ligne' : 'Prés.'} ·{' '}
                    {c.course_category === 'group' ? 'Coll.' : 'Indiv.'}
                  </td>
                  <td className="px-4 py-3 text-xs">{c.capacity_max ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                        c.is_published ? 'bg-emerald-100 text-emerald-800' : 'bg-brand-ink/[0.06] text-brand-ink/50'
                      }`}
                    >
                      {c.is_published ? 'Oui' : 'Non'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(c)}
                      className="mr-2 inline-flex items-center rounded-full border border-brand-ink/10 p-2 text-brand-ink/60 hover:bg-brand-sand/40"
                      aria-label="Modifier"
                    >
                      <Pencil size={14} />
                    </button>
                    <a
                      href={`/live/${c.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mr-2 inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50/80 p-2 text-emerald-800 hover:bg-emerald-100"
                      aria-label="Ouvrir le live dans un nouvel onglet"
                    >
                      <Play size={14} strokeWidth={2} className="-ml-px" aria-hidden />
                    </a>
                    <a
                      href={`/live/${c.id}?preview=client`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mr-2 inline-flex items-center rounded-full border border-brand-ink/12 bg-white p-2 text-brand-ink/70 hover:border-brand-accent/40 hover:bg-brand-beige/50 hover:text-brand-ink"
                      aria-label="Aperçu client (nouvel onglet)"
                      title="Aperçu client — comme un élève avec accès complet"
                    >
                      <Eye size={14} aria-hidden />
                    </a>
                    {coursePast ? (
                      <Link
                        href={`/admin/courses/${c.id}/attendance`}
                        className="mr-2 inline-flex items-center rounded-full border border-brand-ink/12 bg-white p-2 text-brand-ink/70 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-900"
                        aria-label="Faire le pointage"
                        title="Pointage présence"
                      >
                        <UserCheck size={14} aria-hidden />
                      </Link>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => handleDelete(c.id)}
                      className="inline-flex items-center rounded-full border border-red-200 p-2 text-red-700 hover:bg-red-50"
                      aria-label="Supprimer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
                );
              })}
              {courses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-brand-ink/45">
                    Aucune séance. Crée-en une ci-dessus.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {editing && editForm ? (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm">
          <div className="glass-card max-h-[90vh] w-full max-w-lg overflow-y-auto p-6 shadow-2xl">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-white/35 pb-4">
              <div className="min-w-0 flex-1 pr-2">
                <h3 className="text-xl font-semibold leading-snug text-luxury-ink">Modifier la séance</h3>
                <p className="mt-1 text-[11px] leading-snug text-brand-ink/45">
                  Ouvre l’aperçu élève dans un nouvel onglet pour tes démos prospects.
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                <a
                  href={`/live/${editing.id}?preview=client`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-brand-accent/35 bg-brand-accent/[0.08] px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-brand-accent hover:bg-brand-accent/[0.14]"
                >
                  <Eye size={14} aria-hidden />
                  Voir l’aperçu client
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(null);
                    setEditForm(null);
                  }}
                  className="rounded-full p-2 text-brand-ink/45 hover:bg-brand-beige"
                  aria-label="Fermer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <form onSubmit={handleUpdate} className="grid gap-4">
              <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-luxury-soft">
                Type de cours
                <select
                  value={editForm.courseType}
                  onChange={(e) => {
                    const selected = e.target.value as FormState['courseType'];
                    setEditForm((s) => (s ? { ...s, courseType: selected, description: templates[selected], title: getCourseTypeLabel(selected) } : s));
                  }}
                  className="mt-2 w-full rounded-2xl border border-white/85 bg-white/55 px-4 py-3 text-sm text-luxury-ink outline-none focus:ring-2 focus:ring-[#ff7a00]/25"
                >
                  {COURSE_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-luxury-soft">
                Description
                <textarea
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm((s) => (s ? { ...s, description: e.target.value } : s))}
                  className="mt-2 w-full rounded-2xl border border-white/85 bg-white/55 px-4 py-3 text-sm text-luxury-ink outline-none focus:ring-2 focus:ring-[#ff7a00]/25"
                />
                <button
                  type="button"
                  onClick={() => saveTemplate(editForm.courseType, editForm.description)}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/55 bg-white/45 px-4 py-2.5 text-xs font-semibold normal-case tracking-normal text-luxury-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] backdrop-blur-md transition hover:border-[#ff7a00]/45 hover:bg-white/60 hover:shadow-[0_0_0_1px_rgba(255,122,0,0.15)]"
                >
                  💾 Enregistrer comme description par défaut pour ce type
                </button>
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-luxury-soft">
                  Début *
                  <input
                    type="datetime-local"
                    required
                    value={editForm.startsLocal}
                    onChange={(e) => setEditForm((s) => (s ? { ...s, startsLocal: e.target.value } : s))}
                    className="mt-2 w-full rounded-2xl border border-white/85 bg-white/55 px-4 py-3 text-sm text-luxury-ink outline-none focus:ring-2 focus:ring-[#ff7a00]/25"
                  />
                </label>
                <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-luxury-soft">
                  Fin *
                  <input
                    type="datetime-local"
                    required
                    value={editForm.endsLocal}
                    onChange={(e) => setEditForm((s) => (s ? { ...s, endsLocal: e.target.value } : s))}
                    className="mt-2 w-full rounded-2xl border border-white/85 bg-white/55 px-4 py-3 text-sm text-luxury-ink outline-none focus:ring-2 focus:ring-[#ff7a00]/25"
                  />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-luxury-soft">
                  Format
                  <select
                    value={editForm.courseFormat}
                    onChange={(e) =>
                      setEditForm((s) =>
                        s
                          ? {
                              ...s,
                              courseFormat: e.target.value as 'online' | 'onsite',
                              capacityMax: e.target.value === 'online' ? '' : s.capacityMax,
                            }
                          : s,
                      )
                    }
                    className="mt-2 w-full rounded-2xl border border-white/85 bg-white/55 px-4 py-3 text-sm text-luxury-ink outline-none focus:ring-2 focus:ring-[#ff7a00]/25"
                  >
                    <option value="online">En ligne</option>
                    <option value="onsite">Présentiel</option>
                  </select>
                </label>
                <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-luxury-soft">
                  Catégorie
                  <select
                    value={editForm.courseCategory}
                    onChange={(e) =>
                      setEditForm((s) =>
                        s ? { ...s, courseCategory: e.target.value as 'individual' | 'group' } : s,
                      )
                    }
                    className="mt-2 w-full rounded-2xl border border-white/85 bg-white/55 px-4 py-3 text-sm text-luxury-ink outline-none focus:ring-2 focus:ring-[#ff7a00]/25"
                  >
                    <option value="group">Collectif</option>
                    <option value="individual">Individuel</option>
                  </select>
                </label>
              </div>
              {editForm.courseFormat === 'onsite' ? (
                <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-luxury-soft">
                  Ville
                  <select
                    value={editForm.city}
                    onChange={(e) => setEditForm((s) => (s ? { ...s, city: e.target.value as 'Nantes' | 'Mexico' } : s))}
                    className="mt-2 w-full rounded-2xl border border-white/85 bg-white/55 px-4 py-3 text-sm text-luxury-ink outline-none focus:ring-2 focus:ring-[#ff7a00]/25"
                  >
                    <option value="Nantes">Nantes</option>
                    <option value="Mexico">Mexico</option>
                  </select>
                </label>
              ) : null}
              {editForm.courseFormat === 'onsite' ? (
                <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-luxury-soft">
                  Capacité (places)
                  <input
                    type="number"
                    min={1}
                    value={editForm.capacityMax}
                    onChange={(e) => setEditForm((s) => (s ? { ...s, capacityMax: e.target.value } : s))}
                    placeholder="Illimité si vide"
                    className="mt-2 w-full rounded-2xl border border-white/85 bg-white/55 px-4 py-3 text-sm text-luxury-ink outline-none focus:ring-2 focus:ring-[#ff7a00]/25"
                  />
                </label>
              ) : null}
              <label className="flex items-center gap-2 text-sm text-brand-ink/70">
                <input
                  type="checkbox"
                  checked={!editForm.isPublished}
                  onChange={(e) => setEditForm((s) => (s ? { ...s, isPublished: !e.target.checked } : s))}
                  className="rounded border-brand-ink/20"
                />
                Enregistrer comme Brouillon
              </label>
              <button
                type="submit"
                disabled={isPending}
                className="rounded-full bg-[#ff7a00] px-7 py-3 text-[10px] font-bold uppercase tracking-widest text-white shadow-[0_0_0_1px_rgba(255,255,255,0.25)_inset,0_8px_26px_rgba(255,122,0,0.45)] transition hover:-translate-y-0.5 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.25)_inset,0_12px_32px_rgba(255,122,0,0.58)] disabled:opacity-50"
              >
                Enregistrer
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
