'use client';

import { useState, useEffect, useRef } from 'react';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import type { Product, ProductNotes } from '@/lib/types';

interface Pricing {
  costPerMl: number;
  packagingCost: number;
  shippingCost: number;
  extraFees: number;
  profitMargin: number;
}

interface SearchResult {
  id: string;
  name: string;
  brand: string;
  image: string;
  url?: string;
  category: 'mens' | 'womens' | 'unisex';
}

const EMPTY_FORM = {
  name: '',
  brand: '',
  description: '',
  category: 'unisex' as 'mens' | 'womens' | 'unisex',
  image: '',
  inStock: true,
  isBestSeller: false,
  isNewArrival: false,
  isInspiredBy: false,
  topNotes: '',
  middleNotes: '',
  baseNotes: '',
  scentProfiles: '',
  sizes: [{ size: '', price: 0 }],
};
type FormData = typeof EMPTY_FORM;

function calcAutoPrice(sizeStr: string, pricing: Pricing): number {
  const ml = parseFloat(sizeStr.replace(/[^\d.]/g, ''));
  if (!ml) return 0;
  const cost =
    ml * pricing.costPerMl +
    pricing.packagingCost +
    pricing.shippingCost +
    pricing.extraFees;
  return Math.round((cost / (1 - pricing.profitMargin / 100)) * 100) / 100;
}

function splitComma(s: string): string[] {
  return s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}

