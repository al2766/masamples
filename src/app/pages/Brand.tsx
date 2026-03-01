import { useParams } from 'react-router';
import { useProducts } from '../../context/ProductsContext';
import { ProductCard } from '../components/ProductCard';

export function Brand() {
  const { brand } = useParams<{ brand: string }>();
  const { products } = useProducts();

  const brandName = brand?.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || '';

  const filteredProducts = products.filter(
    (product) => product.brand.toLowerCase() === brandName.toLowerCase()
  );

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl mb-4">{brandName}</h1>
          <p className="text-gray-600">
            {filteredProducts.length} products available
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">No products found for this brand</p>
          </div>
        )}
      </div>
    </div>
  );
}
