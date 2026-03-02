'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, getDocsFromCache, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Order } from '@/lib/types';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700',
  processing: 'bg-blue-50 text-blue-700',
  completed: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-700',
};

function formatDate(ts: { seconds: number } | undefined) {
  if (!ts) return '—';
  return new Date(ts.seconds * 1000).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function docsToOrders(docs: { id: string; data: () => Record<string, unknown> }[]): Order[] {
  return docs.map((d) => ({ id: d.id, ...d.data() } as Order));
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));

    async function load() {
      // Cache-first
      try {
        const cached = await getDocsFromCache(q);
        if (!cancelled) { setOrders(docsToOrders(cached.docs)); setLoading(false); }
      } catch { /* no cache */ }

      // Network refresh
      try {
        const snap = await getDocs(q);
        if (!cancelled) setOrders(docsToOrders(snap.docs));
      } catch { /* ignore */ } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Orders</h1>
      {loading && orders.length === 0 ? (
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          Loading…
        </div>
      ) : orders.length === 0 ? (
        <p className="text-gray-400 text-sm">No orders yet.</p>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div
              key={o.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
            >
              <button
                className="w-full text-left px-5 py-4 flex items-center gap-4"
                onClick={() => setExpanded(expanded === o.id ? null : o.id)}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">
                    {o.shippingAddress?.firstName} {o.shippingAddress?.lastName}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{o.email}</p>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full capitalize flex-shrink-0 ${
                    STATUS_COLORS[o.status] ?? 'bg-gray-50 text-gray-600'
                  }`}
                >
                  {o.status}
                </span>
                <span className="font-semibold text-gray-900 text-sm flex-shrink-0">
                  £{o.total?.toFixed(2)}
                </span>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {formatDate(o.createdAt)}
                </span>
                <svg
                  className={`w-4 h-4 text-gray-300 flex-shrink-0 transition-transform ${
                    expanded === o.id ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {expanded === o.id && (
                <div className="border-t border-gray-50 px-5 py-4 text-sm text-gray-600 space-y-2">
                  <p className="font-medium text-gray-700 text-xs uppercase tracking-wide">Items</p>
                  {o.items?.map((item, i) => (
                    <div key={i} className="flex justify-between">
                      <span>
                        {item.name} — {item.size} ×{item.quantity}
                      </span>
                      <span>£{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-gray-50 text-xs text-gray-400">
                    {o.shippingAddress?.address}, {o.shippingAddress?.city},{' '}
                    {o.shippingAddress?.postcode}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
