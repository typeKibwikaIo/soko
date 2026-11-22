import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import * as mock from './mock';
import type { CartItem, Order, OrderStatus, PaymentMethod, Product, ShippingInfo } from './types';
import { SEED_PRODUCTS } from './seed';

const productsCol = collection(db, 'products');
const ordersCol = collection(db, 'orders');

// ---------- Products ----------

export async function listProducts(): Promise<Product[]> {
  if (!isFirebaseConfigured) return mock.listProducts();
  const snap = await getDocs(query(productsCol, orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Product, 'id'>) }));
}

export async function getProduct(id: string): Promise<Product | null> {
  if (!isFirebaseConfigured) return mock.getProduct(id);
  const snap = await getDoc(doc(db, 'products', id));
  return snap.exists() ? { id: snap.id, ...(snap.data() as Omit<Product, 'id'>) } : null;
}

export async function saveProduct(product: Omit<Product, 'id'>, id?: string): Promise<string> {
  if (!isFirebaseConfigured) return mock.saveProduct(product, id);
  if (id) {
    await updateDoc(doc(db, 'products', id), product);
    return id;
  }
  const ref = await addDoc(productsCol, { ...product, createdAt: Date.now() });
  return ref.id;
}

export async function deleteProduct(id: string) {
  if (!isFirebaseConfigured) return mock.deleteProduct(id);
  await deleteDoc(doc(db, 'products', id));
}

export async function seedProducts() {
  if (!isFirebaseConfigured) return mock.seedProducts();
  const batch = writeBatch(db);
  const now = Date.now();
  SEED_PRODUCTS.forEach((p, i) => {
    batch.set(doc(productsCol), { ...p, createdAt: now - i * 1000 });
  });
  await batch.commit();
}

// ---------- Orders ----------

/**
 * Places an order atomically: re-reads every product to use the stored price,
 * checks and decrements stock, then writes the order.
 */
export async function placeOrder(
  userId: string,
  cart: CartItem[],
  shipping: ShippingInfo,
  paymentMethod: PaymentMethod,
): Promise<string> {
  if (!isFirebaseConfigured) return mock.placeOrder(userId, cart, shipping, paymentMethod);
  const orderRef = doc(ordersCol);

  await runTransaction(db, async (tx) => {
    const refs = cart.map((item) => doc(db, 'products', item.productId));
    const snaps = await Promise.all(refs.map((r) => tx.get(r)));

    const items: CartItem[] = snaps.map((snap, i) => {
      if (!snap.exists()) throw new Error(`"${cart[i].name}" is no longer available.`);
      const p = snap.data() as Product;
      if (p.stock < cart[i].quantity) {
        throw new Error(`Only ${p.stock} left of "${p.name}".`);
      }
      return { productId: snap.id, name: p.name, price: p.price, imageUrl: p.imageUrl, quantity: cart[i].quantity };
    });

    snaps.forEach((snap, i) => {
      tx.update(refs[i], { stock: (snap.data() as Product).stock - cart[i].quantity });
    });

    const total = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
    tx.set(orderRef, {
      userId,
      items,
      total: Math.round(total * 100) / 100,
      status: 'pending',
      paymentMethod,
      shipping,
      createdAt: Date.now(),
    });
  });

  return orderRef.id;
}

export async function listMyOrders(userId: string): Promise<Order[]> {
  if (!isFirebaseConfigured) return mock.listMyOrders(userId);
  const snap = await getDocs(query(ordersCol, where('userId', '==', userId), orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Order, 'id'>) }));
}

export async function listAllOrders(): Promise<Order[]> {
  if (!isFirebaseConfigured) return mock.listAllOrders();
  const snap = await getDocs(query(ordersCol, orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Order, 'id'>) }));
}

export async function setOrderStatus(id: string, status: OrderStatus) {
  if (!isFirebaseConfigured) return mock.setOrderStatus(id, status);
  await updateDoc(doc(db, 'orders', id), { status });
}

// ---------- Users ----------

export async function createUserProfile(uid: string, email: string, displayName: string) {
  await setDoc(doc(db, 'users', uid), { email, displayName, role: 'customer', createdAt: Date.now() });
}
