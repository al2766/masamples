import { useState } from 'react';
import { Link } from 'react-router';
import { Menu, ShoppingCart, ChevronDown, ChevronUp } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from './ui/sheet';
import { brands } from '../../data/products';
import { ImageWithFallback } from './figma/ImageWithFallback';

export function Header() {
  const { getCartCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [brandsExpanded, setBrandsExpanded] = useState(false);
  const cartCount = getCartCount();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-black rounded flex items-center justify-center">
              <span className="text-white font-bold text-xl">MA</span>
            </div>
            <div className="text-xl md:text-2xl font-semibold">MA Samples</div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/shop" className="hover:text-amber-600 transition-colors">
              All Perfumes
            </Link>
            <Link to="/inspired" className="hover:text-amber-600 transition-colors">
              Inspired By
            </Link>
            <Link to="/new-arrivals" className="hover:text-amber-600 transition-colors">
              New Arrivals
            </Link>
          </nav>

          {/* Cart & Mobile Menu */}
          <div className="flex items-center space-x-4">
            <Link to="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center font-semibold">
                    {cartCount}
                  </span>
                )}
              </Button>
            </Link>

            {/* Mobile Menu Button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] bg-black text-white border-l border-gray-800">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <SheetDescription className="sr-only">
                  Browse our fragrance categories and brands
                </SheetDescription>
                <div className="flex flex-col space-y-6 mt-8 px-2">
                  {/* Main Menu Items */}
                  <div>
                    <Link
                      to="/shop"
                      className="block py-3 px-4 mb-3 text-center bg-amber-400 text-black font-semibold rounded hover:bg-amber-500 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      All Perfumes
                    </Link>

                    {/* Brands Accordion */}
                    <div className="mb-3">
                      <button
                        onClick={() => setBrandsExpanded(!brandsExpanded)}
                        className="w-full flex items-center justify-between py-3 px-4 bg-gray-900 rounded hover:bg-gray-800 transition-colors"
                      >
                        <span className="font-semibold text-amber-400">Brands</span>
                        {brandsExpanded ? (
                          <ChevronUp className="h-4 w-4 text-amber-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-amber-400" />
                        )}
                      </button>
                      {brandsExpanded && (
                        <div className="mt-2 pl-4 pr-2 space-y-2 max-h-60 overflow-y-auto">
                          {brands.map((brand) => (
                            <Link
                              key={brand}
                              to={`/brand/${brand.toLowerCase().replace(/\s+/g, '-')}`}
                              className="block text-gray-200 hover:text-amber-400 transition-colors py-2"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              {brand}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>

                    <Link
                      to="/inspired"
                      className="block py-3 px-4 mb-3 text-gray-200 hover:text-amber-400 transition-colors border border-gray-700 rounded"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Inspired By
                    </Link>

                    <Link
                      to="/new-arrivals"
                      className="block py-3 px-4 text-gray-200 hover:text-amber-400 transition-colors border border-gray-700 rounded"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      New Arrivals
                    </Link>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}