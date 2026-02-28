import { products } from '../../data/products';
import { ProductCard } from '../components/ProductCard';

export function BestSellers() {
  const bestSellers = products.filter((product) => product.isBestSeller);

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl mb-4">Best Sellers</h1>
          <p className="text-gray-600">
            Our most popular fragrance samples
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {bestSellers.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}