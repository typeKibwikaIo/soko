export type Category = 'fashion' | 'electronics' | 'home' | 'beauty' | 'food';

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'fashion', label: 'Fashion' },
  { id: 'electronics', label: 'Electronics' },
  { id: 'home', label: 'Home' },
  { id: 'beauty', label: 'Beauty' },
  { id: 'food', label: 'Food & Drinks' },
];

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number; // USD
  imageUrl: string;
  category: Category;
  stock: number;
  featured?: boolean;
  createdAt?: number;
};

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
};

export type PaymentMethod = 'cash' | 'mpesa' | 'orange' | 'airtel';

export const PAYMENT_METHODS: { id: PaymentMethod; label: string }[] = [
  { id: 'cash', label: 'Cash on delivery' },
  { id: 'mpesa', label: 'M-Pesa' },
  { id: 'orange', label: 'Orange Money' },
  { id: 'airtel', label: 'Airtel Money' },
];

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export const ORDER_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

export type ShippingInfo = {
  fullName: string;
  phone: string;
  city: string;
  address: string;
};

export type Order = {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  shipping: ShippingInfo;
  createdAt: number;
};

export type UserProfile = {
  uid: string;
  email: string;
  displayName: string;
  role: 'customer' | 'admin';
};
