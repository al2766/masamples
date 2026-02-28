import { Link } from 'react-router';
import { Facebook, Instagram, Twitter } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-black text-white mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* About */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
                <span className="text-black font-bold">MA</span>
              </div>
              <h3 className="font-semibold">MA Samples</h3>
            </div>
            <p className="text-gray-400 text-sm">
              Your premier destination for authentic luxury fragrance samples.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4 text-amber-400">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/shop" className="text-gray-400 hover:text-amber-400">
                  All Perfumes
                </Link>
              </li>
              <li>
                <Link to="/inspired" className="text-gray-400 hover:text-amber-400">
                  Inspired By
                </Link>
              </li>
              <li>
                <Link to="/new-arrivals" className="text-gray-400 hover:text-amber-400">
                  New Arrivals
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-semibold mb-4 text-amber-400">Shop</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/shop" className="text-gray-400 hover:text-amber-400">
                  All Products
                </Link>
              </li>
              <li>
                <Link to="/bestsellers" className="text-gray-400 hover:text-amber-400">
                  Best Sellers
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-400 hover:text-amber-400">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="font-semibold mb-4 text-amber-400">Follow Us</h3>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-amber-400">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-amber-400">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-amber-400">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
          <p>&copy; 2026 MA Samples. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}