'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
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
  replay_url: string | null;
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
  startsLocal: string;
  endsLocal: string;
  courseFormat: 'online' | 'onsite';
  courseCategory: 'individual' | 'group';
  capacityMax: string;
  isPublished: boolean;
  location: string;
  liveUrl: string;
  replayUrl: string;
};

function emptyCreateForm(): FormState {
  const start = new Date();
  start.setMinutes(0, 0, 0);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  return {
    title: '',
    description: '',
    startsLocal: toDatetimeLocalValue(start.toISOString()),
    endsLocal: toDatetimeLocalValue(end.toISOString()),
    courseFormat: 'online',
    courseCategory: 'group',
    capacityMax: '',
    isPublished: false,
    location: '',
    liveUrl: '',
    replayUrl: '',
  };
}

function courseToFormState(c: AdminCourseRow): FormState {
  return {
    title: c.title,
    description: c.description ?? '',
    startsLocal: toDatetimeLocalValue(c.starts_at),
    endsLocal: toDatetimeLocalValue(c.ends_at),
    courseFormat: c.course_format,
    courseCategory: c.course_category,
    capacityMax: c.capacity_max != null ? String(c.capacity_max) : '',
    isPublished: c.is_published,
    location: c.location ?? '',
    liveUrl: c.live_url ?? '',
    replayUrl: c.replay_url ?? '',
  };
}

