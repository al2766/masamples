import { Card, CardContent } from '../components/ui/card';
import { Package, Shield, Heart } from 'lucide-react';

export function About() {
  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl mb-6">About Us</h1>
        
        <div className="prose max-w-none mb-12">
          <p className="text-lg text-gray-600 mb-6">
            Welcome to FragranceSamples, your premier destination for authentic luxury fragrance samples. 
            We believe everyone should have the opportunity to experience high-end fragrances before committing 
            to a full bottle.
          </p>
          
          <p className="text-gray-600 mb-6">
            Our mission is to make luxury fragrances accessible and affordable. Each sample is carefully 
            decanted from authentic bottles, ensuring you receive the genuine scent experience.
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
