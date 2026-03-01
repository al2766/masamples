import { Link } from 'react-router';
import { useProducts } from '../../context/ProductsContext';
import { ProductCard } from '../components/ProductCard';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Sparkles, Package, ShieldCheck } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { motion } from 'motion/react';

export function Home() {
  const { products } = useProducts();
  const bestSellers = products.filter((p) => p.isBestSeller && p.inStock).slice(0, 6);
  const inStockNow = products.filter((p) => p.inStock).slice(0, 4);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-black text-white">
        <div className="absolute inset-0 opacity-40">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1767187861728-942f561b7103?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBwZXJmdW1lJTIwYm90dGxlcyUyMGRhcmslMjBiYWNrZ3JvdW5kfGVufDF8fHx8MTc3MjE1MjIyMHww&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Hero background"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative container mx-auto px-4 py-24 md:py-32">
          <div className="max-w-2xl">
            <motion.h1
              className="text-4xl md:text-6xl mb-6"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            >
              Discover Your Signature Scent
            </motion.h1>
            <motion.p
              className="text-xl md:text-2xl mb-8 text-gray-300"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: 0.12 }}
            >
              Premium fragrance samples from the world's most coveted brands. Try before you buy.
            </motion.p>
            <motion.div
              className="flex flex-wrap gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
            >
              <Link to="/shop">
                <Button size="lg" variant="default" className="bg-amber-400 text-black hover:bg-amber-500 font-semibold">
                  Shop Now
                </Button>
              </Link>
              <Link to="/new-arrivals">
                <Button size="lg" variant="outline" className="border-white text-white bg-transparent hover:bg-white hover:text-black">
                  Vote for New Arrivals
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <Package className="h-8 w-8" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Authentic Samples</h3>
                <p className="text-gray-600">100% genuine fragrances from official sources</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <Sparkles className="h-8 w-8" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Premium Selection</h3>
                <p className="text-gray-600">Curated collection of luxury and niche fragrances</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Secure Checkout</h3>
                <p className="text-gray-600">Safe payments with Stripe, PayPal & Apple Pay</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Best Sellers */}
      {bestSellers.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl mb-2">Best Sellers</h2>
                <p className="text-gray-600">Our most popular fragrance samples</p>
              </div>
              <Link to="/bestsellers">
                <Button variant="outline">View All</Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {bestSellers.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Categories */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl mb-8 text-center">Explore Our Collection</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link to="/shop">
              <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
                <div className="aspect-[4/3] overflow-hidden">
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1769625310883-6c87ed402d6f?w=800"
                    alt="All Perfumes"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <CardContent className="p-6">
                  <h3 className="text-2xl mb-2">All Perfumes</h3>
                  <p className="text-gray-600">Browse our complete collection</p>
                </CardContent>
              </Card>
            </Link>

            <Link to="/inspired">
              <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
                <div className="aspect-[4/3] overflow-hidden">
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1707920961189-290d19b363f3?w=800"
                    alt="Inspired By Designer Fragrances"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <CardContent className="p-6">
                  <h3 className="text-2xl mb-2">Inspired By</h3>
                  <p className="text-gray-600">Designer fragrance alternatives</p>
                </CardContent>
              </Card>
            </Link>

            <Link to="/new-arrivals">
              <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group border-2 border-amber-400">
                <div className="aspect-[4/3] overflow-hidden">
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1761659760494-32b921a2449f?w=800"
                    alt="New Arrivals - Vote Now"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <CardContent className="p-6 bg-amber-50">
                  <h3 className="text-2xl mb-2">New Arrivals</h3>
                  <p className="text-gray-600">Vote for upcoming fragrances</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* In Stock Now */}
      {inStockNow.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="mb-8">
              <h2 className="text-3xl mb-2">In Stock Now</h2>
              <p className="text-gray-600">Get them while they last</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {inStockNow.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 bg-black text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl mb-4">
            Ready to Find Your Perfect Fragrance?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Browse our complete collection of premium fragrance samples
          </p>
          <Link to="/shop">
            <Button size="lg" variant="default" className="bg-white text-black hover:bg-gray-100">
              Explore All Products
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
