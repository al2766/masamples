'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Stats {
  products: number;
  orders: number;
  revenue: number;
  avgOrder: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [prodSnap, orderSnap] = await Promise.all([
          getDocs(collection(db, 'products')),
          getDocs(collection(db, 'orders')),
        ]);
        const revenue = orderSnap.docs.reduce((sum, d) => sum + ((d.data().total as number) ?? 0), 0);
        setStats({
          products: prodSnap.size,
          orders: orderSnap.size,
          revenue,
          avgOrder: orderSnap.size ? revenue / orderSnap.size : 0,
        });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const cards = stats
    ? [
        { label: 'Products', value: stats.products.toString(), sub: 'in catalogue' },
        { label: 'Orders', value: stats.orders.toString(), sub: 'total received' },
        { label: 'Revenue', value: `£${stats.revenue.toFixed(2)}`, sub: 'lifetime' },
        { label: 'Avg Order', value: `£${stats.avgOrder.toFixed(2)}`, sub: 'per order' },
      ]
    : [];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      {loading ? (
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          Loading…
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((c) => (
            <div key={c.label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{c.label}</p>
              <p className="text-3xl font-bold text-gray-900">{c.value}</p>
              <p className="text-xs text-gray-400 mt-1">{c.sub}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
