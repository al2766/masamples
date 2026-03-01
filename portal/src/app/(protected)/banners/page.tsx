'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Banner } from '@/lib/types';
import { Plus, Trash2, Pencil, X, Loader2, Megaphone, ToggleLeft, ToggleRight } from 'lucide-react';

const BANNER_TYPES = ['sale', 'announcement', 'promotion'] as const;

const EMPTY: Omit<Banner, 'id'> = {
  title: '',
  message: '',
  type: 'announcement',
  backgroundColor: '#030213',
  textColor: '#ffffff',
  active: false,
  link: '',
};

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [form, setForm] = useState<Omit<Banner, 'id'>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const snap = await getDocs(collection(db, 'banners'));
    setBanners(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Banner)));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY);
    setModalOpen(true);
  };

  const openEdit = (b: Banner) => {
    setEditing(b);
    setForm({ title: b.title, message: b.message, type: b.type, backgroundColor: b.backgroundColor, textColor: b.textColor, active: b.active, link: b.link || '' });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editing?.id) {
        await updateDoc(doc(db, 'banners', editing.id), { ...form });
      } else {
        await addDoc(collection(db, 'banners'), { ...form, createdAt: serverTimestamp() });
      }
      setModalOpen(false);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (b: Banner) => {
    if (!b.id) return;
    await updateDoc(doc(db, 'banners', b.id), { active: !b.active });
    setBanners((prev) => prev.map((x) => (x.id === b.id ? { ...x, active: !x.active } : x)));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this banner?')) return;
    setDeleting(id);
    await deleteDoc(doc(db, 'banners', id));
    setBanners((prev) => prev.filter((b) => b.id !== id));
    setDeleting(null);
  };

  const typeColors: Record<string, string> = {
    sale: 'bg-red-100 text-red-600',
    announcement: 'bg-blue-100 text-blue-600',
    promotion: 'bg-purple-100 text-purple-600',
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Banners & Promos</h1>
          <p className="mt-1 text-sm text-gray-500">Manage site-wide announcements and sale banners</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-600"
        >
          <Plus size={16} /> New Banner
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={24} className="animate-spin text-gray-300" />
        </div>
      ) : banners.length === 0 ? (
        <div className="rounded-2xl bg-white py-16 text-center shadow-sm">
          <Megaphone size={40} className="mx-auto mb-3 text-gray-200" />
          <p className="text-sm text-gray-400">No banners yet — create your first announcement or sale</p>
        </div>
      ) : (
        <div className="space-y-4">
          {banners.map((b) => (
            <div key={b.id} className="overflow-hidden rounded-2xl bg-white shadow-sm">
              {/* Preview strip */}
              <div
                className="px-6 py-3 text-sm font-medium"
                style={{ backgroundColor: b.backgroundColor, color: b.textColor }}
              >
                {b.title} {b.message && <span className="opacity-80">— {b.message}</span>}
              </div>

              <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${typeColors[b.type] || 'bg-gray-100 text-gray-600'}`}>
                    {b.type}
                  </span>
                  {b.link && (
                    <span className="truncate text-xs text-gray-400 max-w-xs">{b.link}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleActive(b)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      b.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {b.active ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                    {b.active ? 'Live' : 'Hidden'}
                  </button>
                  <button
                    onClick={() => openEdit(b)}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => b.id && handleDelete(b.id)}
                    disabled={deleting === b.id}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                  >
                    {deleting === b.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 md:flex md:items-center md:justify-center md:bg-black/40 md:px-4">
          <div className="min-h-screen md:min-h-0 w-full md:max-w-md bg-white md:rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="font-semibold text-gray-900">{editing ? 'Edit Banner' : 'New Banner'}</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Title *</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-400"
                  placeholder="e.g. Summer Sale"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Message</label>
                <input
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-400"
                  placeholder="e.g. Up to 30% off all samples"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Link (optional)</label>
                <input
                  value={form.link}
                  onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-400"
                  placeholder="https://masamples.vercel.app/shop"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as Banner['type'] }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-400"
                >
                  {BANNER_TYPES.map((t) => (
                    <option key={t} value={t} className="capitalize">{t}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="mb-1 block text-sm font-medium text-gray-700">Background</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.backgroundColor}
                      onChange={(e) => setForm((f) => ({ ...f, backgroundColor: e.target.value }))}
                      className="h-9 w-9 cursor-pointer rounded-lg border border-gray-200"
                    />
                    <input
                      value={form.backgroundColor}
                      onChange={(e) => setForm((f) => ({ ...f, backgroundColor: e.target.value }))}
                      className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-sm font-medium text-gray-700">Text colour</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.textColor}
                      onChange={(e) => setForm((f) => ({ ...f, textColor: e.target.value }))}
                      className="h-9 w-9 cursor-pointer rounded-lg border border-gray-200"
                    />
                    <input
                      value={form.textColor}
                      onChange={(e) => setForm((f) => ({ ...f, textColor: e.target.value }))}
                      className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              </div>

              {/* Live preview */}
              <div
                className="rounded-lg px-4 py-2.5 text-sm font-medium"
                style={{ backgroundColor: form.backgroundColor, color: form.textColor }}
              >
                {form.title || 'Preview'} {form.message && `— ${form.message}`}
              </div>

              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                  className="h-4 w-4 accent-amber-500"
                />
                Make banner live immediately
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
              <button onClick={() => setModalOpen(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.title}
                className="flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-60"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                {editing ? 'Save changes' : 'Create banner'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
