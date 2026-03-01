import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product } from '../data/products';

interface ProductsContextType {
  products: Product[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

const ProductsContext = createContext<ProductsContextType>({
  products: [],
  loading: true,
  error: null,
  refresh: () => {},
});

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const snap = await getDocs(query(collection(db, 'products'), orderBy('name')));
      const fetched = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product));
      setProducts(fetched);
    } catch (err) {
      console.error('Failed to load products from Firestore:', err);
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <ProductsContext.Provider value={{ products, loading, error, refresh: fetchProducts }}>
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  return useContext(ProductsContext);
}
