import { Link } from 'react-router';
import { Button } from '../components/ui/button';

export function OrderSuccess() {
  return (
    <div className="min-h-screen py-24 flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md px-4">
        <div className="text-5xl mb-6">✓</div>
        <h1 className="text-3xl font-semibold mb-3">Order Confirmed</h1>
        <p className="text-gray-600 mb-8">
          Thank you for your order. You'll receive a confirmation email shortly.
        </p>
        <Button asChild>
          <Link to="/shop">Continue Shopping</Link>
        </Button>
      </div>
    </div>
  );
}
