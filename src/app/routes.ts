import { createBrowserRouter } from 'react-router';
import { Home } from './pages/Home';
import { Shop } from './pages/Shop';
import { Category } from './pages/Category';
import { BestSellers } from './pages/BestSellers';
import { Cart } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import { Brand } from './pages/Brand';
import { About } from './pages/About';
import { ProductDetail } from './pages/ProductDetail';
import { Inspired } from './pages/Inspired';
import { NewArrivals } from './pages/NewArrivals';
import { OrderSuccess } from './pages/OrderSuccess';
import { Login } from './pages/Login';
import { SignUp } from './pages/SignUp';
import { Account } from './pages/Account';
import { Layout } from './components/Layout';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: 'shop', Component: Shop },
      { path: 'category/:category', Component: Category },
      { path: 'bestsellers', Component: BestSellers },
      { path: 'product/:id', Component: ProductDetail },
      { path: 'inspired', Component: Inspired },
      { path: 'new-arrivals', Component: NewArrivals },
      { path: 'cart', Component: Cart },
      { path: 'checkout', Component: Checkout },
      { path: 'order-success', Component: OrderSuccess },
      { path: 'brand/:brand', Component: Brand },
      { path: 'about', Component: About },
      { path: 'login', Component: Login },
      { path: 'signup', Component: SignUp },
      { path: 'account', Component: Account },
    ],
  },
]);
