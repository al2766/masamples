'use client';

import { useState, useEffect, useRef } from 'react';
import {
  collection, doc, onSnapshot, setDoc, addDoc, deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  signInWithEmailAndPassword, signOut, onAuthStateChanged,
} from 'firebase/auth';
import { db, storage, auth } from '@/lib/firebase';

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? '';

// ── Types ─────────────────────────────────────────────────────────────────────
type Tab = 'dashboard' | 'products' | 'orders' | 'settings';

interface Size    { size: string; price: number; }
interface Notes   { top: string[]; middle: string[]; base: string[]; }
interface Product {
  id: string; name: string; brand: string; description: string;
  category: 'mens' | 'womens' | 'unisex'; image: string;
  notes: Notes; sizes: Size[]; scentProfiles: string[];
  price: number; size: string;
  inStock: boolean; isBestSeller: boolean; isNewArrival: boolean; isInspiredBy: boolean;
}
interface Order {
  id: string; email: string; status: string; total: number;
  createdAt: { seconds: number } | null;
  items: { name: string; brand: string; size: string; price: number; quantity: number }[];
  shippingAddress?: { firstName: string; lastName: string; address: string; city: string; postcode: string };
}
interface SearchResult { id: string; name: string; brand: string; image: string; url?: string; category: 'mens' | 'womens' | 'unisex'; }

// ── Form helpers ──────────────────────────────────────────────────────────────
const splitComma = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean);

type Category = 'mens' | 'womens' | 'unisex';
const BASE_FORM = {
  name: '', brand: '', description: '', category: 'mens' as Category,
  image: '', topNotes: '', middleNotes: '', baseNotes: '', scentProfiles: '',
  inStock: true, isBestSeller: false, isNewArrival: false, isInspiredBy: false,
  sizes: [{ size: '2ml', price: 5 }, { size: '5ml', price: 10 }, { size: '10ml', price: 18 }] as Size[],
};
type FormState = typeof BASE_FORM;

function productToForm(p: Product): FormState {
  return {
    name: p.name, brand: p.brand, description: p.description,
    category: p.category, image: p.image,
    topNotes:     p.notes?.top?.join(', ')    ?? '',
    middleNotes:  p.notes?.middle?.join(', ') ?? '',
    baseNotes:    p.notes?.base?.join(', ')   ?? '',
    scentProfiles: p.scentProfiles?.join(', ') ?? '',
    inStock: p.inStock ?? true, isBestSeller: p.isBestSeller ?? false,
    isNewArrival: p.isNewArrival ?? false, isInspiredBy: p.isInspiredBy ?? false,
    sizes: p.sizes?.length ? p.sizes : [{ size: '', price: 0 }],
  };
}

// ── Icons ─────────────────────────────────────────────────────────────────────
const IconGrid     = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
const IconBox      = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>;
const IconBag      = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>;
const IconSettings = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <IconGrid /> },
  { id: 'products',  label: 'Products',  icon: <IconBox /> },
  { id: 'orders',    label: 'Orders',    icon: <IconBag /> },
  { id: 'settings',  label: 'Settings',  icon: <IconSettings /> },
];

