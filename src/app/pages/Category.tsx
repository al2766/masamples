import { useParams } from 'react-router';
import { useProducts } from '../../context/ProductsContext';
import { ProductCard } from '../components/ProductCard';

export function Category() {
  const { category } = useParams<{ category: string }>();
  const { products } = useProducts();

  const filteredProducts = products.filter(
    (product) => product.category === category
  );

  const categoryTitles: Record<string, string> = {
    mens: "Men's Fragrances",
    womens: "Women's Fragrances",
    unisex: 'Unisex Fragrances'
  };

  const title = category ? categoryTitles[category] || 'Fragrances' : 'Fragrances';

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl mb-4">{title}</h1>
          <p className="text-gray-600">
            {filteredProducts.length} products available
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">No products found in this category</p>
          </div>
        )}
      </div>
    </div>
  );
}