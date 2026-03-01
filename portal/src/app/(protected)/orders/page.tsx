'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Order } from '@/lib/types';
import { format } from 'date-fns';
import { Search, ShoppingBag, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const snap = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc')));
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order)));
      setLoading(false);
    };
    load();
  }, []);

  const filtered = orders.filter(
    (o) =>
      o.email?.toLowerCase().includes(search.toLowerCase()) ||
      o.shippingAddress?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
      o.shippingAddress?.lastName?.toLowerCase().includes(search.toLowerCase()) ||
      o.id.toLowerCase().includes(search.toLowerCase())
  );

  const totalRevenue = orders.reduce((s, o) => s + (o.total || 0), 0);

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="mt-1 text-sm text-gray-500">
            {orders.length} orders · £{totalRevenue.toFixed(2)} total revenue
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-5 flex items-center gap-3 rounded-xl bg-white px-4 py-2.5 shadow-sm">
        <Search size={16} className="text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or order ID…"
          className="flex-1 text-sm outline-none placeholder:text-gray-400"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={24} className="animate-spin text-gray-300" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-sm text-gray-400">
          <ShoppingBag size={40} className="mx-auto mb-3 text-gray-200" />
          {search ? 'No orders match your search' : 'No orders yet'}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const isOpen = expanded === order.id;
            const date = order.createdAt?.seconds
              ? format(new Date(order.createdAt.seconds * 1000), 'd MMM yyyy, HH:mm')
              : '—';
            return (
              <div key={order.id} className="overflow-hidden rounded-2xl bg-white shadow-sm">
                {/* Row */}
                <button
                  onClick={() => setExpanded(isOpen ? null : order.id)}
                  className="flex w-full items-center gap-4 px-6 py-4 text-left hover:bg-gray-50/50"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">
                        {order.shippingAddress?.firstName} {order.shippingAddress?.lastName}
                      </p>
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium capitalize text-green-700">
                        {order.status}
                      </span>
                      {!order.userId && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">Guest</span>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-gray-400">{order.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">£{order.total?.toFixed(2)}</p>
                    <p className="text-xs text-gray-400">{date}</p>
                  </div>
                  {isOpen ? (
                    <ChevronUp size={16} className="ml-2 flex-shrink-0 text-gray-400" />
                  ) : (
                    <ChevronDown size={16} className="ml-2 flex-shrink-0 text-gray-400" />
                  )}
                </button>

                {/* Expanded detail */}
                {isOpen && (
                  <div className="border-t border-gray-100 px-6 pb-5 pt-4">
                    <div className="grid grid-cols-2 gap-6 lg:grid-cols-3">
                      {/* Shipping */}
                      <div>
                        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">Shipping</p>
                        <p className="text-sm text-gray-700">
                          {order.shippingAddress?.firstName} {order.shippingAddress?.lastName}
                        </p>
                        <p className="text-sm text-gray-500">{order.shippingAddress?.address}</p>
                        <p className="text-sm text-gray-500">
                          {order.shippingAddress?.city}, {order.shippingAddress?.postcode}
                        </p>
                      </div>

                      {/* Payment */}
                      <div>
                        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">Payment</p>
                        <p className="text-sm text-gray-700">Subtotal: £{order.subtotal?.toFixed(2)}</p>
                        <p className="text-sm text-gray-700">Shipping: £{order.shippingCost?.toFixed(2)}</p>
                        <p className="text-sm font-semibold text-gray-900">Total: £{order.total?.toFixed(2)}</p>
                        <p className="mt-1 truncate text-xs text-gray-400">
                          Intent: {order.paymentIntentId}
                        </p>
                      </div>

                      {/* Items */}
                      <div className="col-span-2 lg:col-span-1">
                        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">Items</p>
                        <ul className="space-y-1.5">
                          {order.items?.map((item, i) => (
                            <li key={i} className="flex justify-between text-sm">
                              <span className="text-gray-700">
                                {item.name} <span className="text-gray-400">({item.size})</span> ×{item.quantity}
                              </span>
                              <span className="font-medium text-gray-900">£{(item.price * item.quantity).toFixed(2)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
