import { RouterProvider } from 'react-router';
import { router } from './routes';
import { CartProvider } from '../context/CartContext';
import { AuthProvider } from '../context/AuthContext';
import { ProductsProvider } from '../context/ProductsContext';
import { Toaster } from './components/ui/sonner';

export default function App() {
  return (
    <AuthProvider>
      <ProductsProvider>
        <CartProvider>
          <RouterProvider router={router} />
          <Toaster />
        </CartProvider>
      </ProductsProvider>
    </AuthProvider>
  );
}
