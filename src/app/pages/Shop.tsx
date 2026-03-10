import { useState } from 'react';
import { useProducts } from '../../context/ProductsContext';
import { scentProfiles } from '../../data/products';
import { ProductCard } from '../components/ProductCard';
import { ScentFilter } from '../components/ScentFilter';
import { Button } from '../components/ui/button';

export function Shop() {
  const { products, loading } = useProducts();
  const [filter, setFilter] = useState<'all' | 'instock' | 'soldout'>('all');
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);

  let filteredProducts = products.filter((product) => {
    if (filter === 'instock') return product.inStock;
    if (filter === 'soldout') return !product.inStock;
    return true;
  });

  // Apply scent profile filters
  if (selectedProfiles.length > 0 || selectedNotes.length > 0) {
    filteredProducts = filteredProducts.filter((product) => {
      const matchesProfile = selectedProfiles.length === 0 ||
        selectedProfiles.some(profile => product.scentProfiles?.includes(profile));

      // A note matches if it's in specificNotes OR if the product's scent profile includes that note
      const matchesNote = selectedNotes.length === 0 ||
        selectedNotes.some(note =>
          product.specificNotes?.includes(note) ||
          product.scentProfiles?.some(profile =>
            scentProfiles[profile as keyof typeof scentProfiles]?.notes.includes(note)
          )
        );

      return matchesProfile && matchesNote;
    });
  }

  const handleProfileToggle = (profile: string) => {
    setSelectedProfiles(prev =>
      prev.includes(profile)
        ? prev.filter(p => p !== profile)
        : [...prev, profile]
    );
  };

  const handleNoteToggle = (note: string) => {
    setSelectedNotes(prev =>
      prev.includes(note)
        ? prev.filter(n => n !== note)
        : [...prev, note]
    );
  };

  const handleClearFilters = () => {
    setSelectedProfiles([]);
    setSelectedNotes([]);
  };

  return (
    <div className="min-h-screen">
      <div className="py-8 md:py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <h1 className="text-3xl md:text-4xl mb-4">All Perfumes</h1>
            <p className="text-gray-600 mb-6">
              Browse our complete collection of fragrance samples
            </p>

            {/* Stock Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                onClick={() => setFilter('all')}
                className={filter === 'all' ? 'bg-amber-500 hover:bg-amber-600 text-black' : ''}
              >
                All Products
              </Button>
              <Button
                variant={filter === 'instock' ? 'default' : 'outline'}
                onClick={() => setFilter('instock')}
                className={filter === 'instock' ? 'bg-amber-500 hover:bg-amber-600 text-black' : ''}
              >
                In Stock
              </Button>
              <Button
                variant={filter === 'soldout' ? 'default' : 'outline'}
                onClick={() => setFilter('soldout')}
                className={filter === 'soldout' ? 'bg-amber-500 hover:bg-amber-600 text-black' : ''}
              >
                Sold Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Scent Filters */}
      <ScentFilter
        selectedProfiles={selectedProfiles}
        selectedNotes={selectedNotes}
        onProfileToggle={handleProfileToggle}
        onNoteToggle={handleNoteToggle}
        onClear={handleClearFilters}
      />

      {/* Products */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <p className="text-gray-600">
            {loading ? 'Loading…' : `Showing ${filteredProducts.length} ${filteredProducts.length === 1 ? 'product' : 'products'}`}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-lg bg-gray-200" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg">No products match your filters</p>
                <button
                  onClick={() => {
                    handleClearFilters();
                    setFilter('all');
                  }}
                  className="mt-4 text-amber-600 hover:text-amber-700 font-medium"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}