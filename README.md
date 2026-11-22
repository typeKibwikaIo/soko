# Soko DRC — E-commerce (Expo + Firebase)

Full-stack online store that runs on **Web, iOS and Android** from one codebase.

- **Frontend:** Expo SDK 58, Expo Router, React Native / React Native Web, TypeScript
- **Backend:** Firebase Authentication (email/password) + Cloud Firestore (with security rules)
- **Features:** landing page, product catalog with search & categories, product detail, persistent cart,
  checkout (cash on delivery, M-Pesa, Orange Money, Airtel Money), order history, admin dashboard
  (product CRUD, order status management, stats, demo-data seeding)

## 1. Firebase setup

1. Create a project at <https://console.firebase.google.com>.
2. **Build → Authentication → Get started →** enable **Email/Password**.
3. **Build → Firestore Database → Create database** (production mode).
4. **Project settings → Your apps → Add app → Web (`</>`)** and copy the config.
5. Copy `.env.example` to `.env` and paste in the values.
6. Deploy rules and indexes:

   ```bash
   npm i -g firebase-tools
   firebase login
   firebase use --add            # pick your project
   firebase deploy --only firestore
   ```

## 2. Run

```bash
npm install
npm run web        # browser
npm run android    # Android emulator or Expo Go
npm run ios        # iOS simulator (macOS) or Expo Go on iPhone
```

## 3. Make yourself admin

1. Register an account in the app.
2. Firebase console → Firestore → `users` → your document → set `role` to `admin`.
3. Open **Admin** in the header → **Seed Demo Products** to load sample items.

## Data model

| Collection | Fields |
| --- | --- |
| `users/{uid}` | `email, displayName, role ('customer' \| 'admin'), createdAt` |
| `products/{id}` | `name, description, price, imageUrl, category, stock, featured, createdAt` |
| `orders/{id}` | `userId, items[], total, status, paymentMethod, shipping{fullName, phone, city, address}, createdAt` |

Orders are placed in a Firestore **transaction** that re-reads each product's stored price, verifies stock
and decrements it atomically. Security rules only let customers decrement stock and create `pending`
orders for themselves; everything else is admin-only.

> **Hardening for production:** move `placeOrder` into a Cloud Function (requires the Blaze plan) so totals
> are computed entirely server-side, and integrate a real mobile-money API for payment confirmation.

## Deploy

- **Web:** `npx expo export -p web` then `firebase deploy --only hosting` (serves `dist/`).
- **iOS / Android:** `npx eas-cli@latest build -p ios|android`, then `eas submit`.

## Project structure

```
src/
  app/           # routes (Expo Router): index, shop, product/[id], cart, checkout, orders,
                 # login, register, account, admin/index, admin/product
  components/    # Header, Footer, Page, ProductCard, FaqItem, OrderCard, ui primitives
  context/       # AuthContext, CartContext
  lib/           # firebase, auth (web/native), api, types, theme, seed data
firestore.rules  firestore.indexes.json  firebase.json
```