function parseCapacity(cap: string): number | null {
  const t = cap.trim();
  if (!t) return null;
  const n = Number.parseInt(t, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function formToPayload(f: FormState) {
  return {
    title: f.title,
    description: f.description.trim() || null,
    startsAt: isoFromDatetimeLocal(f.startsLocal),
    endsAt: isoFromDatetimeLocal(f.endsLocal),
    courseFormat: f.courseFormat,
    courseCategory: f.courseCategory,
    capacityMax: parseCapacity(f.capacityMax),
    isPublished: f.isPublished,
    location: f.location.trim() || null,
    liveUrl: f.liveUrl.trim() || null,
    replayUrl: f.replayUrl.trim() || null,
    timezone: 'Europe/Paris',
  };
}

export function AdminCoursesManager({ courses }: Props) {
  const router = useRouter();
  const [notice, setNotice] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [editing, setEditing] = useState<AdminCourseRow | null>(null);
  const [editForm, setEditForm] = useState<FormState | null>(null);
  const [createForm, setCreateForm] = useState<FormState>(() => emptyCreateForm());
  const [isPending, startTransition] = useTransition();

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
        setCreateForm(emptyCreateForm());
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
          <h2 className="font-serif text-2xl italic text-brand-ink">Séances</h2>
          <p className="mt-1 text-sm text-brand-ink/55">
            Seuls les cours <strong>publiés</strong> apparaissent sur le calendrier client (/compte).
          </p>
        </div>
        <Link
          href="/admin"
          className="rounded-full border border-brand-ink/10 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-brand-ink/70 hover:bg-brand-sand/30"
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

      <section className="rounded-[24px] border border-brand-ink/[0.06] bg-white p-6 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.15em] text-brand-ink/50">
          <Plus size={16} className="text-brand-accent" />
          Nouvelle séance
        </h3>
        <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-2">
          <label className="md:col-span-2 block text-[10px] font-bold uppercase tracking-wider text-brand-ink/45">
            Titre *
            <input
              required
              value={createForm.title}
              onChange={(e) => setCreateForm((s) => ({ ...s, title: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-brand-ink/[0.08] bg-brand-beige/30 px-3 py-2 text-sm"
            />
          </label>
          <label className="md:col-span-2 block text-[10px] font-bold uppercase tracking-wider text-brand-ink/45">
            Description
            <textarea
              rows={3}
              value={createForm.description}
              onChange={(e) => setCreateForm((s) => ({ ...s, description: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-brand-ink/[0.08] bg-brand-beige/30 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-ink/45">
            Début *
            <input
              type="datetime-local"
              required
              value={createForm.startsLocal}
              onChange={(e) => setCreateForm((s) => ({ ...s, startsLocal: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-brand-ink/[0.08] bg-brand-beige/30 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-ink/45">
            Fin *
            <input
              type="datetime-local"
              required
              value={createForm.endsLocal}
              onChange={(e) => setCreateForm((s) => ({ ...s, endsLocal: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-brand-ink/[0.08] bg-brand-beige/30 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-ink/45">
            Format
            <select
              value={createForm.courseFormat}
              onChange={(e) =>
                setCreateForm((s) => ({ ...s, courseFormat: e.target.value as 'online' | 'onsite' }))
              }
              className="mt-1 w-full rounded-xl border border-brand-ink/[0.08] bg-brand-beige/30 px-3 py-2 text-sm"
            >
              <option value="online">En ligne</option>
              <option value="onsite">Présentiel</option>
            </select>
          </label>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-ink/45">
            Catégorie
            <select
              value={createForm.courseCategory}
              onChange={(e) =>
                setCreateForm((s) => ({ ...s, courseCategory: e.target.value as 'individual' | 'group' }))
              }
              className="mt-1 w-full rounded-xl border border-brand-ink/[0.08] bg-brand-beige/30 px-3 py-2 text-sm"
            >
              <option value="group">Collectif</option>
              <option value="individual">Individuel</option>
            </select>
          </label>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-ink/45">
            Capacité max (places)
            <input
              type="number"
              min={1}
              value={createForm.capacityMax}
              onChange={(e) => setCreateForm((s) => ({ ...s, capacityMax: e.target.value }))}
              placeholder="Illimité si vide"
              className="mt-1 w-full rounded-xl border border-brand-ink/[0.08] bg-brand-beige/30 px-3 py-2 text-sm"
            />
          </label>
          <label className="flex items-center gap-2 pt-6 text-sm text-brand-ink/70">
            <input
              type="checkbox"
              checked={createForm.isPublished}
              onChange={(e) => setCreateForm((s) => ({ ...s, isPublished: e.target.checked }))}
              className="rounded border-brand-ink/20"
            />
            Publié (visible calendrier client)
          </label>
          <label className="md:col-span-2 block text-[10px] font-bold uppercase tracking-wider text-brand-ink/45">
            Lieu (présentiel)
            <input
              value={createForm.location}
              onChange={(e) => setCreateForm((s) => ({ ...s, location: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-brand-ink/[0.08] bg-brand-beige/30 px-3 py-2 text-sm"
              placeholder="Studio Nantes…"
            />
          </label>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-ink/45">
            URL live
            <input
              value={createForm.liveUrl}
              onChange={(e) => setCreateForm((s) => ({ ...s, liveUrl: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-brand-ink/[0.08] bg-brand-beige/30 px-3 py-2 text-sm"
              placeholder="https://…"
            />
          </label>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-ink/45">
            URL replay
            <input
              value={createForm.replayUrl}
              onChange={(e) => setCreateForm((s) => ({ ...s, replayUrl: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-brand-ink/[0.08] bg-brand-beige/30 px-3 py-2 text-sm"
              placeholder="https://…"
            />
          </label>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-full bg-brand-accent px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-white disabled:opacity-50"
            >
              Créer la séance
            </button>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-[24px] border border-brand-ink/[0.06] bg-white shadow-sm">
        <div className="border-b border-brand-ink/[0.06] px-6 py-4">
          <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-brand-ink/50">Toutes les séances</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-brand-ink/[0.06] bg-brand-beige/40 text-[10px] uppercase tracking-wider text-brand-ink/45">
                <th className="px-4 py-3">Titre</th>
                <th className="px-4 py-3">Début</th>
                <th className="px-4 py-3">Format</th>
                <th className="px-4 py-3">Places max</th>
                <th className="px-4 py-3">Publié</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-brand-ink/85">
              {courses.map((c) => (
                <tr key={c.id} className="border-b border-brand-ink/[0.04] hover:bg-brand-beige/20">
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
              ))}
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
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-brand-ink/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[24px] border border-brand-ink/[0.08] bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-serif text-xl italic">Modifier la séance</h3>
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
            <form onSubmit={handleUpdate} className="grid gap-4">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-ink/45">
                Titre *
                <input
                  required
                  value={editForm.title}
                  onChange={(e) => setEditForm((s) => (s ? { ...s, title: e.target.value } : s))}
                  className="mt-1 w-full rounded-xl border border-brand-ink/[0.08] px-3 py-2 text-sm"
                />
              </label>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-ink/45">
                Description
                <textarea
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm((s) => (s ? { ...s, description: e.target.value } : s))}
                  className="mt-1 w-full rounded-xl border border-brand-ink/[0.08] px-3 py-2 text-sm"
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-ink/45">
                  Début *
                  <input
                    type="datetime-local"
                    required
                    value={editForm.startsLocal}
                    onChange={(e) => setEditForm((s) => (s ? { ...s, startsLocal: e.target.value } : s))}
                    className="mt-1 w-full rounded-xl border border-brand-ink/[0.08] px-3 py-2 text-sm"
                  />
                </label>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-ink/45">
                  Fin *
                  <input
                    type="datetime-local"
                    required
                    value={editForm.endsLocal}
                    onChange={(e) => setEditForm((s) => (s ? { ...s, endsLocal: e.target.value } : s))}
                    className="mt-1 w-full rounded-xl border border-brand-ink/[0.08] px-3 py-2 text-sm"
                  />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-ink/45">
                  Format
                  <select
                    value={editForm.courseFormat}
                    onChange={(e) =>
                      setEditForm((s) =>
                        s ? { ...s, courseFormat: e.target.value as 'online' | 'onsite' } : s,
                      )
                    }
                    className="mt-1 w-full rounded-xl border border-brand-ink/[0.08] px-3 py-2 text-sm"
                  >
                    <option value="online">En ligne</option>
                    <option value="onsite">Présentiel</option>
                  </select>
                </label>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-ink/45">
                  Catégorie
                  <select
                    value={editForm.courseCategory}
                    onChange={(e) =>
                      setEditForm((s) =>
                        s ? { ...s, courseCategory: e.target.value as 'individual' | 'group' } : s,
                      )
                    }
                    className="mt-1 w-full rounded-xl border border-brand-ink/[0.08] px-3 py-2 text-sm"
                  >
                    <option value="group">Collectif</option>
                    <option value="individual">Individuel</option>
                  </select>
                </label>
              </div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-ink/45">
                Capacité max
                <input
                  type="number"
                  min={1}
                  value={editForm.capacityMax}
                  onChange={(e) => setEditForm((s) => (s ? { ...s, capacityMax: e.target.value } : s))}
                  placeholder="Illimité si vide"
                  className="mt-1 w-full rounded-xl border border-brand-ink/[0.08] px-3 py-2 text-sm"
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-brand-ink/70">
                <input
                  type="checkbox"
                  checked={editForm.isPublished}
                  onChange={(e) => setEditForm((s) => (s ? { ...s, isPublished: e.target.checked } : s))}
                  className="rounded border-brand-ink/20"
                />
                Publié (visible calendrier client)
              </label>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-ink/45">
                Lieu
                <input
                  value={editForm.location}
                  onChange={(e) => setEditForm((s) => (s ? { ...s, location: e.target.value } : s))}
                  className="mt-1 w-full rounded-xl border border-brand-ink/[0.08] px-3 py-2 text-sm"
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-ink/45">
                  URL live
                  <input
                    value={editForm.liveUrl}
                    onChange={(e) => setEditForm((s) => (s ? { ...s, liveUrl: e.target.value } : s))}
                    className="mt-1 w-full rounded-xl border border-brand-ink/[0.08] px-3 py-2 text-sm"
                  />
                </label>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-ink/45">
                  URL replay
                  <input
                    value={editForm.replayUrl}
                    onChange={(e) => setEditForm((s) => (s ? { ...s, replayUrl: e.target.value } : s))}
                    className="mt-1 w-full rounded-xl border border-brand-ink/[0.08] px-3 py-2 text-sm"
                  />
                </label>
              </div>
              <button
                type="submit"
                disabled={isPending}
                className="rounded-full bg-brand-accent px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-white disabled:opacity-50"
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
