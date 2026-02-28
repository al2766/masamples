import { Link, useLocation } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface OrderItem {
  name: string;
  size: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  email: string;
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

export function OrderSuccess() {
  const { state } = useLocation();
  const { user } = useAuth();
  const order: Order | undefined = state?.order;

  return (
    <div className="min-h-screen py-16 bg-gray-50">
      <div className="container mx-auto px-4 max-w-lg">
        {/* Success Header */}
        <div className="text-center mb-8">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-semibold mb-2">Order Confirmed</h1>
          <p className="text-gray-600">
            Thank you for your order! You'll receive a confirmation email
            {order?.email ? <> at <span className="font-medium">{order.email}</span></> : ' shortly'}.
          </p>
        </div>

        {/* Order Summary Card */}
        {order && (
          <Card className="mb-6">
            <CardContent className="p-6">
              {order.id && (
                <p className="text-sm text-gray-500 mb-4">
                  Order #{order.id.slice(-8).toUpperCase()}
                </p>
              )}

              {/* Items */}
              <div className="space-y-2 mb-4">
                {order.items?.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {item.name} · {item.size} × {item.quantity}
                    </span>
                    <span>£{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-3 space-y-1">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Subtotal</span>
                  <span>£{order.subtotal?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Shipping</span>
                  <span>£{order.shippingCost?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold text-base pt-1">
                  <span>Total</span>
                  <span>£{order.total?.toFixed(2)}</span>
                </div>
              </div>

              {/* Shipping Address */}
              {order.shippingAddress && (
                <div className="mt-4 pt-4 border-t text-sm text-gray-500">
                  <p className="font-medium text-gray-700 mb-1">Delivering to</p>
                  <p>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                  <p>{order.shippingAddress.address}</p>
                  <p>{order.shippingAddress.city}, {order.shippingAddress.postcode}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button asChild className="flex-1 bg-amber-400 hover:bg-amber-500 text-black font-semibold">
            <Link to="/shop">Continue Shopping</Link>
          </Button>
          {user && (
            <Button asChild variant="outline" className="flex-1">
              <Link to="/account">View All Orders</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
