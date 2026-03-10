import { useState } from 'react';
import { useProducts } from '../../context/ProductsContext';
import { scentProfiles } from '../../data/products';
import { ProductCard } from '../components/ProductCard';
import { ScentFilter } from '../components/ScentFilter';

export function Inspired() {
  const { products, loading } = useProducts();
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);

  // Strictly show only products marked isInspiredBy — no fallback
  const baseProducts = products.filter((p) => p.isInspiredBy === true);

  let filteredProducts = baseProducts;

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
      prev.includes(profile) ? prev.filter(p => p !== profile) : [...prev, profile]
    );
  };

  const handleNoteToggle = (note: string) => {
    setSelectedNotes(prev =>
      prev.includes(note) ? prev.filter(n => n !== note) : [...prev, note]
    );
  };

  const handleClearFilters = () => {
    setSelectedProfiles([]);
    setSelectedNotes([]);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-black to-gray-900 text-white py-12 md:py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl mb-4">Inspired By Designer Fragrances</h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
            Discover our collection of fragrances inspired by the world's most iconic scents
          </p>
        </div>
      </div>

      {/* Filters */}
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
                  onClick={handleClearFilters}
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
