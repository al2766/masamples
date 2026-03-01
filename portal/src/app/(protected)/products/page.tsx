'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
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
  Wand2,
  Database,
} from 'lucide-react';

// Default product catalogue for one-click seeding
const DEFAULT_PRODUCTS = [
  { id: '1', name: 'Silver Onyx', brand: 'Khadlaj', price: 4.99, size: '5ml', category: 'mens', inStock: true, image: 'https://images.unsplash.com/photo-1769625310883-6c87ed402d6f?w=400', description: 'A sophisticated woody fragrance with notes of amber and musk', isBestSeller: true, notes: { top: ['Bergamot'], middle: ['Amber', 'Musk'], base: ['Cedarwood'] }, sizes: [{ size: '5ml', price: 4.99 }, { size: '10ml', price: 8.99 }, { size: '15ml', price: 12.99 }], scentProfiles: ['woody', 'ambery'], specificNotes: ['Cedarwood', 'Amber', 'Musk'] },
  { id: '2', name: 'Liquid Brun', brand: 'Liquid Brun', price: 5.99, size: '5ml', category: 'unisex', inStock: true, image: 'https://images.unsplash.com/photo-1767187861728-942f561b7103?w=400', description: 'Rich and warm oriental scent with vanilla and spice', isBestSeller: true, notes: { top: ['Saffron'], middle: ['Vanilla', 'Tonka Bean'], base: ['Amber', 'Spices'] }, sizes: [{ size: '5ml', price: 5.99 }, { size: '10ml', price: 9.99 }, { size: '15ml', price: 14.99 }], scentProfiles: ['ambery', 'aromatic'], specificNotes: ['Vanilla', 'Amber', 'Tonka Bean', 'Spices'] },
  { id: '3', name: 'Terra', brand: 'Rayhaan', price: 4.49, size: '5ml', category: 'mens', inStock: true, image: 'https://images.unsplash.com/photo-1761659760494-32b921a2449f?w=400', description: 'Earthy and fresh with citrus top notes', isBestSeller: false, notes: { top: ['Lemon', 'Bergamot'], middle: ['Green Notes'], base: ['Vetiver'] }, sizes: [{ size: '5ml', price: 4.49 }, { size: '10ml', price: 7.99 }, { size: '15ml', price: 11.49 }], scentProfiles: ['fresh', 'aromatic'], specificNotes: ['Citrus', 'Vetiver', 'Green'] },
  { id: '4', name: 'Invictus Victory', brand: 'Paco Rabanne', price: 6.99, size: '5ml', category: 'mens', inStock: true, image: 'https://images.unsplash.com/photo-1769625310883-6c87ed402d6f?w=400', description: 'Powerful and energetic with vanilla and tonka bean', isBestSeller: true, notes: { top: ['Lemon', 'Pink Pepper'], middle: ['Lavender'], base: ['Vanilla', 'Tonka Bean'] }, sizes: [{ size: '5ml', price: 6.99 }, { size: '10ml', price: 11.99 }, { size: '15ml', price: 16.99 }], scentProfiles: ['ambery', 'aromatic'], specificNotes: ['Vanilla', 'Tonka Bean', 'Lavender'] },
  { id: '5', name: 'Acqua Di Gio EDT', brand: 'Giorgio Armani', price: 7.99, size: '5ml', category: 'mens', inStock: true, image: 'https://images.unsplash.com/photo-1707920961189-290d19b363f3?w=400', description: 'Fresh aquatic fragrance with marine notes', isBestSeller: true, notes: { top: ['Bergamot', 'Neroli'], middle: ['Marine Notes'], base: ['Cedarwood', 'Patchouli'] }, sizes: [{ size: '5ml', price: 7.99 }, { size: '10ml', price: 13.99 }, { size: '15ml', price: 19.99 }], scentProfiles: ['fresh'], specificNotes: ['Aquatic', 'Marine', 'Citrus'] },
  { id: '6', name: 'Stronger With You Intensely', brand: 'Emporio Armani', price: 6.99, size: '5ml', category: 'mens', inStock: true, image: 'https://images.unsplash.com/photo-1767187861728-942f561b7103?w=400', description: 'Intense woody fragrance with vanilla and chestnut', isBestSeller: false, notes: { top: ['Pink Pepper', 'Juniper'], middle: ['Cinnamon', 'Sage'], base: ['Vanilla', 'Tonka Bean', 'Amber'] }, sizes: [{ size: '5ml', price: 6.99 }, { size: '10ml', price: 11.99 }, { size: '15ml', price: 16.99 }], scentProfiles: ['ambery', 'aromatic'], specificNotes: ['Vanilla', 'Tonka Bean', 'Amber', 'Cinnamon'] },
  { id: '7', name: 'Y Eau de Parfum', brand: 'Yves Saint Laurent', price: 7.99, size: '5ml', category: 'mens', inStock: true, image: 'https://images.unsplash.com/photo-1761659760494-32b921a2449f?w=400', description: 'Modern and fresh with apple and sage', isBestSeller: true, notes: { top: ['Apple', 'Ginger'], middle: ['Sage', 'Juniper'], base: ['Cedarwood', 'Vetiver'] }, sizes: [{ size: '5ml', price: 7.99 }, { size: '10ml', price: 13.99 }, { size: '15ml', price: 19.99 }], scentProfiles: ['fresh', 'aromatic'], specificNotes: ['Sage', 'Fruity', 'Herbal'] },
  { id: '8', name: 'Hero EDP', brand: 'Burberry', price: 7.49, size: '5ml', category: 'mens', inStock: true, image: 'https://images.unsplash.com/photo-1769625310883-6c87ed402d6f?w=400', description: 'Bold and confident with cedarwood', isBestSeller: false, notes: { top: ['Bergamot'], middle: ['Juniper', 'Black Pepper'], base: ['Cedarwood'] }, sizes: [{ size: '5ml', price: 7.49 }, { size: '10ml', price: 12.99 }, { size: '15ml', price: 18.49 }], scentProfiles: ['woody', 'aromatic'], specificNotes: ['Cedarwood', 'Juniper', 'Pepper'] },
  { id: '9', name: 'Thriller', brand: 'Maison Asrar', price: 5.99, size: '5ml', category: 'unisex', inStock: true, image: 'https://images.unsplash.com/photo-1707920961189-290d19b363f3?w=400', description: 'Mysterious and captivating oriental blend', isBestSeller: false, notes: { top: ['Cardamom', 'Saffron'], middle: ['Rose', 'Jasmine'], base: ['Amber', 'Oud', 'Musk'] }, sizes: [{ size: '5ml', price: 5.99 }, { size: '10ml', price: 10.99 }, { size: '15ml', price: 15.99 }], scentProfiles: ['ambery', 'floral'], specificNotes: ['Amber', 'Oud', 'Musk', 'Rose', 'Jasmine'] },
  { id: '10', name: 'Man in Black', brand: 'Bvlgari', price: 7.99, size: '5ml', category: 'mens', inStock: true, image: 'https://images.unsplash.com/photo-1767187861728-942f561b7103?w=400', description: 'Dark and seductive with rum and spices', isBestSeller: false, notes: { top: ['Spices', 'Rum'], middle: ['Leather', 'Tuberose'], base: ['Tonka Bean', 'Guaiac Wood'] }, sizes: [{ size: '5ml', price: 7.99 }, { size: '10ml', price: 13.99 }, { size: '15ml', price: 19.99 }], scentProfiles: ['ambery', 'aromatic'], specificNotes: ['Spices', 'Tonka Bean', 'Rum'] },
  { id: '11', name: 'Born in Rome Intense', brand: 'Valentino', price: 7.49, size: '5ml', category: 'mens', inStock: true, image: 'https://images.unsplash.com/photo-1761659760494-32b921a2449f?w=400', description: 'Elegant and sophisticated with violet leaf', isBestSeller: false, notes: { top: ['Ginger', 'Violet Leaf'], middle: ['Sage'], base: ['Vetiver', 'Patchouli'] }, sizes: [{ size: '5ml', price: 7.49 }, { size: '10ml', price: 12.99 }, { size: '15ml', price: 18.49 }], scentProfiles: ['aromatic', 'woody'], specificNotes: ['Violet', 'Sage', 'Vetiver', 'Patchouli'] },
  { id: '12', name: 'Sauvage EDP', brand: 'Dior', price: 8.99, size: '5ml', category: 'mens', inStock: false, image: 'https://images.unsplash.com/photo-1769625310883-6c87ed402d6f?w=400', description: 'Iconic fresh spicy fragrance', isBestSeller: true, scentProfiles: ['aromatic', 'fresh'], specificNotes: ['Pepper', 'Bergamot', 'Ambroxan'] },
  { id: '13', name: 'Bleu de Chanel EDP', brand: 'Chanel', price: 9.99, size: '5ml', category: 'mens', inStock: false, image: 'https://images.unsplash.com/photo-1767187861728-942f561b7103?w=400', description: 'Timeless woody aromatic scent', isBestSeller: true, scentProfiles: ['woody', 'aromatic'], specificNotes: ['Cedarwood', 'Sandalwood', 'Ginger'] },
  { id: '14', name: 'Oud Wood', brand: 'Tom Ford', price: 12.99, size: '5ml', category: 'unisex', inStock: false, image: 'https://images.unsplash.com/photo-1707920961189-290d19b363f3?w=400', description: 'Luxurious oud with exotic woods', isBestSeller: true, scentProfiles: ['woody', 'ambery'], specificNotes: ['Oud', 'Sandalwood', 'Vetiver'] },
  { id: '15', name: 'Aventus', brand: 'Creed', price: 14.99, size: '5ml', category: 'mens', inStock: false, image: 'https://images.unsplash.com/photo-1761659760494-32b921a2449f?w=400', description: 'Legendary fruity fragrance', isBestSeller: true, scentProfiles: ['fresh', 'fruity'], specificNotes: ['Pineapple', 'Birch', 'Musk'] },
  { id: '16', name: 'Eros EDT', brand: 'Versace', price: 6.99, size: '5ml', category: 'mens', inStock: false, image: 'https://images.unsplash.com/photo-1769625310883-6c87ed402d6f?w=400', description: 'Fresh and vibrant with mint', isBestSeller: true, scentProfiles: ['fresh', 'aromatic'], specificNotes: ['Mint', 'Green Apple', 'Vanilla'] },
  { id: '17', name: 'One Million', brand: 'Paco Rabanne', price: 6.99, size: '5ml', category: 'mens', inStock: false, image: 'https://images.unsplash.com/photo-1767187861728-942f561b7103?w=400', description: 'Sweet and spicy with cinnamon', isBestSeller: true, scentProfiles: ['aromatic', 'ambery'], specificNotes: ['Cinnamon', 'Rose', 'Patchouli'] },
  { id: '18', name: 'La Vie Est Belle', brand: 'Lancôme', price: 7.99, size: '5ml', category: 'womens', inStock: false, image: 'https://images.unsplash.com/photo-1707920961189-290d19b363f3?w=400', description: 'Sweet floral with iris and patchouli', isBestSeller: true, scentProfiles: ['floral', 'ambery'], specificNotes: ['Iris', 'Patchouli', 'Vanilla'] },
  { id: '19', name: 'Good Girl', brand: 'Carolina Herrera', price: 8.99, size: '5ml', category: 'womens', inStock: false, image: 'https://images.unsplash.com/photo-1761659760494-32b921a2449f?w=400', description: 'Elegant with jasmine and tonka bean', isBestSeller: true, scentProfiles: ['floral', 'ambery'], specificNotes: ['Jasmine', 'Tonka Bean', 'Almond'] },
  { id: '20', name: 'Baccarat Rouge 540', brand: 'Maison Francis Kurkdjian', price: 15.99, size: '5ml', category: 'unisex', inStock: false, image: 'https://images.unsplash.com/photo-1767187861728-942f561b7103?w=400', description: 'Luxurious amber and saffron', isBestSeller: true, scentProfiles: ['ambery', 'floral'], specificNotes: ['Saffron', 'Amber', 'Cedarwood', 'Jasmine'] },
];

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
  return s
    .split(',')
    .map((n) => n.trim())
    .filter(Boolean);
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
  const [seeding, setSeeding] = useState(false);
  const [apiSearch, setApiSearch] = useState('');
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [topNotes, setTopNotes] = useState('');
  const [middleNotes, setMiddleNotes] = useState('');
  const [baseNotes, setBaseNotes] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const snap = await getDocs(collection(db, 'products'));
    setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product)));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_PRODUCT);
    setTopNotes('');
    setMiddleNotes('');
    setBaseNotes('');
    setApiSearch('');
    setApiError('');
    setModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({ ...p });
    setTopNotes(notesToString(p.notes?.top));
    setMiddleNotes(notesToString(p.notes?.middle));
    setBaseNotes(notesToString(p.notes?.base));
    setApiSearch('');
    setApiError('');
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const data = {
      ...form,
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
      } else {
        await addDoc(collection(db, 'products'), { ...data, createdAt: serverTimestamp() });
      }
      setModalOpen(false);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const handleSeedDefaults = async () => {
    if (!confirm(`Seed ${DEFAULT_PRODUCTS.length} default products from the existing catalogue? Products that already exist will be skipped.`)) return;
    setSeeding(true);
    const existing = new Set(products.map((p) => p.id));
    let added = 0;
    for (const { id, ...data } of DEFAULT_PRODUCTS) {
      if (existing.has(id)) continue;
      await setDoc(doc(db, 'products', id), { ...data, createdAt: new Date() });
      added++;
    }
    await load();
    setSeeding(false);
    alert(`Done! Added ${added} products.`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    setDeleting(id);
    await deleteDoc(doc(db, 'products', id));
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setDeleting(null);
  };

  const handleApiSearch = async () => {
    if (!apiSearch.trim()) return;
    setApiLoading(true);
    setApiError('');
    try {
      const res = await fetch(`/api/search-perfume?q=${encodeURIComponent(apiSearch)}`);
      if (!res.ok) {
        const data = await res.json();
        setApiError(data.error || 'Search failed');
        return;
      }
      const data = await res.json();
      // Adapt response shape to form — adjust field names to match your API
      const hit = Array.isArray(data) ? data[0] : data?.results?.[0];
      if (hit) {
        setForm((f) => ({
          ...f,
          name: hit.name || f.name,
          brand: hit.brand || hit.house || f.brand,
          description: hit.description || hit.summary || f.description,
          image: hit.image || hit.imageUrl || f.image,
        }));
        if (hit.notes?.top) setTopNotes(Array.isArray(hit.notes.top) ? hit.notes.top.join(', ') : hit.notes.top);
        if (hit.notes?.middle) setMiddleNotes(Array.isArray(hit.notes.middle) ? hit.notes.middle.join(', ') : hit.notes.middle);
        if (hit.notes?.base) setBaseNotes(Array.isArray(hit.notes.base) ? hit.notes.base.join(', ') : hit.notes.base);
      } else {
        setApiError('No results found. Fill in manually.');
      }
    } catch {
      setApiError('API not reachable. Fill in manually.');
    } finally {
      setApiLoading(false);
    }
  };

  const updateSize = (index: number, field: 'size' | 'price', value: string | number) => {
    setForm((f) => {
      const sizes = [...(f.sizes || [])];
      sizes[index] = { ...sizes[index], [field]: value };
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
      <div className="mb-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Products</h1>
            <p className="mt-1 text-sm text-gray-500">{products.length} perfume(s) listed</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Seed — desktop only */}
            <button
              onClick={handleSeedDefaults}
              disabled={seeding}
              className="hidden md:flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-60"
            >
              {seeding ? <Loader2 size={16} className="animate-spin" /> : <Database size={16} />}
              Seed Defaults
            </button>
            <button
              onClick={openAdd}
              className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-600"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Add Perfume</span>
            </button>
          </div>
        </div>
        {/* Seed — mobile full-width */}
        <button
          onClick={handleSeedDefaults}
          disabled={seeding}
          className="md:hidden mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-semibold text-gray-700 shadow-sm disabled:opacity-60"
        >
          {seeding ? <Loader2 size={16} className="animate-spin" /> : <Database size={16} />}
          Seed Default Products
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

      {/* Modal — full-screen on mobile, centered on desktop */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 md:flex md:items-start md:justify-center md:bg-black/40 md:px-4 md:py-8">
          <div className="min-h-screen md:min-h-0 w-full md:max-w-2xl bg-white md:rounded-2xl shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="font-semibold text-gray-900">
                {editing ? `Edit: ${editing.name}` : 'Add New Perfume'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6 px-6 py-6">

              {/* API Search */}
              <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50 p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-700">
                  <Wand2 size={12} className="mr-1 inline" />
                  Auto-fill from Fragrance API
                </p>
                <div className="flex gap-2">
                  <input
                    value={apiSearch}
                    onChange={(e) => setApiSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleApiSearch()}
                    placeholder="Search e.g. Sauvage Dior…"
                    className="flex-1 rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-400"
                  />
                  <button
                    onClick={handleApiSearch}
                    disabled={apiLoading}
                    className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-60"
                  >
                    {apiLoading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                    Fill
                  </button>
                </div>
                {apiError && <p className="mt-2 text-xs text-amber-700">{apiError}</p>}
                <p className="mt-2 text-xs text-amber-600">
                  Requires <code>FRAGRANCE_API_KEY</code> in .env.local — or fill manually below.
                </p>
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
                  <div>
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
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Image URL</label>
                    <input
                      value={form.image}
                      onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-400"
                      placeholder="https://…"
                    />
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

              {/* Sizes & Pricing */}
              <section>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Sizes & Pricing</h3>
                <div className="space-y-2">
                  {(form.sizes || []).map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        value={s.size}
                        onChange={(e) => updateSize(i, 'size', e.target.value)}
                        placeholder="Size (e.g. 5ml)"
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
                      <button
                        onClick={() => removeSizeRow(i)}
                        className="text-gray-400 hover:text-red-500"
                      >
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

              {/* Notes */}
              <section>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Fragrance Notes</h3>
                <p className="mb-3 text-xs text-gray-400">Separate each note with a comma</p>
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
                onClick={() => setModalOpen(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name || !form.brand}
                className="flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-60"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                {editing ? 'Save changes' : 'Add perfume'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
