import { Card, CardContent } from '../components/ui/card';
import { Package, Shield, Heart } from 'lucide-react';

export function About() {
  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl mb-6">About Us</h1>
        
        <div className="prose max-w-none mb-12">
          <p className="text-lg text-gray-600 mb-6">
            MA Samples started on eBay in 2023 with a simple idea: let people try a fragrance before
            committing to a full bottle. What began as a small eBay store grew steadily, and we're proud
            to have maintained 100% positive feedback from every customer along the way.
          </p>

          <p className="text-gray-600 mb-4">
            Now we've brought everything together into our own dedicated home. Same authentic products,
            same careful decanting, same person behind every order — just a better experience built
            around the community that trusted us from the start.
          </p>

          <p className="text-gray-600 mb-6">
            You can still find us on eBay and read every review there.{' '}
            <a
              href="https://www.ebay.co.uk/usr/masamples"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-600 hover:text-amber-700 font-medium underline underline-offset-2"
            >
              View our eBay feedback →
            </a>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardContent className="p-6 text-center">
              <Package className="h-12 w-12 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Authentic Products</h3>
              <p className="text-gray-600 text-sm">
                100% genuine fragrances sourced directly from authorized retailers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Shield className="h-12 w-12 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Secure Shopping</h3>
              <p className="text-gray-600 text-sm">
                Safe payments through Stripe, PayPal, and Apple Pay
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Heart className="h-12 w-12 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Customer First</h3>
              <p className="text-gray-600 text-sm">
                Dedicated to providing the best fragrance sampling experience
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="bg-gray-50 rounded-lg p-8">
          <h2 className="text-2xl mb-4">Why Choose Samples?</h2>
          <ul className="space-y-3 text-gray-600">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Try before investing in a full-size bottle</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Perfect for travel and on-the-go application</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Build a diverse fragrance wardrobe affordably</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Discover your signature scent without commitment</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
