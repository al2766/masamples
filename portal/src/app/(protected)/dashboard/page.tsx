'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Order, Product } from '@/lib/types';
import { ShoppingBag, TrendingUp, Package, PoundSterling } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

interface Stat {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
  bg: string;
}

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [ordersSnap, productsSnap] = await Promise.all([
          getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(50))),
          getDocs(collection(db, 'products')),
        ]);
        setOrders(ordersSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Order)));
        setProducts(productsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Product)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const recentOrders = orders.slice(0, 8);

  const stats: Stat[] = [
    {
      label: 'Total Revenue',
      value: `£${totalRevenue.toFixed(2)}`,
      icon: PoundSterling,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'Total Orders',
      value: orders.length.toString(),
      icon: ShoppingBag,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Products Listed',
      value: products.length.toString(),
      icon: Package,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      label: 'Avg. Order Value',
      value: orders.length ? `£${(totalRevenue / orders.length).toFixed(2)}` : '£0.00',
      icon: TrendingUp,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Overview of your store</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-gray-100" />
          ))}
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-2xl bg-white p-5 shadow-sm">
                <div className={`mb-3 inline-flex rounded-xl p-2.5 ${s.bg}`}>
                  <s.icon size={20} className={s.color} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="mt-0.5 text-sm text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Recent orders */}
          <div className="mt-8 rounded-2xl bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="font-semibold text-gray-900">Recent Orders</h2>
              <Link href="/orders" className="text-sm font-medium text-amber-500 hover:text-amber-600">
                View all →
              </Link>
            </div>
            {recentOrders.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-gray-400">No orders yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wide text-gray-400">
                      <th className="px-6 py-3">Customer</th>
                      <th className="px-6 py-3">Items</th>
                      <th className="px-6 py-3">Total</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-3.5">
                          <p className="font-medium text-gray-900">
                            {order.shippingAddress?.firstName} {order.shippingAddress?.lastName}
                          </p>
                          <p className="text-gray-400">{order.email}</p>
                        </td>
                        <td className="px-6 py-3.5 text-gray-600">{order.items?.length ?? 0} item(s)</td>
                        <td className="px-6 py-3.5 font-semibold text-gray-900">£{order.total?.toFixed(2)}</td>
                        <td className="px-6 py-3.5">
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium capitalize text-green-700">
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-gray-400">
                          {order.createdAt?.seconds
                            ? format(new Date(order.createdAt.seconds * 1000), 'd MMM yyyy')
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
