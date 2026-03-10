import { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useProducts } from '../../context/ProductsContext';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import { Vote } from 'lucide-react';

export function NewArrivals() {
  const { products, loading } = useProducts();
  const [isVoteModalOpen, setIsVoteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{ id: string; name: string } | null>(null);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Show products marked isNewArrival; fallback to all products
  const newArrivalProducts = products.some((p) => p.isNewArrival)
    ? products.filter((p) => p.isNewArrival)
    : products;

  const handleVoteClick = (productId: string, productName: string) => {
    setSelectedProduct({ id: productId, name: productName });
    setIsVoteModalOpen(true);
  };

  const handleSubmitVote = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (!selectedProduct) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'votes'), {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        email,
        createdAt: serverTimestamp(),
      });
      toast.success("Thank you! We've counted your vote and will notify you when available.");
      setIsVoteModalOpen(false);
      setEmail('');
      setSelectedProduct(null);
    } catch (err) {
      console.error('Failed to save vote:', err);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-8 md:py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8 md:mb-12 text-center max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl mb-4">New Arrivals</h1>
          <p className="text-gray-600 text-lg mb-4">
            We release new fragrances based on community interest and voting.
          </p>
          <p className="text-gray-700">
            See a fragrance you'd like us to stock? Vote for it below and we'll notify you via email when it becomes available.
            The most voted fragrances will be prioritized for our next release!
          </p>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-lg bg-gray-200" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {newArrivalProducts.map((product) => (
              <div
                key={product.id}
                className="group relative bg-white rounded-lg overflow-hidden border hover:shadow-lg transition-shadow h-full flex flex-col"
              >
                {/* Image */}
                <div className="aspect-square overflow-hidden bg-gray-100">
                  <ImageWithFallback
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Badges */}
                <div className="absolute top-3 right-3 flex flex-col gap-2">
                  {product.isBestSeller && (
                    <Badge className="bg-black text-white text-xs">Best Seller</Badge>
                  )}
                  {product.inStock && (
                    <Badge className="bg-green-600 text-white text-xs">In Stock</Badge>
                  )}
                </div>

                {/* Content */}
                <div className="p-3 md:p-4 flex flex-col flex-grow">
                  <div className="flex-grow">
                    <p className="text-xs md:text-sm text-gray-600">{product.brand}</p>
                    <h3 className="font-semibold text-sm md:text-base line-clamp-2 mb-2">
                      {product.name}
                    </h3>
                  </div>

                  {/* Vote Button */}
                  <Button
                    onClick={() => handleVoteClick(product.id, product.name)}
                    variant="outline"
                    size="sm"
                    className="w-full mt-2 border-amber-500 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                  >
                    <Vote className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                    Vote
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Vote Modal */}
      <Dialog open={isVoteModalOpen} onOpenChange={setIsVoteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Vote for {selectedProduct?.name}</DialogTitle>
            <DialogDescription>
              We'll count your vote and notify you when this fragrance becomes available.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitVote} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Your Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsVoteModalOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-black font-semibold"
              >
                {submitting ? 'Submitting…' : 'Submit Vote'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
