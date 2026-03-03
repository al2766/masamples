import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { useProducts } from '../../context/ProductsContext';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useCart } from '../../context/CartContext';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

export function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products } = useProducts();
  const product = products.find((p) => p.id === id);
  const { addToCart } = useCart();
  const [selectedSize, setSelectedSize] = useState(product?.sizes?.[0]?.size || product?.size || '5ml');

  if (!product) {
    return (
      <div className="min-h-screen py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-4xl mb-4">Product Not Found</h1>
            <Link to="/shop">
              <Button>Return to Shop</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const selectedPriceData = product.sizes?.find(s => s.size === selectedSize);
  const currentPrice = selectedPriceData?.price || product.price;

  const handleAddToCart = () => {
    if (!product.inStock) {
      toast.error('Sorry, this item is currently out of stock');
      return;
    }
    
    // Create a modified product with selected size and price
    const productToAdd = {
      ...product,
      size: selectedSize,
      price: currentPrice
    };
    
    addToCart(productToAdd);
    toast.success(`${product.name} (${selectedSize}) added to cart!`, {
      action: {
        label: 'View Basket',
        onClick: () => navigate('/cart'),
      },
    });
  };

  return (
    <div className="min-h-screen py-8 md:py-12">
      <div className="container mx-auto px-4">
        {/* Back button */}
        <Link to="/shop" className="inline-flex items-center text-gray-600 hover:text-black mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Shop
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {/* Image */}
          <div className="relative">
            <div className="aspect-square rounded-lg overflow-hidden bg-white flex items-center justify-center p-6 sticky top-24">
              <ImageWithFallback
                src={product.image}
                alt={product.name}
                className="w-full h-full object-contain"
              />
            </div>
            {/* Badges */}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              {product.isBestSeller && (
                <Badge className="bg-black text-white">Best Seller</Badge>
              )}
              {!product.inStock && (
                <Badge variant="destructive">Sold Out</Badge>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <div className="mb-6">
              <p className="text-gray-600 mb-2">{product.brand}</p>
              <h1 className="text-3xl md:text-4xl mb-4">{product.name}</h1>
              <p className="text-gray-700 text-lg">{product.description}</p>
            </div>

            {/* Notes */}
            {product.notes && (
              <div className="mb-8 p-6 bg-gray-50 rounded-lg">
                <h2 className="text-xl font-semibold mb-4">Fragrance Notes</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-1">Top Notes</p>
                    <p className="text-gray-800">{product.notes.top.join(', ')}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-1">Middle Notes</p>
                    <p className="text-gray-800">{product.notes.middle.join(', ')}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-1">Base Notes</p>
                    <p className="text-gray-800">{product.notes.base.join(', ')}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Size Selection */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">Select Size</label>
                <Select value={selectedSize} onValueChange={setSelectedSize}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    {product.sizes.map((sizeOption) => (
                      <SelectItem key={sizeOption.size} value={sizeOption.size}>
                        {sizeOption.size} - £{sizeOption.price.toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Price */}
            <div className="mb-6">
              <p className="text-3xl font-bold">£{currentPrice.toFixed(2)}</p>
            </div>

            {/* Add to Cart Button */}
            <Button
              onClick={handleAddToCart}
              disabled={!product.inStock}
              size="lg"
              className="w-full md:w-auto md:min-w-[200px] bg-amber-400 hover:bg-amber-500 text-black font-semibold"
            >
              {product.inStock ? 'Add to Cart' : 'Out of Stock'}
            </Button>

            {/* Additional Info */}
            <div className="mt-8 pt-8 border-t">
              <h3 className="font-semibold mb-3">Product Details</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• 100% Authentic fragrance samples</li>
                <li>• Perfect for testing before buying a full bottle</li>
                <li>• Securely packaged and shipped with care</li>
                <li>• All samples are decanted from genuine perfumes</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
