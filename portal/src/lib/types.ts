export interface ProductSize {
  size: string;
  price: number;
}

export interface ProductNotes {
  top: string[];
  middle: string[];
  base: string[];
}

export interface Product {
  id?: string;
  name: string;
  brand: string;
  price: number;
  size: string;
  category: 'mens' | 'womens' | 'unisex';
  inStock: boolean;
  image: string;
  description: string;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  isInspiredBy?: boolean;
  notes?: ProductNotes;
  sizes?: ProductSize[];
  scentProfiles?: string[];
  specificNotes?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface OrderItem {
  id: string;
  name: string;
  brand: string;
  size: string;
  price: number;
  quantity: number;
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  postcode: string;
}

export interface Order {
  id: string;
  userId: string | null;
  email: string;
  shippingAddress: ShippingAddress;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
  paymentIntentId: string;
  status: string;
  createdAt: { seconds: number; nanoseconds: number };
}

export interface Banner {
  id?: string;
  title: string;
  message: string;
  type: 'sale' | 'announcement' | 'promotion';
  backgroundColor: string;
  textColor: string;
  active: boolean;
  link?: string;
  createdAt?: Date;
}

export interface Vote {
  id?: string;
  productId: string;
  productName: string;
  email: string;
  createdAt?: { seconds: number; nanoseconds: number };
}
