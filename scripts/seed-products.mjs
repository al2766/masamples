/**
 * Seeds the Firestore `products` collection with all existing product data.
 * Run once with: node scripts/seed-products.mjs
 *
 * Products that already exist by numeric ID will be skipped to avoid duplicates.
 */
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDocs } from 'firebase/firestore';
import { readFileSync } from 'fs';

// Load .env manually since this is a plain Node script
const env = readFileSync(new URL('../.env', import.meta.url), 'utf8');
const envVars = Object.fromEntries(
  env.split('\n')
    .filter(line => line.includes('=') && !line.startsWith('#'))
    .map(line => {
      const [key, ...rest] = line.split('=');
      return [key.trim(), rest.join('=').trim()];
    })
);

const firebaseConfig = {
  apiKey: envVars.VITE_FIREBASE_API_KEY,
  authDomain: envVars.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: envVars.VITE_FIREBASE_PROJECT_ID,
  storageBucket: envVars.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: envVars.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: envVars.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const products = [
  {
    id: '1', name: 'Silver Onyx', brand: 'Khadlaj', price: 4.99, size: '5ml',
    category: 'mens', inStock: true,
    image: 'https://images.unsplash.com/photo-1769625310883-6c87ed402d6f?w=400',
    description: 'A sophisticated woody fragrance with notes of amber and musk',
    isBestSeller: true,
    notes: { top: ['Bergamot'], middle: ['Amber', 'Musk'], base: ['Cedarwood'] },
    sizes: [{ size: '5ml', price: 4.99 }, { size: '10ml', price: 8.99 }, { size: '15ml', price: 12.99 }],
    scentProfiles: ['woody', 'ambery'], specificNotes: ['Cedarwood', 'Amber', 'Musk'],
  },
  {
    id: '2', name: 'Liquid Brun', brand: 'Liquid Brun', price: 5.99, size: '5ml',
    category: 'unisex', inStock: true,
    image: 'https://images.unsplash.com/photo-1767187861728-942f561b7103?w=400',
    description: 'Rich and warm oriental scent with vanilla and spice',
    isBestSeller: true,
    notes: { top: ['Saffron'], middle: ['Vanilla', 'Tonka Bean'], base: ['Amber', 'Spices'] },
    sizes: [{ size: '5ml', price: 5.99 }, { size: '10ml', price: 9.99 }, { size: '15ml', price: 14.99 }],
    scentProfiles: ['ambery', 'aromatic'], specificNotes: ['Vanilla', 'Amber', 'Tonka Bean', 'Spices'],
  },
  {
    id: '3', name: 'Terra', brand: 'Rayhaan', price: 4.49, size: '5ml',
    category: 'mens', inStock: true,
    image: 'https://images.unsplash.com/photo-1761659760494-32b921a2449f?w=400',
    description: 'Earthy and fresh with citrus top notes', isBestSeller: false,
    notes: { top: ['Lemon', 'Bergamot'], middle: ['Green Notes'], base: ['Vetiver'] },
    sizes: [{ size: '5ml', price: 4.49 }, { size: '10ml', price: 7.99 }, { size: '15ml', price: 11.49 }],
    scentProfiles: ['fresh', 'aromatic'], specificNotes: ['Citrus', 'Vetiver', 'Green'],
  },
  {
    id: '4', name: 'Invictus Victory', brand: 'Paco Rabanne', price: 6.99, size: '5ml',
    category: 'mens', inStock: true,
    image: 'https://images.unsplash.com/photo-1769625310883-6c87ed402d6f?w=400',
    description: 'Powerful and energetic with vanilla and tonka bean', isBestSeller: true,
    notes: { top: ['Lemon', 'Pink Pepper'], middle: ['Lavender'], base: ['Vanilla', 'Tonka Bean'] },
    sizes: [{ size: '5ml', price: 6.99 }, { size: '10ml', price: 11.99 }, { size: '15ml', price: 16.99 }],
    scentProfiles: ['ambery', 'aromatic'], specificNotes: ['Vanilla', 'Tonka Bean', 'Lavender'],
  },
  {
    id: '5', name: 'Acqua Di Gio EDT', brand: 'Giorgio Armani', price: 7.99, size: '5ml',
    category: 'mens', inStock: true,
    image: 'https://images.unsplash.com/photo-1707920961189-290d19b363f3?w=400',
    description: 'Fresh aquatic fragrance with marine notes', isBestSeller: true,
    notes: { top: ['Bergamot', 'Neroli'], middle: ['Marine Notes'], base: ['Cedarwood', 'Patchouli'] },
    sizes: [{ size: '5ml', price: 7.99 }, { size: '10ml', price: 13.99 }, { size: '15ml', price: 19.99 }],
    scentProfiles: ['fresh'], specificNotes: ['Aquatic', 'Marine', 'Citrus'],
  },
  {
    id: '6', name: 'Stronger With You Intensely', brand: 'Emporio Armani', price: 6.99, size: '5ml',
    category: 'mens', inStock: true,
    image: 'https://images.unsplash.com/photo-1767187861728-942f561b7103?w=400',
    description: 'Intense woody fragrance with vanilla and chestnut', isBestSeller: false,
    notes: { top: ['Pink Pepper', 'Juniper'], middle: ['Cinnamon', 'Sage'], base: ['Vanilla', 'Tonka Bean', 'Amber'] },
    sizes: [{ size: '5ml', price: 6.99 }, { size: '10ml', price: 11.99 }, { size: '15ml', price: 16.99 }],
    scentProfiles: ['ambery', 'aromatic'], specificNotes: ['Vanilla', 'Tonka Bean', 'Amber', 'Cinnamon'],
  },
  {
    id: '7', name: 'Y Eau de Parfum', brand: 'Yves Saint Laurent', price: 7.99, size: '5ml',
    category: 'mens', inStock: true,
    image: 'https://images.unsplash.com/photo-1761659760494-32b921a2449f?w=400',
    description: 'Modern and fresh with apple and sage', isBestSeller: true,
    notes: { top: ['Apple', 'Ginger'], middle: ['Sage', 'Juniper'], base: ['Cedarwood', 'Vetiver'] },
    sizes: [{ size: '5ml', price: 7.99 }, { size: '10ml', price: 13.99 }, { size: '15ml', price: 19.99 }],
    scentProfiles: ['fresh', 'aromatic'], specificNotes: ['Sage', 'Fruity', 'Herbal'],
  },
  {
    id: '8', name: 'Hero EDP', brand: 'Burberry', price: 7.49, size: '5ml',
    category: 'mens', inStock: true,
    image: 'https://images.unsplash.com/photo-1769625310883-6c87ed402d6f?w=400',
    description: 'Bold and confident with cedarwood', isBestSeller: false,
    notes: { top: ['Bergamot'], middle: ['Juniper', 'Black Pepper'], base: ['Cedarwood'] },
    sizes: [{ size: '5ml', price: 7.49 }, { size: '10ml', price: 12.99 }, { size: '15ml', price: 18.49 }],
    scentProfiles: ['woody', 'aromatic'], specificNotes: ['Cedarwood', 'Juniper', 'Pepper'],
  },
  {
    id: '9', name: 'Thriller', brand: 'Maison Asrar', price: 5.99, size: '5ml',
    category: 'unisex', inStock: true,
    image: 'https://images.unsplash.com/photo-1707920961189-290d19b363f3?w=400',
    description: 'Mysterious and captivating oriental blend', isBestSeller: false,
    notes: { top: ['Cardamom', 'Saffron'], middle: ['Rose', 'Jasmine'], base: ['Amber', 'Oud', 'Musk'] },
    sizes: [{ size: '5ml', price: 5.99 }, { size: '10ml', price: 10.99 }, { size: '15ml', price: 15.99 }],
    scentProfiles: ['ambery', 'floral'], specificNotes: ['Amber', 'Oud', 'Musk', 'Rose', 'Jasmine'],
  },
  {
    id: '10', name: 'Man in Black', brand: 'Bvlgari', price: 7.99, size: '5ml',
    category: 'mens', inStock: true,
    image: 'https://images.unsplash.com/photo-1767187861728-942f561b7103?w=400',
    description: 'Dark and seductive with rum and spices', isBestSeller: false,
    notes: { top: ['Spices', 'Rum'], middle: ['Leather', 'Tuberose'], base: ['Tonka Bean', 'Guaiac Wood'] },
    sizes: [{ size: '5ml', price: 7.99 }, { size: '10ml', price: 13.99 }, { size: '15ml', price: 19.99 }],
    scentProfiles: ['ambery', 'aromatic'], specificNotes: ['Spices', 'Tonka Bean', 'Rum'],
  },
  {
    id: '11', name: 'Born in Rome Intense', brand: 'Valentino', price: 7.49, size: '5ml',
    category: 'mens', inStock: true,
    image: 'https://images.unsplash.com/photo-1761659760494-32b921a2449f?w=400',
    description: 'Elegant and sophisticated with violet leaf', isBestSeller: false,
    notes: { top: ['Ginger', 'Violet Leaf'], middle: ['Sage'], base: ['Vetiver', 'Patchouli'] },
    sizes: [{ size: '5ml', price: 7.49 }, { size: '10ml', price: 12.99 }, { size: '15ml', price: 18.49 }],
    scentProfiles: ['aromatic', 'woody'], specificNotes: ['Violet', 'Sage', 'Vetiver', 'Patchouli'],
  },
  {
    id: '12', name: 'Sauvage EDP', brand: 'Dior', price: 8.99, size: '5ml',
    category: 'mens', inStock: false,
    image: 'https://images.unsplash.com/photo-1769625310883-6c87ed402d6f?w=400',
    description: 'Iconic fresh spicy fragrance', isBestSeller: true,
    scentProfiles: ['aromatic', 'fresh'], specificNotes: ['Pepper', 'Bergamot', 'Ambroxan'],
  },
  {
    id: '13', name: 'Bleu de Chanel EDP', brand: 'Chanel', price: 9.99, size: '5ml',
    category: 'mens', inStock: false,
    image: 'https://images.unsplash.com/photo-1767187861728-942f561b7103?w=400',
    description: 'Timeless woody aromatic scent', isBestSeller: true,
    scentProfiles: ['woody', 'aromatic'], specificNotes: ['Cedarwood', 'Sandalwood', 'Ginger'],
  },
  {
    id: '14', name: 'Oud Wood', brand: 'Tom Ford', price: 12.99, size: '5ml',
    category: 'unisex', inStock: false,
    image: 'https://images.unsplash.com/photo-1707920961189-290d19b363f3?w=400',
    description: 'Luxurious oud with exotic woods', isBestSeller: true,
    scentProfiles: ['woody', 'ambery'], specificNotes: ['Oud', 'Sandalwood', 'Vetiver'],
  },
  {
    id: '15', name: 'Aventus', brand: 'Creed', price: 14.99, size: '5ml',
    category: 'mens', inStock: false,
    image: 'https://images.unsplash.com/photo-1761659760494-32b921a2449f?w=400',
    description: 'Legendary fruity fragrance', isBestSeller: true,
    scentProfiles: ['fresh', 'fruity'], specificNotes: ['Pineapple', 'Birch', 'Musk'],
  },
  {
    id: '16', name: 'Eros EDT', brand: 'Versace', price: 6.99, size: '5ml',
    category: 'mens', inStock: false,
    image: 'https://images.unsplash.com/photo-1769625310883-6c87ed402d6f?w=400',
    description: 'Fresh and vibrant with mint', isBestSeller: true,
    scentProfiles: ['fresh', 'aromatic'], specificNotes: ['Mint', 'Green Apple', 'Vanilla'],
  },
  {
    id: '17', name: 'One Million', brand: 'Paco Rabanne', price: 6.99, size: '5ml',
    category: 'mens', inStock: false,
    image: 'https://images.unsplash.com/photo-1767187861728-942f561b7103?w=400',
    description: 'Sweet and spicy with cinnamon', isBestSeller: true,
    scentProfiles: ['aromatic', 'ambery'], specificNotes: ['Cinnamon', 'Rose', 'Patchouli'],
  },
  {
    id: '18', name: 'La Vie Est Belle', brand: 'Lancôme', price: 7.99, size: '5ml',
    category: 'womens', inStock: false,
    image: 'https://images.unsplash.com/photo-1707920961189-290d19b363f3?w=400',
    description: 'Sweet floral with iris and patchouli', isBestSeller: true,
    scentProfiles: ['floral', 'ambery'], specificNotes: ['Iris', 'Patchouli', 'Vanilla'],
  },
  {
    id: '19', name: 'Good Girl', brand: 'Carolina Herrera', price: 8.99, size: '5ml',
    category: 'womens', inStock: false,
    image: 'https://images.unsplash.com/photo-1761659760494-32b921a2449f?w=400',
    description: 'Elegant with jasmine and tonka bean', isBestSeller: true,
    scentProfiles: ['floral', 'ambery'], specificNotes: ['Jasmine', 'Tonka Bean', 'Almond'],
  },
  {
    id: '20', name: 'Baccarat Rouge 540', brand: 'Maison Francis Kurkdjian', price: 15.99, size: '5ml',
    category: 'unisex', inStock: false,
    image: 'https://images.unsplash.com/photo-1767187861728-942f561b7103?w=400',
    description: 'Luxurious amber and saffron', isBestSeller: true,
    scentProfiles: ['ambery', 'floral'], specificNotes: ['Saffron', 'Amber', 'Cedarwood', 'Jasmine'],
  },
];

async function seed() {
  console.log('Checking existing products in Firestore...');
  const existing = await getDocs(collection(db, 'products'));
  const existingIds = new Set(existing.docs.map(d => d.id));
  console.log(`Found ${existingIds.size} existing products.`);

  let added = 0;
  let skipped = 0;

  for (const product of products) {
    const { id, ...data } = product;
    if (existingIds.has(id)) {
      console.log(`  SKIP  ${id}: ${product.name} (already exists)`);
      skipped++;
      continue;
    }
    await setDoc(doc(db, 'products', id), data);
    console.log(`  ADD   ${id}: ${product.name}`);
    added++;
  }

  console.log(`\nDone! Added: ${added}, Skipped: ${skipped}`);
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
