// Demo mode: used when no Firebase config is present (.env empty).
// Mirrors the api.ts surface with data kept on the device via AsyncStorage.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SEED_PRODUCTS } from './seed';
import type { CartItem, Order, OrderStatus, PaymentMethod, Product, ShippingInfo, UserProfile } from './types';

const KEY = 'soko.demo.v1';

type Store = { products: Product[]; orders: Order[]; user: UserProfile | null };

let cache: Store | null = null;

const id = () => Math.random().toString(36).slice(2, 12);

async function load(): Promise<Store> {
  if (cache) return cache;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) return (cache = JSON.parse(raw) as Store);
  } catch {}
  const now = Date.now();
  cache = {
    products: SEED_PRODUCTS.map((p, i) => ({ ...p, id: `demo-${i + 1}`, createdAt: now - i * 1000 })),
    orders: [],
    user: null,
  };
  await save();
  return cache;
}

async function save() {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(cache));
  } catch {}
}

const byNewest = <T extends { createdAt?: number }>(a: T, b: T) => (b.createdAt ?? 0) - (a.createdAt ?? 0);

// ---------- Products ----------

export async function listProducts() {
  return [...(await load()).products].sort(byNewest);
}

export async function getProduct(productId: string) {
  return (await load()).products.find((p) => p.id === productId) ?? null;
}

export async function saveProduct(product: Omit<Product, 'id'>, productId?: string) {
  const s = await load();
  if (productId) {
    s.products = s.products.map((p) => (p.id === productId ? { ...p, ...product } : p));
  } else {
    productId = id();
    s.products.push({ ...product, id: productId, createdAt: Date.now() });
  }
  await save();
  return productId;
}

export async function deleteProduct(productId: string) {
  const s = await load();
  s.products = s.products.filter((p) => p.id !== productId);
  await save();
}

export async function seedProducts() {
  const s = await load();
  const now = Date.now();
  s.products.push(...SEED_PRODUCTS.map((p, i) => ({ ...p, id: id(), createdAt: now - i * 1000 })));
  await save();
}

// ---------- Orders ----------

export async function placeOrder(userId: string, cart: CartItem[], shipping: ShippingInfo, paymentMethod: PaymentMethod) {
  const s = await load();
  const items = cart.map((c) => {
    const p = s.products.find((x) => x.id === c.productId);
    if (!p) throw new Error(`"${c.name}" is no longer available.`);
    if (p.stock < c.quantity) throw new Error(`Only ${p.stock} left of "${p.name}".`);
    return { productId: p.id, name: p.name, price: p.price, imageUrl: p.imageUrl, quantity: c.quantity };
  });
  items.forEach((it) => {
    const p = s.products.find((x) => x.id === it.productId)!;
    p.stock -= it.quantity;
  });
  const order: Order = {
    id: id(),
    userId,
    items,
    total: Math.round(items.reduce((sum, it) => sum + it.price * it.quantity, 0) * 100) / 100,
    status: 'pending',
    paymentMethod,
    shipping,
    createdAt: Date.now(),
  };
  s.orders.push(order);
  await save();
  return order.id;
}

export async function listMyOrders(userId: string) {
  return (await load()).orders.filter((o) => o.userId === userId).sort(byNewest);
}

export async function listAllOrders() {
  return [...(await load()).orders].sort(byNewest);
}

export async function setOrderStatus(orderId: string, status: OrderStatus) {
  const s = await load();
  s.orders = s.orders.map((o) => (o.id === orderId ? { ...o, status } : o));
  await save();
}

// ---------- Auth ----------
// Any email/password works. Demo users are admins so every screen can be explored.

export async function currentUser() {
  return (await load()).user;
}

export async function signIn(email: string, displayName?: string): Promise<UserProfile> {
  const s = await load();
  const clean = email.trim().toLowerCase();
  s.user = { uid: `demo-${clean}`, email: clean, displayName: displayName || clean.split('@')[0], role: 'admin' };
  await save();
  return s.user;
}

export async function signOut() {
  const s = await load();
  s.user = null;
  await save();
}