// ── Portal ────────────────────────────────────────────────────────────────────
export default function Portal() {

  // Auth
  const [authed, setAuthed]       = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [loginErr, setLoginErr]   = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // Tab state (same pattern as reference)
  const [tab, setTab] = useState<Tab>('dashboard');

  // Live data (onSnapshot — fires immediately + on every change)
  const [products,        setProducts]        = useState<Product[]>([]);
  const [orders,          setOrders]          = useState<Order[]>([]);
  const [productsErr,     setProductsErr]     = useState('');
  const [ordersErr,       setOrdersErr]       = useState('');
  const [productsLoading, setProductsLoading] = useState(true);

  // Modal
  const [modalOpen,  setModalOpen]  = useState(false);
  const [editing,    setEditing]    = useState<Product | null>(null);
  const [form,       setForm]       = useState<FormState>(BASE_FORM);
  const [saving,     setSaving]     = useState(false);
  const [saveErr,    setSaveErr]    = useState('');

  // Fragrantica auto-fill
  const [search,          setSearch]          = useState('');
  const [suggestions,     setSuggestions]     = useState<SearchResult[]>([]);
  const [fetchingSearch,  setFetchingSearch]  = useState(false);
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const [detailsFailed,   setDetailsFailed]   = useState(false);

  // Image upload
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Auth listener ─────────────────────────────────────────────────────────
  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setAuthed(!!u && (!ADMIN_EMAIL || u.email === ADMIN_EMAIL));
      setAuthReady(true);
    });
  }, []);

  // ── Live products listener ────────────────────────────────────────────────
  useEffect(() => {
    if (!authed) return;
    setProductsErr('');
    setProductsLoading(true);
    return onSnapshot(collection(db, 'products'),
      (snap) => {
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product));
        docs.sort((a, b) => a.name.localeCompare(b.name));
        setProducts(docs);
        setProductsLoading(false);
      },
      (err) => {
        console.error('products listener:', err);
        setProductsErr(`${err.code}: ${err.message}`);
        setProductsLoading(false);
      }
    );
  }, [authed]);

  // ── Live orders listener ──────────────────────────────────────────────────
  useEffect(() => {
    if (!authed) return;
    setOrdersErr('');
    return onSnapshot(collection(db, 'orders'),
      (snap) => setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order))),
      (err) => {
        console.error('orders listener:', err);
        setOrdersErr(`${err.code}: ${err.message}`);
      }
    );
  }, [authed]);

  // ── Login ─────────────────────────────────────────────────────────────────
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginErr('');
    setLoggingIn(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      if (ADMIN_EMAIL && cred.user.email !== ADMIN_EMAIL) {
        await signOut(auth);
        setLoginErr('Not authorized.');
      }
    } catch { setLoginErr('Invalid email or password.'); }
    finally  { setLoggingIn(false); }
  }

  // ── Algolia search (debounced 600ms) ──────────────────────────────────────
  useEffect(() => {
    if (!search.trim()) { setSuggestions([]); setFetchingSearch(false); return; }
    setFetchingSearch(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search-perfume?q=${encodeURIComponent(search)}`);
        setSuggestions(await res.json());
      } catch { setSuggestions([]); }
      finally  { setFetchingSearch(false); }
    }, 600);
    return () => clearTimeout(t);
  }, [search]);

  // ── Suggestion click — fetch details and auto-fill ────────────────────────
  async function handleSuggestionClick(s: SearchResult) {
    setSuggestions([]);
    setSearch('');
    setDetailsFailed(false);
    setForm((f) => ({ ...f, name: s.name, brand: s.brand, image: s.image, category: s.category }));
    if (!s.url) return;
    setFetchingDetails(true);
    try {
      const res  = await fetch(`/api/perfume-details?url=${encodeURIComponent(s.url)}`);
      const data = await res.json();
      if (!res.ok) { setDetailsFailed(true); return; }
      const { description = '', notes, image, accords } = data;
      const top = notes?.top ?? [], middle = notes?.middle ?? [], base = notes?.base ?? [];
      if (description || top.length || middle.length || base.length || accords?.length) {
        setForm((f) => ({
          ...f,
          description:   description || f.description,
          topNotes:      top.join(', ')    || f.topNotes,
          middleNotes:   middle.join(', ') || f.middleNotes,
          baseNotes:     base.join(', ')   || f.baseNotes,
          scentProfiles: accords?.join(', ') || f.scentProfiles,
          image:         image || f.image,
        }));
      } else { setDetailsFailed(true); }
    } catch { setDetailsFailed(true); }
    finally  { setFetchingDetails(false); }
  }

  // ── Image upload ──────────────────────────────────────────────────────────
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const sRef = storageRef(storage, `products/${Date.now()}-${file.name}`);
      await uploadBytes(sRef, file);
      setForm((f) => ({ ...f, image: '' })); // clear first so the new URL triggers re-render
      const url = await getDownloadURL(sRef);
      setForm((f) => ({ ...f, image: url }));
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  // ── Save product ──────────────────────────────────────────────────────────
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveErr('');

    // Force token refresh so Firestore auth propagates before the write
    try {
      await auth.currentUser?.getIdToken(true);
    } catch (tokenErr) {
      setSaveErr('Auth token refresh failed — try signing out and back in.');
      setSaving(false);
      return;
    }

    const sizes = form.sizes.filter((s) => s.size.trim());
    const payload = {
      name:         form.name,
      brand:        form.brand,
      description:  form.description,
      category:     form.category,
      image:        form.image,
      notes: {
        top:    splitComma(form.topNotes),
        middle: splitComma(form.middleNotes),
        base:   splitComma(form.baseNotes),
      },
      sizes,
      price:         sizes[0]?.price ?? 0,
      size:          sizes[0]?.size  ?? '',
      scentProfiles: splitComma(form.scentProfiles),
      inStock:       form.inStock,
      isBestSeller:  form.isBestSeller,
      isNewArrival:  form.isNewArrival,
      isInspiredBy:  form.isInspiredBy,
      updatedAt:     serverTimestamp(),
    };

    try {
      // 15-second timeout so we always get feedback instead of hanging forever
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Save timed out — check browser console (F12) for details')), 15000)
      );

      const write = editing?.id
        ? setDoc(doc(db, 'products', editing.id), payload, { merge: true })
        : addDoc(collection(db, 'products'), { ...payload, createdAt: serverTimestamp() });

      await Promise.race([write, timeout]);
      closeModal();
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      // Show Firebase error code (e.g. "permission-denied") if present
      const msg = e.code ? `${e.code}: ${e.message}` : (e.message ?? 'Save failed');
      setSaveErr(msg);
      console.error('[handleSave] error:', err);
    } finally {
      setSaving(false);
    }
  }

  // ── Delete product ────────────────────────────────────────────────────────
  async function handleDelete(id: string) {
    if (!confirm('Delete this product?')) return;
    try { await deleteDoc(doc(db, 'products', id)); }
    catch (e) { console.error('delete:', e); }
  }

  // ── Modal helpers ─────────────────────────────────────────────────────────
  function openAdd() {
    setEditing(null); setForm(BASE_FORM);
    setSearch(''); setSuggestions([]); setSaveErr('');
    setModalOpen(true);
  }
  function openEdit(p: Product) {
    setEditing(p); setForm(productToForm(p));
    setSearch(''); setSuggestions([]); setSaveErr('');
    setModalOpen(true);
  }
  function closeModal() {
    setModalOpen(false); setEditing(null);
    setSearch(''); setSuggestions([]);
    setDetailsFailed(false); setSaveErr('');
  }

  // ── Dashboard stats ───────────────────────────────────────────────────────
  const revenue = orders.reduce((s, o) => s + (o.total ?? 0), 0);

  // ── Auth gate ─────────────────────────────────────────────────────────────
  if (!authReady) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!authed) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">MA Samples</h1>
          <p className="text-gray-500 text-sm mt-1">Admin Portal</p>
        </div>
        <form onSubmit={handleLogin} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
          </div>
          {loginErr && <p className="text-red-500 text-sm">{loginErr}</p>}
          <button type="submit" disabled={loggingIn}
            className="w-full bg-amber-400 hover:bg-amber-500 text-white font-semibold py-2 rounded-lg text-sm transition-colors disabled:opacity-60">
            {loggingIn ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );

  // ── Authenticated portal ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Desktop top nav */}
      <nav className="hidden md:flex items-center gap-1 bg-white border-b border-gray-100 px-6 h-16 shadow-sm sticky top-0 z-40">
        <span className="font-bold text-gray-900 mr-8 text-lg tracking-tight">MA Samples</span>
        <div className="flex-1 flex items-center gap-1">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.id ? 'bg-amber-50 text-amber-600' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>
        <button onClick={() => signOut(auth)}
          className="text-sm text-gray-400 hover:text-gray-700 transition-colors flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign out
        </button>
      </nav>

      {/* Tab content */}
      <main className="flex-1 pb-24 md:pb-8">

        {/* ── Dashboard ───────────────────────────────────────────────────── */}
        {tab === 'dashboard' && (
          <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Products',  value: products.length.toString(),    sub: 'in catalogue' },
                { label: 'Orders',    value: orders.length.toString(),       sub: 'total received' },
                { label: 'Revenue',   value: `£${revenue.toFixed(2)}`,       sub: 'lifetime' },
                { label: 'Avg Order', value: orders.length ? `£${(revenue / orders.length).toFixed(2)}` : '£0.00', sub: 'per order' },
              ].map((c) => (
                <div key={c.label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{c.label}</p>
                  <p className="text-3xl font-bold text-gray-900">{c.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{c.sub}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Products ────────────────────────────────────────────────────── */}
        {tab === 'products' && (
          <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Products</h1>
              <button onClick={openAdd}
                className="bg-amber-400 hover:bg-amber-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                + Add Product
              </button>
            </div>
            {productsErr && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                <strong>Error loading products:</strong> {productsErr}
              </div>
            )}
            {productsLoading ? (
              <p className="text-gray-400 text-sm py-12 text-center">Loading…</p>
            ) : !productsErr && products.length === 0 ? (
              <p className="text-gray-400 text-sm py-12 text-center">No products yet — add one above.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {products.map((p) => (
                  <div key={p.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                    {p.image
                      ? <img src={p.image} alt={p.name} className="w-full h-32 object-cover" />
                      : <div className="w-full h-32 bg-gray-100 flex items-center justify-center text-gray-300 text-xs">No image</div>
                    }
                    <div className="p-3">
                      <p className="text-sm font-semibold text-gray-900 truncate">{p.name}</p>
                      <p className="text-xs text-gray-400 truncate mb-3">{p.brand}</p>
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(p)}
                          className="flex-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg py-1.5 font-medium transition-colors">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(p.id)}
                          className="flex-1 text-xs bg-red-50 hover:bg-red-100 text-red-500 rounded-lg py-1.5 font-medium transition-colors">
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Orders ──────────────────────────────────────────────────────── */}
        {tab === 'orders' && (
          <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Orders</h1>
            {ordersErr && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                <strong>Error loading orders:</strong> {ordersErr}
              </div>
            )}
            {!ordersErr && orders.length === 0 ? (
              <p className="text-gray-400 text-sm py-12 text-center">No orders yet.</p>
            ) : (
              <div className="space-y-3">
                {[...orders]
                  .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
                  .map((o) => (
                  <div key={o.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{o.email}</p>
                        {o.shippingAddress && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {o.shippingAddress.firstName} {o.shippingAddress.lastName} · {o.shippingAddress.address}, {o.shippingAddress.city} {o.shippingAddress.postcode}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-0.5">
                          {o.createdAt ? new Date(o.createdAt.seconds * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-gray-900">£{(o.total ?? 0).toFixed(2)}</p>
                        <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                          o.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>{o.status ?? 'unknown'}</span>
                      </div>
                    </div>
                    {o.items?.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-50 flex flex-wrap gap-2">
                        {o.items.map((item, i) => (
                          <span key={i} className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded-lg">
                            {item.name} {item.size} × {item.quantity}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Settings ────────────────────────────────────────────────────── */}
        {tab === 'settings' && (
          <div className="max-w-2xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <p className="text-sm text-gray-500">Signed in as <span className="font-medium text-gray-900">{ADMIN_EMAIL}</span></p>
              <button onClick={() => signOut(auth)}
                className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors">
                Sign out
              </button>
            </div>
          </div>
        )}

      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex z-40">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-3 text-xs font-medium transition-colors ${
              tab === t.id ? 'text-amber-500' : 'text-gray-400'
            }`}>
            {t.icon}
            {t.label}
          </button>
        ))}
      </nav>

      {/* ── Add / Edit Product Modal ──────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 overflow-y-auto py-6 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg my-auto">

            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">{editing ? 'Edit Product' : 'Add Product'}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSave} className="px-6 py-5 space-y-5">

              {/* Fragrantica search — add mode only */}
              {!editing && (
                <div className="relative">
                  <input type="text" placeholder="Search Fragrantica to auto-fill…"
                    value={search} onChange={(e) => setSearch(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                  {fetchingSearch && (
                    <div className="absolute right-3 top-2.5">
                      <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  {suggestions.length > 0 && (
                    <ul className="absolute z-10 w-full bg-white border border-gray-100 rounded-xl shadow-lg mt-1 max-h-56 overflow-y-auto">
                      {suggestions.map((s) => (
                        <li key={s.id}>
                          <button type="button" onClick={() => handleSuggestionClick(s)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-left">
                            {s.image && <img src={s.image} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />}
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{s.name}</p>
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
                      Fetching description and notes…
                    </p>
                  )}
                  {detailsFailed && !fetchingDetails && (
                    <p className="text-xs text-red-500 mt-1.5">Could not auto-fill — fill in manually below.</p>
                  )}
                </div>
              )}

              {/* Name + Brand */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
                  <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Brand *</label>
                  <input required value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
              </div>
              {(form.name || form.brand) && (
                <a href={`https://www.google.com/search?q=${encodeURIComponent(`${form.brand} ${form.name} perfume fragrance notes description`)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-medium transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                  </svg>
                  Find info
                </a>
              )}

              {/* Category */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as Category }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white">
                  <option value="mens">Men&apos;s</option>
                  <option value="womens">Women&apos;s</option>
                  <option value="unisex">Unisex</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <textarea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none" />
              </div>

              {/* Image */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Image</label>
                <div className="flex gap-2">
                  <input value={form.image} onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
                    placeholder="https://…"
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingImage}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium text-gray-600 transition-colors disabled:opacity-40 whitespace-nowrap">
                    {uploadingImage ? 'Uploading…' : 'Upload'}
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </div>
                {form.image && <img src={form.image} alt="" className="mt-2 w-16 h-16 rounded-lg object-cover border border-gray-100" />}
                {(form.name || form.brand) && (
                  <a href={`https://www.google.com/search?q=${encodeURIComponent(`${form.brand} ${form.name} perfume bottle white background`)}&tbm=isch&tbs=il:cl`}
                    target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg text-xs font-medium transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Find image
                  </a>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-700">Notes (comma-separated)</p>
                {([['Top notes', 'topNotes'], ['Middle notes', 'middleNotes'], ['Base notes', 'baseNotes']] as const).map(([label, key]) => (
                  <div key={key}>
                    <label className="block text-xs text-gray-400 mb-1">{label}</label>
                    <input value={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                      placeholder="e.g. Bergamot, Lavender"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                  </div>
                ))}
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Scent profiles</label>
                  <input value={form.scentProfiles} onChange={(e) => setForm((f) => ({ ...f, scentProfiles: e.target.value }))}
                    placeholder="e.g. Woody, Fresh, Floral"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
              </div>

              {/* Sizes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-gray-700">Sizes & Prices</p>
                  <button type="button"
                    onClick={() => setForm((f) => ({ ...f, sizes: [...f.sizes, { size: '', price: 0 }] }))}
                    className="text-xs text-amber-600 hover:text-amber-800 font-medium">+ Add size</button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {form.sizes.map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input value={s.size} placeholder="e.g. 5ml"
                        onChange={(e) => setForm((f) => { const sizes = [...f.sizes]; sizes[i] = { ...sizes[i], size: e.target.value }; return { ...f, sizes }; })}
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-amber-400">
                        <span className="px-2 text-gray-400 text-sm bg-gray-50 border-r border-gray-100 py-2">£</span>
                        <input type="number" step="0.01" min="0" value={s.price}
                          onChange={(e) => setForm((f) => { const sizes = [...f.sizes]; sizes[i] = { ...sizes[i], price: parseFloat(e.target.value) || 0 }; return { ...f, sizes }; })}
                          className="w-20 py-2 pr-2 text-sm focus:outline-none" />
                      </div>
                      <button type="button"
                        onClick={() => setForm((f) => ({ ...f, sizes: f.sizes.filter((_, j) => j !== i) }))}
                        className="text-gray-300 hover:text-red-400 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Flags */}
              <div className="flex flex-wrap gap-5">
                {([['In Stock', 'inStock'], ['Best Seller', 'isBestSeller'], ['New Arrival', 'isNewArrival'], ['Inspired By', 'isInspiredBy']] as const).map(([label, key]) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form[key]}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.checked }))}
                      className="w-4 h-4 rounded accent-amber-400" />
                    <span className="text-sm text-gray-700">{label}</span>
                  </label>
                ))}
              </div>

              {saveErr && <p className="text-sm text-red-500">{saveErr}</p>}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={closeModal}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 bg-amber-400 hover:bg-amber-500 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-60">
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
