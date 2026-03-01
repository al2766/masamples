'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { Order, Product } from '@/lib/types';
import { ShoppingBag, TrendingUp, Package, PoundSterling, LogOut } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();

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

  const handleSignOut = async () => {
    await signOut(auth);
    router.replace('/login');
  };

  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const recentOrders = orders.slice(0, 8);

  const stats: Stat[] = [
    { label: 'Total Revenue', value: `£${totalRevenue.toFixed(2)}`, icon: PoundSterling, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Total Orders', value: orders.length.toString(), icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Products Listed', value: products.length.toString(), icon: Package, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Avg. Order Value', value: orders.length ? `£${(totalRevenue / orders.length).toFixed(2)}` : '£0.00', icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div>
      {/* Page header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            {format(new Date(), 'd MMMM yyyy')}
          </p>
        </div>
        {/* Sign out — mobile only */}
        <button
          onClick={handleSignOut}
          className="md:hidden flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-sm font-medium text-gray-500 shadow-sm"
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-gray-100" />
          ))}
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-2xl bg-white p-4 md:p-5 shadow-sm">
                <div className={`mb-3 inline-flex rounded-xl p-2.5 ${s.bg}`}>
                  <s.icon size={20} className={s.color} />
                </div>
                <p className="text-xl md:text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="mt-0.5 text-xs md:text-sm text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Recent orders */}
          <div className="mt-6 rounded-2xl bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h2 className="font-semibold text-gray-900">Recent Orders</h2>
              <Link href="/orders" className="text-sm font-medium text-amber-500 hover:text-amber-600">
                View all →
              </Link>
            </div>

            {recentOrders.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-gray-400">No orders yet</div>
            ) : (
              <>
                {/* Mobile: card list */}
                <div className="md:hidden divide-y divide-gray-50">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between px-5 py-3.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {order.shippingAddress?.firstName} {order.shippingAddress?.lastName}
                        </p>
                        <p className="truncate text-xs text-gray-400">{order.email}</p>
                      </div>
                      <div className="ml-4 shrink-0 text-right">
                        <p className="text-sm font-semibold text-gray-900">£{order.total?.toFixed(2)}</p>
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium capitalize text-green-700">
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop: table */}
                <div className="hidden md:block overflow-x-auto">
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
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
