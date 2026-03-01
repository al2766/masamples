'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { Product, ProductSize } from '@/lib/types';
import Image from 'next/image';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  CheckCircle,
  Package,
  Loader2,
  ImageIcon,
} from 'lucide-react';
import { searchPerfumes } from '@/data/perfumes';

interface PerfumeSuggestion {
  id?: string;
  name: string;
  brand: string;
  image?: string;
  url?: string;
  category?: 'mens' | 'womens' | 'unisex';
  scentProfiles?: string[];
  notes?: { top?: string[]; middle?: string[]; base?: string[] };
  source: 'fragrantica' | 'local';
}

interface PricingSettings {
  costPerMl: number;
  packagingCost: number;
  shippingCost: number;
  extraFees: number;
  profitMargin: number;
}

function calcPrice(ml: number, p: PricingSettings): number {
  if (p.profitMargin >= 100 || ml <= 0) return 0;
  const cost = ml * p.costPerMl + p.packagingCost + p.shippingCost + p.extraFees;
  return Math.round((cost / (1 - p.profitMargin / 100)) * 100) / 100;
}

function parseMl(sizeStr: string): number {
  const m = sizeStr.match(/(\d+(?:\.\d+)?)\s*ml/i);
  return m ? parseFloat(m[1]) : 0;
}

const CATEGORIES = ['mens', 'womens', 'unisex'] as const;
const SCENT_PROFILES = ['floral', 'ambery', 'woody', 'fresh', 'aromatic'];
const DEFAULT_SIZES: ProductSize[] = [
  { size: '2ml', price: 0 },
  { size: '5ml', price: 0 },
  { size: '10ml', price: 0 },
];

const EMPTY_PRODUCT: Omit<Product, 'id'> = {
  name: '',
  brand: '',
  price: 0,
  size: '5ml',
  category: 'unisex',
  inStock: true,
  image: '',
  description: '',
  isBestSeller: false,
  isNewArrival: false,
  isInspiredBy: false,
  notes: { top: [], middle: [], base: [] },
  sizes: DEFAULT_SIZES,
  scentProfiles: [],
  specificNotes: [],
};

function notesFromString(s: string): string[] {
  return s.split(',').map((n) => n.trim()).filter(Boolean);
}

