import { Product } from '../../data/products';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Link } from 'react-router';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link to={`/product/${product.id}`}>
      <div className="group relative bg-white rounded-lg overflow-hidden border hover:shadow-lg transition-shadow h-full flex flex-col">
        {/* Image */}
        <div className="aspect-square overflow-hidden bg-white flex items-center justify-center p-4">
          <ImageWithFallback
            src={product.image}
            alt={product.name}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Badges */}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          {product.isBestSeller && (
            <Badge className="bg-black text-white">Best Seller</Badge>
          )}
          {!product.inStock && (
            <Badge variant="destructive">Sold Out</Badge>
          )}
        </div>

        {/* Content */}
        <div className="p-3 md:p-4 flex flex-col flex-grow">
          <div className="flex-grow">
            <p className="text-xs md:text-sm text-gray-600">{product.brand}</p>
            <h3 className="font-semibold text-sm md:text-base line-clamp-2 mb-2">{product.name}</h3>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-1">from</p>
            <p className="text-lg md:text-xl font-bold">£{product.price.toFixed(2)}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}