export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  size: string;
  category: 'mens' | 'womens' | 'unisex';
  inStock: boolean;
  image: string;
  description: string;
  isBestSeller?: boolean;
  notes?: {
    top: string[];
    middle: string[];
    base: string[];
  };
  sizes?: {
    size: string;
    price: number;
  }[];
  scentProfiles?: string[]; // Main categories: floral, ambery, woody, fresh, aromatic
  specificNotes?: string[]; // Specific notes for nested filtering
  isInspiredBy?: boolean; // For "Inspired By" category
  isNewArrival?: boolean; // For new arrivals voting
}

// New category structure - only All Perfumes, Inspired By, Brands
export const categories = [
  { id: 'all', name: 'All Perfumes', slug: 'all' },
  { id: 'inspired', name: 'Inspired By', slug: 'inspired' },
  { id: 'brands', name: 'Brands', slug: 'brands' },
  { id: 'new-arrivals', name: 'New Arrivals', slug: 'new-arrivals' }
];

export const brands = [
  'Dior',
  'Chanel',
  'Tom Ford',
  'Creed',
  'Giorgio Armani',
  'Yves Saint Laurent',
  'Paco Rabanne',
  'Burberry',
  'Khadlaj',
  'Bvlgari',
  'Valentino',
  'Versace',
  'Maison Francis Kurkdjian',
  'Liquid Brun',
  'Rayhaan',
  'Maison Asrar',
  'Emporio Armani',
  'Carolina Herrera',
  'Lancôme'
];

// Scent profiles with nested notes
export const scentProfiles = {
  floral: {
    name: 'Floral',
    icon: '🌸',
    notes: ['Rose', 'Jasmine', 'Iris', 'Lavender', 'Violet']
  },
  ambery: {
    name: 'Ambery',
    icon: '✨',
    notes: ['Vanilla', 'Amber', 'Musk', 'Tonka Bean', 'Spices']
  },
  woody: {
    name: 'Woody',
    icon: '🌲',
    notes: ['Cedarwood', 'Sandalwood', 'Oud', 'Vetiver', 'Patchouli']
  },
  fresh: {
    name: 'Fresh',
    icon: '🍃',
    notes: ['Citrus', 'Aquatic', 'Marine', 'Fruity', 'Green']
  },
  aromatic: {
    name: 'Aromatic',
    icon: '🌿',
    notes: ['Herbal', 'Sage', 'Mint', 'Pepper', 'Lavender']
  }
};