function notesToString(arr: string[] = []): string {
  return arr.join(', ');
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<Omit<Product, 'id'>>(EMPTY_PRODUCT);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [topNotes, setTopNotes] = useState('');
  const [middleNotes, setMiddleNotes] = useState('');
  const [baseNotes, setBaseNotes] = useState('');
  const [pricing, setPricing] = useState<PricingSettings | null>(null);

  // Image upload
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Perfume auto-search state
  const [fragranceQuery, setFragranceQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PerfumeSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searching, setSearching] = useState(false);
  const [fetchingDetails, setFetchingDetails] = useState(false);

  // Fragrantica first, local DB as fallback if empty/error
  useEffect(() => {
    const q = fragranceQuery.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      setSearching(false);
      return;
    }

    setSearching(true);
    const id = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search-perfume?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setSuggestions(data.map((r: Omit<PerfumeSuggestion, 'source'>) => ({ ...r, source: 'fragrantica' as const })));
            setShowSuggestions(true);
            return;
          }
        }
      } catch { /* fall through to local */ }
      // Fragrantica returned nothing — show local fallback
      const local = searchPerfumes(q).map((p) => ({ ...p, source: 'local' as const }));
      setSuggestions(local);
      setShowSuggestions(local.length > 0);
    }, 600);

    return () => { clearTimeout(id); setSearching(false); };
  }, [fragranceQuery]);

  // Clear searching state when effect cleanup runs
  useEffect(() => {
    if (fragranceQuery.trim().length < 2) setSearching(false);
  }, [fragranceQuery]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [snap, settingsSnap] = await Promise.all([
        getDocs(collection(db, 'products')),
        getDoc(doc(db, 'settings', 'pricing')),
      ]);
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product)));
      if (settingsSnap.exists()) setPricing(settingsSnap.data() as PricingSettings);
    } catch (err) {
      console.error('Failed to load:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const clearImageState = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview('');
  };

  const openAdd = () => {
    setEditing(null);
    // Apply auto-priced default sizes if pricing available
    const sizes = pricing
      ? DEFAULT_SIZES.map((s) => {
          const ml = parseMl(s.size);
          return { ...s, price: ml ? calcPrice(ml, pricing) : s.price };
        })
      : DEFAULT_SIZES;
    setForm({ ...EMPTY_PRODUCT, sizes });
    setTopNotes('');
    setMiddleNotes('');
    setBaseNotes('');
    setFragranceQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    clearImageState();
    setModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({ ...p });
    setTopNotes(notesToString(p.notes?.top));
    setMiddleNotes(notesToString(p.notes?.middle));
    setBaseNotes(notesToString(p.notes?.base));
    setFragranceQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    clearImageState();
    setModalOpen(true);
  };

  const closeModal = () => {
    clearImageState();
    setModalOpen(false);
    setEditing(null);
  };

  const selectSuggestion = async (result: PerfumeSuggestion) => {
    setForm((f) => ({
      ...f,
      name: result.name,
      brand: result.brand,
      category: result.category ?? f.category,
      scentProfiles: result.scentProfiles ?? f.scentProfiles,
      ...(result.image ? { image: result.image } : {}),
    }));
    if (result.notes?.top)    setTopNotes(result.notes.top.join(', '));
    if (result.notes?.middle) setMiddleNotes(result.notes.middle.join(', '));
    if (result.notes?.base)   setBaseNotes(result.notes.base.join(', '));
    setFragranceQuery(`${result.name} — ${result.brand}`);
    setShowSuggestions(false);

    if (result.source === 'fragrantica' && result.url) {
      setFetchingDetails(true);
      try {
        const res = await fetch(`/api/perfume-details?url=${encodeURIComponent(result.url)}`);
        if (res.ok) {
          const d = await res.json();
          setForm((f) => ({
            ...f,
            ...(d.image ? { image: d.image } : {}),
            ...(d.description ? { description: d.description } : {}),
            ...(d.scentProfiles?.length ? { scentProfiles: d.scentProfiles } : {}),
          }));
          if (d.notes?.top?.length)    setTopNotes(d.notes.top.join(', '));
          if (d.notes?.middle?.length) setMiddleNotes(d.notes.middle.join(', '));
          if (d.notes?.base?.length)   setBaseNotes(d.notes.base.join(', '));
        }
      } catch { /* keep what we have */ }
      finally { setFetchingDetails(false); }
    }
  };

  const handleSave = async () => {
    setSaving(true);
    let imageUrl = form.image;

    if (imageFile) {
      setUploadingImage(true);
      try {
        const path = `products/${Date.now()}-${imageFile.name.replace(/\s+/g, '_')}`;
        const sRef = storageRef(storage, path);
        await uploadBytes(sRef, imageFile);
        imageUrl = await getDownloadURL(sRef);
      } catch (err) {
        console.error('Image upload failed:', err);
      } finally {
        setUploadingImage(false);
      }
    }

    const data = {
      ...form,
      image: imageUrl,
      price: form.sizes?.[0]?.price || form.price,
      notes: {
        top: notesFromString(topNotes),
        middle: notesFromString(middleNotes),
        base: notesFromString(baseNotes),
      },
    };

    try {
      if (editing?.id) {
        await updateDoc(doc(db, 'products', editing.id), { ...data, updatedAt: serverTimestamp() });
        setProducts((ps) => ps.map((p) => p.id === editing.id ? { ...data, id: editing.id } : p));
      } else {
        const ref = await addDoc(collection(db, 'products'), { ...data, createdAt: serverTimestamp() });
        setProducts((ps) => [...ps, { ...data, id: ref.id }]);
      }
      closeModal();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    setDeleting(id);
    await deleteDoc(doc(db, 'products', id));
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setDeleting(null);
  };

  const updateSize = (index: number, field: 'size' | 'price', value: string | number) => {
    setForm((f) => {
      const sizes = [...(f.sizes || [])];
      const updated = { ...sizes[index], [field]: value };
      // Auto-calculate price when size label changes and pricing is loaded
      if (field === 'size' && pricing) {
        const ml = parseMl(String(value));
        if (ml > 0) updated.price = calcPrice(ml, pricing);
      }
      sizes[index] = updated;
      return { ...f, sizes, price: sizes[0]?.price || f.price };
    });
  };

  const addSizeRow = () =>
    setForm((f) => ({ ...f, sizes: [...(f.sizes || []), { size: '', price: 0 }] }));

  const removeSizeRow = (i: number) =>
    setForm((f) => ({ ...f, sizes: (f.sizes || []).filter((_, idx) => idx !== i) }));

  const toggleScent = (s: string) =>
    setForm((f) => ({
      ...f,
      scentProfiles: f.scentProfiles?.includes(s)
        ? f.scentProfiles.filter((x) => x !== s)
        : [...(f.scentProfiles || []), s],
    }));

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="mt-1 text-sm text-gray-500">{products.length} perfume(s) listed</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-600"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Add Perfume</span>
        </button>
      </div>

      {/* Search */}
      <div className="mb-4 flex items-center gap-3 rounded-xl bg-white px-4 py-2.5 shadow-sm">
        <Search size={16} className="text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or brand…"
          className="flex-1 text-sm outline-none placeholder:text-gray-400"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={24} className="animate-spin text-gray-300" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-white py-16 text-center shadow-sm">
          <Package size={40} className="mx-auto mb-3 text-gray-200" />
          <p className="text-sm text-gray-400">
            {search ? 'No products match your search' : 'No products yet — add your first perfume'}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile: card list */}
          <div className="md:hidden space-y-3">
            {filtered.map((p) => (
              <div key={p.id} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
                {p.image ? (
                  <Image src={p.image} alt={p.name} width={52} height={52} className="h-13 w-13 rounded-xl object-cover shrink-0" unoptimized />
                ) : (
                  <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-xl bg-gray-100">
                    <Package size={20} className="text-gray-300" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{p.name}</p>
                  <p className="text-sm text-gray-500 truncate">{p.brand}</p>
                  <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-gray-900">£{p.price?.toFixed(2)}</span>
                    {p.inStock ? (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">In stock</span>
                    ) : (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">Sold out</span>
                    )}
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs capitalize text-gray-600">{p.category}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <button onClick={() => openEdit(p)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => p.id && handleDelete(p.id)} disabled={deleting === p.id} className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500">
                    {deleting === p.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden md:block rounded-2xl bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wide text-gray-400">
                  <th className="px-6 py-3">Product</th>
                  <th className="px-6 py-3">Brand</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">From</th>
                  <th className="px-6 py-3">Stock</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        {p.image ? (
                          <Image src={p.image} alt={p.name} width={40} height={40} className="h-10 w-10 rounded-lg object-cover" unoptimized />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-300">
                            <Package size={18} />
                          </div>
                        )}
                        <span className="font-medium text-gray-900">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-gray-600">{p.brand}</td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium capitalize text-gray-600">
                        {p.category}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-medium text-gray-900">£{p.price?.toFixed(2)}</td>
                    <td className="px-6 py-3.5">
                      {p.inStock ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                          <CheckCircle size={11} /> In stock
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-600">
                          Sold out
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(p)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => p.id && handleDelete(p.id)} disabled={deleting === p.id} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500">
                          {deleting === p.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/50 md:flex md:items-start md:justify-center md:bg-black/40 md:px-4 md:py-8"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="modal-enter min-h-screen md:min-h-0 w-full md:max-w-2xl bg-white md:rounded-2xl shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="font-semibold text-gray-900">
                {editing ? `Edit: ${editing.name}` : 'Add New Perfume'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6 px-6 py-6">

              {/* Perfume search */}
              <div className="relative">
                <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3">
                  {searching || fetchingDetails
                    ? <Loader2 size={15} className="shrink-0 animate-spin text-gray-400" />
                    : <Search size={15} className="shrink-0 text-gray-400" />
                  }
                  <input
                    value={fragranceQuery}
                    onChange={(e) => setFragranceQuery(e.target.value)}
                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                    placeholder="Search perfume to auto-fill…"
                    className="flex-1 bg-transparent py-2.5 text-sm outline-none placeholder:text-gray-400"
                  />
                  {fragranceQuery && (
                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => { setFragranceQuery(''); setSuggestions([]); setShowSuggestions(false); }}
                      className="text-gray-300 hover:text-gray-500"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg">
                    {suggestions.map((result) => (
                      <button
                        key={`${result.source}-${result.id ?? result.brand}-${result.name}`}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => selectSuggestion(result)}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-gray-50"
                      >
                        {result.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={result.image}
                            alt={result.name}
                            className="h-10 w-10 shrink-0 rounded-lg bg-gray-100 object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        ) : (
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                            <Package size={14} className="text-gray-400" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gray-900">{result.name}</p>
                          <p className="truncate text-xs text-gray-500">
                            {result.brand}
                            {result.category && <> · <span className="capitalize">{result.category}</span></>}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Basic Info */}
              <section>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Basic Info</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Name *</label>
                    <input
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-400"
                      placeholder="e.g. Sauvage"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Brand *</label>
                    <input
                      value={form.brand}
                      onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-400"
                      placeholder="e.g. Dior"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as Product['category'] }))}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-400"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c} className="capitalize">{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-3">
                  <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    rows={3}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-400"
                    placeholder="Describe the fragrance…"
                  />
                </div>
              </section>

              {/* Product Image */}
              <section>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Product Image</h3>

                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (imagePreview) URL.revokeObjectURL(imagePreview);
                    setImageFile(file);
                    setImagePreview(URL.createObjectURL(file));
                    setForm((f) => ({ ...f, image: '' }));
                  }}
                />

                <div
                  onClick={() => imageInputRef.current?.click()}
                  className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 transition-colors hover:border-amber-300 hover:bg-amber-50/30"
                >
                  {imagePreview || form.image ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imagePreview || form.image}
                        alt="Product preview"
                        className="max-h-48 max-w-full rounded-xl object-contain p-2"
                      />
                      <p className="mt-2 text-xs text-gray-400">Click to change image</p>
                    </>
                  ) : (
                    <>
                      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
                        <ImageIcon size={24} className="text-gray-300" />
                      </div>
                      <p className="text-sm font-semibold text-gray-500">Add Image</p>
                      <p className="mt-1 text-xs text-gray-400">Tap to choose from your device</p>
                      <p className="mt-0.5 text-xs text-gray-300">PNG · JPG · WebP</p>
                    </>
                  )}
                </div>

                <input
                  value={imageFile ? '' : (form.image || '')}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, image: e.target.value }));
                    if (imageFile) clearImageState();
                  }}
                  className="mt-2 w-full rounded-lg border border-gray-100 bg-gray-50 px-3 py-1.5 text-xs text-gray-400 outline-none focus:border-gray-200 placeholder:text-gray-300"
                  placeholder="or paste an image URL…"
                />
              </section>

              {/* Sizes & Pricing */}
              <section>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Sizes & Pricing</h3>
                <div className="space-y-2">
                  {(form.sizes || []).map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        value={s.size}
                        onChange={(e) => updateSize(i, 'size', e.target.value)}
                        placeholder="e.g. 5ml"
                        className="w-28 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-400"
                      />
                      <span className="text-gray-400">£</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={s.price}
                        onChange={(e) => updateSize(i, 'price', parseFloat(e.target.value) || 0)}
                        className="w-28 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-400"
                      />
                      <button onClick={() => removeSizeRow(i)} className="text-gray-400 hover:text-red-500">
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addSizeRow}
                    className="mt-1 flex items-center gap-1 text-sm font-medium text-amber-500 hover:text-amber-600"
                  >
                    <Plus size={14} /> Add size
                  </button>
                </div>
              </section>

              {/* Flags */}
              <section>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Flags</h3>
                <div className="flex flex-wrap gap-4">
                  {[
                    { key: 'inStock', label: 'In Stock' },
                    { key: 'isBestSeller', label: 'Best Seller' },
                    { key: 'isNewArrival', label: 'New Arrival' },
                    { key: 'isInspiredBy', label: 'Inspired By' },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={!!form[key as keyof typeof form]}
                        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.checked }))}
                        className="h-4 w-4 accent-amber-500"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </section>

              {/* Scent Profiles */}
              <section>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Scent Profiles</h3>
                <div className="flex flex-wrap gap-2">
                  {SCENT_PROFILES.map((s) => (
                    <button
                      key={s}
                      onClick={() => toggleScent(s)}
                      className={`rounded-full px-3 py-1 text-sm font-medium capitalize transition ${
                        form.scentProfiles?.includes(s)
                          ? 'bg-amber-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </section>

              {/* Fragrance Notes */}
              <section>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Fragrance Notes</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Top notes', value: topNotes, set: setTopNotes },
                    { label: 'Middle notes', value: middleNotes, set: setMiddleNotes },
                    { label: 'Base notes', value: baseNotes, set: setBaseNotes },
                  ].map(({ label, value, set }) => (
                    <div key={label}>
                      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
                      <input
                        value={value}
                        onChange={(e) => set(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-400"
                        placeholder="Bergamot, Lemon…"
                      />
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
              <button
                onClick={closeModal}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || uploadingImage || !form.name || !form.brand}
                className="flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-60"
              >
                {(saving || uploadingImage) && <Loader2 size={14} className="animate-spin" />}
                {uploadingImage ? 'Uploading…' : saving ? 'Saving…' : editing ? 'Save changes' : 'Add perfume'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