function productToForm(p: Product): FormData {
  return {
    name: p.name || '',
    brand: p.brand || '',
    description: p.description || '',
    category: p.category || 'unisex',
    image: p.image || '',
    inStock: p.inStock ?? true,
    isBestSeller: p.isBestSeller ?? false,
    isNewArrival: p.isNewArrival ?? false,
    isInspiredBy: p.isInspiredBy ?? false,
    topNotes: p.notes?.top?.join(', ') || '',
    middleNotes: p.notes?.middle?.join(', ') || '',
    baseNotes: p.notes?.base?.join(', ') || '',
    scentProfiles: p.scentProfiles?.join(', ') || '',
    sizes: p.sizes?.length
      ? p.sizes
      : [{ size: p.size || '', price: p.price || 0 }],
  };
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [fetchingSearch, setFetchingSearch] = useState(false);
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load products and pricing settings in parallel
  useEffect(() => {
    async function load() {
      try {
        const [prodSnap, pricingSnap] = await Promise.all([
          getDocs(collection(db, 'products')),
          getDoc(doc(db, 'settings', 'pricing')),
        ]);
        setProducts(
          prodSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Product))
        );
        if (pricingSnap.exists())
          setPricing(pricingSnap.data() as Pricing);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Algolia search with 600ms debounce — Fragrantica only, no local fallback shown first
  useEffect(() => {
    if (!search.trim()) {
      setSuggestions([]);
      setFetchingSearch(false);
      return;
    }
    setFetchingSearch(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search-perfume?q=${encodeURIComponent(search)}`
        );
        const data: SearchResult[] = await res.json();
        setSuggestions(data.length ? data : []);
      } catch {
        setSuggestions([]);
      } finally {
        setFetchingSearch(false);
      }
    }, 600);
    return () => clearTimeout(t);
  }, [search]);

  async function handleSuggestionClick(s: SearchResult) {
    setSuggestions([]);
    setSearch('');
    // Apply Algolia data immediately
    setForm((f) => ({
      ...f,
      name: s.name,
      brand: s.brand,
      image: s.image,
      category: s.category,
    }));
    // Then fetch page for description + notes
    if (s.url) {
      setFetchingDetails(true);
      try {
        const res = await fetch(
          `/api/perfume-details?url=${encodeURIComponent(s.url)}`
        );
        const d = await res.json();
        setForm((f) => ({
          ...f,
          description: d.description || f.description,
          image: d.image || f.image,
          topNotes: d.notes?.top?.join(', ') || f.topNotes,
          middleNotes: d.notes?.middle?.join(', ') || f.middleNotes,
          baseNotes: d.notes?.base?.join(', ') || f.baseNotes,
          scentProfiles: d.scentProfiles?.join(', ') || f.scentProfiles,
        }));
      } catch {
        /* keep existing form data */
      } finally {
        setFetchingDetails(false);
      }
    }
  }

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setSearch('');
    setSuggestions([]);
    setModalOpen(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm(productToForm(p));
    setSearch('');
    setSuggestions([]);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
    setSearch('');
    setSuggestions([]);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const storageRef = ref(storage, `products/${Date.now()}-${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setForm((f) => ({ ...f, image: url }));
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function updateSize(i: number, key: 'size' | 'price', value: string | number) {
    setForm((f) => {
      const sizes = [...f.sizes];
      if (key === 'size') {
        const sizeStr = value as string;
        const autoPrice =
          pricing ? calcAutoPrice(sizeStr, pricing) : sizes[i].price;
        sizes[i] = { ...sizes[i], size: sizeStr, price: autoPrice };
      } else {
        sizes[i] = { ...sizes[i], price: value as number };
      }
      return { ...f, sizes };
    });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const notes: ProductNotes = {
        top: splitComma(form.topNotes),
        middle: splitComma(form.middleNotes),
        base: splitComma(form.baseNotes),
      };
      const scentProfiles = splitComma(form.scentProfiles);
      const sizes = form.sizes.filter((s) => s.size.trim());
      const firstSize = sizes[0];

      const data: Omit<Product, 'id'> = {
        name: form.name,
        brand: form.brand,
        description: form.description,
        category: form.category,
        image: form.image,
        inStock: form.inStock,
        isBestSeller: form.isBestSeller,
        isNewArrival: form.isNewArrival,
        isInspiredBy: form.isInspiredBy,
        price: firstSize?.price ?? 0,
        size: firstSize?.size ?? '',
        notes,
        sizes,
        scentProfiles,
        updatedAt: new Date(),
      };

      if (editing?.id) {
        await updateDoc(doc(db, 'products', editing.id), data as Record<string, unknown>);
        setProducts((ps) =>
          ps.map((p) => (p.id === editing.id ? { ...data, id: editing.id } : p))
        );
      } else {
        const newRef = await addDoc(collection(db, 'products'), {
          ...data,
          createdAt: new Date(),
        });
        setProducts((ps) => [...ps, { ...data, id: newRef.id }]);
      }
      closeModal();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this product?')) return;
    setDeleting(id);
    try {
      await deleteDoc(doc(db, 'products', id));
      setProducts((ps) => ps.filter((p) => p.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  const FLAGS = [
    { label: 'In Stock', key: 'inStock' as const },
    { label: 'Best Seller', key: 'isBestSeller' as const },
    { label: 'New Arrival', key: 'isNewArrival' as const },
    { label: 'Inspired By', key: 'isInspiredBy' as const },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Product
        </button>
      </div>

      {/* Product grid */}
      {loading ? (
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          Loading…
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg mb-1">No products yet</p>
          <p className="text-sm">Click &ldquo;Add Product&rdquo; to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {products.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
            >
              {p.image ? (
                <img
                  src={p.image}
                  alt={p.name}
                  className="w-full aspect-square object-cover"
                />
              ) : (
                <div className="w-full aspect-square bg-gray-50 flex items-center justify-center">
                  <svg
                    className="w-10 h-10 text-gray-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                </div>
              )}
              <div className="p-3">
                <p className="text-xs text-gray-400 truncate">{p.brand}</p>
                <p className="text-sm font-semibold text-gray-900 truncate">{p.name}</p>
                <p className="text-sm text-amber-600 font-medium mt-0.5">
                  {p.sizes?.length
                    ? `from £${Math.min(...p.sizes.map((s) => s.price)).toFixed(2)}`
                    : `£${p.price.toFixed(2)}`}
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => openEdit(p)}
                    className="flex-1 text-xs font-medium text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 py-1.5 rounded-lg transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(p.id!)}
                    disabled={deleting === p.id}
                    className="flex-1 text-xs font-medium text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 py-1.5 rounded-lg transition-colors disabled:opacity-40"
                  >
                    {deleting === p.id ? '…' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="modal-enter bg-white rounded-2xl shadow-xl w-full max-w-2xl my-8">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                {editing ? 'Edit Product' : 'Add Product'}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSave} className="px-6 py-5 space-y-5">
              {/* Fragrantica search (add mode only) */}
              {!editing && (
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search Fragrantica to auto-fill…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  {fetchingSearch && (
                    <div className="absolute right-3 top-2.5">
                      <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  {suggestions.length > 0 && (
                    <ul className="absolute z-10 w-full bg-white border border-gray-100 rounded-xl shadow-lg mt-1 max-h-56 overflow-y-auto">
                      {suggestions.map((s) => (
                        <li key={s.id}>
                          <button
                            type="button"
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-left"
                            onClick={() => handleSuggestionClick(s)}
                          >
                            {s.image && (
                              <img
                                src={s.image}
                                alt=""
                                className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
                              />
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {s.name}
                              </p>
                              <p className="text-xs text-gray-400 truncate">{s.brand}</p>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {fetchingDetails && (
                    <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1.5">
                      <span className="inline-block w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                      Fetching details…
                    </p>
                  )}
                </div>
              )}

              {/* Name + Brand */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Brand *</label>
                  <input
                    required
                    value={form.brand}
                    onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      category: e.target.value as 'mens' | 'womens' | 'unisex',
                    }))
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                >
                  <option value="mens">Men&apos;s</option>
                  <option value="womens">Women&apos;s</option>
                  <option value="unisex">Unisex</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                />
              </div>

              {/* Image */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Image</label>
                <div className="flex gap-2">
                  <input
                    value={form.image}
                    onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
                    placeholder="https://…"
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium text-gray-600 transition-colors disabled:opacity-40 whitespace-nowrap"
                  >
                    {uploadingImage ? 'Uploading…' : 'Upload'}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>
                {form.image && (
                  <img
                    src={form.image}
                    alt=""
                    className="mt-2 w-16 h-16 rounded-lg object-cover border border-gray-100"
                  />
                )}
              </div>

              {/* Notes */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-700">Notes (comma-separated)</p>
                {(
                  [
                    { label: 'Top notes', key: 'topNotes' as const },
                    { label: 'Middle notes', key: 'middleNotes' as const },
                    { label: 'Base notes', key: 'baseNotes' as const },
                  ] as const
                ).map(({ label, key }) => (
                  <div key={key}>
                    <label className="block text-xs text-gray-400 mb-1">{label}</label>
                    <input
                      value={form[key]}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                      placeholder="e.g. Bergamot, Lavender"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Scent profiles</label>
                  <input
                    value={form.scentProfiles}
                    onChange={(e) => setForm((f) => ({ ...f, scentProfiles: e.target.value }))}
                    placeholder="e.g. Woody, Fresh, Floral"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              {/* Sizes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-gray-700">Sizes & Prices</p>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        sizes: [...f.sizes, { size: '', price: 0 }],
                      }))
                    }
                    className="text-xs text-amber-600 hover:text-amber-800 font-medium"
                  >
                    + Add size
                  </button>
                </div>
                <div className="space-y-2">
                  {form.sizes.map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        value={s.size}
                        onChange={(e) => updateSize(i, 'size', e.target.value)}
                        placeholder="e.g. 5ml"
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                      />
                      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-amber-400">
                        <span className="px-2 text-gray-400 text-sm bg-gray-50 border-r border-gray-100 py-2">
                          £
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={s.price}
                          onChange={(e) =>
                            updateSize(i, 'price', parseFloat(e.target.value) || 0)
                          }
                          className="w-20 py-2 pr-2 text-sm focus:outline-none"
                        />
                      </div>
                      {form.sizes.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              sizes: f.sizes.filter((_, j) => j !== i),
                            }))
                          }
                          className="text-gray-300 hover:text-red-400 transition-colors"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {pricing && (
                  <p className="text-xs text-gray-400 mt-1.5">
                    Price auto-fills from settings when you enter the size (e.g. &ldquo;5ml&rdquo;)
                  </p>
                )}
              </div>

              {/* Flags */}
              <div className="flex flex-wrap gap-5">
                {FLAGS.map(({ label, key }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form[key]}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, [key]: e.target.checked }))
                      }
                      className="w-4 h-4 rounded accent-amber-400"
                    />
                    <span className="text-sm text-gray-700">{label}</span>
                  </label>
                ))}
              </div>

              {/* Footer buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-amber-400 hover:bg-amber-500 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60"
                >
                  {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
