import { RouterProvider } from 'react-router';
import { router } from './routes';
import { CartProvider } from '../context/CartContext';
import { Toaster } from './components/ui/sonner';

export default function App() {
  return (
    <CartProvider>
      <RouterProvider router={router} />
      <Toaster />
    </CartProvider>
  );
}
