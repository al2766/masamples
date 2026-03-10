import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { toast } from 'sonner';
import { CheckCircle2 } from 'lucide-react';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// ── Inner form (must be inside <Elements>) ──────────────────────────────────
function CheckoutForm({
  total,
  cart,
  clearCart,
}: {
  total: number;
  cart: { id: string; name: string; brand?: string; size?: string; price: number; quantity: number }[];
  clearCart: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);

  const shipping = 2.99;
  const subtotal = total - shipping;

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: user?.email || '',
    address: '',
    city: '',
    postcode: '',
  });

  // Pre-fill email if user logs in while on this page
  useEffect(() => {
    if (user?.email) {
      setFormData((f) => ({ ...f, email: user.email! }));
    }
  }, [user]);

  const handleField = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/order-success` },
      redirect: 'if_required',
    });

    if (error) {
      toast.error(error.message ?? 'Payment failed. Please try again.');
      setLoading(false);
      return;
    }

    if (paymentIntent?.status === 'succeeded') {
      const orderData = {
        userId: user?.uid || null,
        email: formData.email,
        shippingAddress: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          address: formData.address,
          city: formData.city,
          postcode: formData.postcode,
        },
        items: cart.map(({ id, name, brand, size, price, quantity }) => ({
          id, name, brand: brand ?? '', size: size ?? '', price, quantity,
        })),
        subtotal,
        shippingCost: shipping,
        total,
        paymentIntentId: paymentIntent.id,
        createdAt: serverTimestamp(),
        status: 'confirmed',
      };

      let orderId = '';
      try {
        const docRef = await addDoc(collection(db, 'orders'), orderData);
        orderId = docRef.id;
      } catch (err) {
        console.error('Failed to save order to Firestore:', err);
      }

      clearCart();
      navigate('/order-success', { state: { order: { ...orderData, id: orderId, createdAt: null } } });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Auth Banner */}
          {user ? (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-800">
                    Signed in as {user.displayName || user.email}
                  </p>
                  <p className="text-xs text-green-600">Your order will be saved to your account</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => logout()}
                className="text-xs text-gray-400 hover:underline ml-4"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm font-medium mb-3">Have an account? Sign in to track your orders.</p>
              <div className="flex flex-wrap gap-2 items-center">
                <Link to="/login" state={{ from: '/checkout' }}>
                  <Button type="button" variant="outline" size="sm">Sign In</Button>
                </Link>
                <Link to="/signup" state={{ from: '/checkout' }}>
                  <Button type="button" variant="outline" size="sm">Create Account</Button>
                </Link>
                <span className="text-xs text-gray-400">or continue as guest below</span>
              </div>
            </div>
          )}

          {/* Shipping */}
          <Card>
            <CardHeader>
              <CardTitle>Shipping Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" value={formData.firstName} onChange={handleField('firstName')} required />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" value={formData.lastName} onChange={handleField('lastName')} required />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={formData.email} onChange={handleField('email')} required />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input id="address" value={formData.address} onChange={handleField('address')} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input id="city" value={formData.city} onChange={handleField('city')} required />
                </div>
                <div>
                  <Label htmlFor="postcode">Postcode</Label>
                  <Input id="postcode" value={formData.postcode} onChange={handleField('postcode')} required />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment */}
          <Card>
            <CardHeader>
              <CardTitle>Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <PaymentElement />
            </CardContent>
          </Card>
        </div>

        {/* Right Column – Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mb-6">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {item.name} × {item.quantity}
                    </span>
                    <span>£{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="space-y-2 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>£{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span>£{shipping.toFixed(2)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>£{total.toFixed(2)}</span>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-amber-400 hover:bg-amber-500 text-black font-semibold"
                size="lg"
                disabled={loading || !stripe}
              >
                {loading ? 'Processing...' : `Pay £${total.toFixed(2)}`}
              </Button>

              <p className="text-xs text-gray-500 text-center mt-4">Secured by Stripe</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}

// ── Outer component – creates PaymentIntent, wraps in Elements ───────────────
export function Checkout() {
  const { cart, getCartTotal, clearCart } = useCart();
  const [clientSecret, setClientSecret] = useState('');
  const [error, setError] = useState('');

  const subtotal = getCartTotal();
  const shipping = 2.99;
  const total = subtotal + shipping;

  useEffect(() => {
    if (cart.length === 0) return;
    fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: Math.round(total * 100) }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setClientSecret(data.clientSecret);
      })
      .catch(() => setError('Could not connect to payment service.'));
  }, []);

  if (cart.length === 0) {
    return (
      <div className="min-h-screen py-12">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <h2 className="text-2xl mb-4">Your cart is empty</h2>
          <p className="text-gray-600">Please add items to your cart before checking out</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen py-12">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="min-h-screen py-12 flex items-center justify-center">
        <p className="text-gray-500">Loading payment...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 bg-gray-50">
      <div className="container mx-auto px-4 max-w-5xl">
        <h1 className="text-4xl mb-8">Checkout</h1>
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CheckoutForm total={total} cart={cart} clearCart={clearCart} />
        </Elements>
      </div>
    </div>
  );
}
