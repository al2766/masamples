import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Package, LogOut } from 'lucide-react';

interface OrderItem {
  id: string;
  name: string;
  brand: string;
  size: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  createdAt: { seconds: number };
  status: string;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
  shippingAddress: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    postcode: string;
  };
}

export function Account() {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { state: { from: '/account' } });
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchOrders = async () => {
      try {
        const q = query(
          collection(db, 'orders'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        setOrders(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Order)));
      } catch (err: unknown) {
        const msg = (err as Error).message || '';
        if (msg.includes('index')) {
          setOrdersError('index-needed');
        } else {
          setOrdersError('Failed to load orders.');
        }
      } finally {
        setOrdersLoading(false);
      }
    };
    fetchOrders();
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (loading) return null;
  if (!user) return null;

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-semibold">My Account</h1>
            <p className="text-gray-500 mt-1">{user.email}</p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>

        {/* Orders */}
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Package className="h-5 w-5" />
          Order History
        </h2>

        {ordersLoading && <p className="text-gray-500">Loading orders...</p>}

        {!ordersLoading && ordersError === 'index-needed' && (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-gray-600 mb-2">
                One-time setup needed: please open the Firebase console and create the required index for this query.
              </p>
              <p className="text-sm text-gray-400">
                Run a test order first — Firebase will log a link in the console to create the index automatically.
              </p>
            </CardContent>
          </Card>
        )}

        {!ordersLoading && ordersError && ordersError !== 'index-needed' && (
          <p className="text-red-500">{ordersError}</p>
        )}

        {!ordersLoading && !ordersError && orders.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 mb-4">No orders yet</p>
              <Link to="/shop">
                <Button className="bg-amber-400 hover:bg-amber-500 text-black font-semibold">
                  Start Shopping
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {!ordersLoading && !ordersError && orders.map((order) => (
          <Card key={order.id} className="mb-4">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">
                    Order #{order.id.slice(-8).toUpperCase()}
                  </CardTitle>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {order.createdAt
                      ? new Date(order.createdAt.seconds * 1000).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })
                      : 'Processing'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                    {order.status}
                  </span>
                  <p className="text-lg font-bold mt-1">£{order.total?.toFixed(2)}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {order.items?.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {item.name} · {item.size} × {item.quantity}
                    </span>
                    <span>£{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              {order.shippingAddress && (
                <p className="text-xs text-gray-400 mt-3">
                  Delivered to: {order.shippingAddress.firstName} {order.shippingAddress.lastName},{' '}
                  {order.shippingAddress.city}, {order.shippingAddress.postcode}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
