// REST client for the Soko backend (Express + Prisma + PostgreSQL).
// Active when EXPO_PUBLIC_API_URL is set; otherwise the app stays in demo mode.
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');
export const isBackendConfigured = API_URL.length > 0;

const ACCESS_KEY = 'soko.accessToken';
const REFRESH_KEY = 'soko.refreshToken';

// SecureStore has no web implementation — localStorage is the web fallback.
const storage = {
  async get(key: string): Promise<string | null> {
    return Platform.OS === 'web' ? localStorage.getItem(key) : SecureStore.getItemAsync(key);
  },
  async set(key: string, value: string) {
    if (Platform.OS === 'web') localStorage.setItem(key, value);
    else await SecureStore.setItemAsync(key, value);
  },
  async remove(key: string) {
    if (Platform.OS === 'web') localStorage.removeItem(key);
    else await SecureStore.deleteItemAsync(key);
  },
};

export async function saveTokens(accessToken: string, refreshToken: string) {
  await storage.set(ACCESS_KEY, accessToken);
  await storage.set(REFRESH_KEY, refreshToken);
}

export async function clearTokens() {
  await storage.remove(ACCESS_KEY);
  await storage.remove(REFRESH_KEY);
}

export async function getRefreshToken() {
  return storage.get(REFRESH_KEY);
}

export async function getAccessToken() {
  return storage.get(ACCESS_KEY);
}

// ---------- HTTP ----------

let refreshing: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  refreshing ??= (async () => {
    const refreshToken = await storage.get(REFRESH_KEY);
    if (!refreshToken) return false;
    try {
      const res = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) {
        await clearTokens();
        return false;
      }
      const data = (await res.json()) as TokenResponse;
      await saveTokens(data.accessToken, data.refreshToken);
      return true;
    } catch {
      return false;
    }
  })().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

/** fetch wrapper: attaches the access token, refreshes once on 401, retries. */
export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const doFetch = async () => {
    const token = await storage.get(ACCESS_KEY);
    return fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  };

  let res = await doFetch();
  if (res.status === 401 && !path.startsWith('/api/auth/')) {
    if (await tryRefresh()) res = await doFetch();
  }
  return res;
}

/** Parses a JSON error body into an Error with the server's message. */
export async function apiError(res: Response): Promise<Error> {
  let message = `Request failed (${res.status})`;
  try {
    const body = (await res.json()) as { error?: string; message?: string };
    message = body.error ?? body.message ?? message;
  } catch {}
  return new Error(message);
}

// ---------- Auth API ----------

export type RoleName = 'BUYER' | 'VENDOR' | 'ADMIN';

export type BackendUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  status: string;
  roles: RoleName[];
  buyerProfile: { id: string; preferredLanguage: string | null } | null;
  vendorProfile: {
    id: string;
    businessName: string | null;
    businessType: string | null;
    registrationNumber: string | null;
    idNumber: string | null;
    dateOfBirth: string | null;
    idDocumentFrontUrl: string | null;
    idDocumentBackUrl: string | null;
    verificationStatus: 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
    verificationSubmittedAt: string | null;
    verificationNote: string | null;
  } | null;
  createdAt: string;
};

type TokenResponse = { accessToken: string; refreshToken: string };
export type AuthResponse = TokenResponse & { user: BackendUser };

export type SignUpInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
  role: 'BUYER' | 'VENDOR';
};

async function authCall(path: string, body: unknown): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw await apiError(res);
  const data = (await res.json()) as AuthResponse;
  await saveTokens(data.accessToken, data.refreshToken);
  return data;
}

export function backendRegister(input: SignUpInput) {
  return authCall('/api/auth/register', input);
}

export function backendLogin(email: string, password: string) {
  return authCall('/api/auth/login', { email, password });
}

export async function backendLogout() {
  const refreshToken = await storage.get(REFRESH_KEY);
  if (refreshToken) {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
    } catch {}
  }
  await clearTokens();
}

/** Validates the stored session on app start; returns the user or null. */
export async function backendMe(): Promise<BackendUser | null> {
  const token = await storage.get(ACCESS_KEY);
  if (!token && !(await storage.get(REFRESH_KEY))) return null;
  const res = await apiFetch('/api/auth/me');
  if (!res.ok) return null;
  const data = (await res.json()) as { user: BackendUser };
  return data.user;
}

// ---------- Profile & addresses ----------

export type Address = {
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  region: string | null;
  country: string;
  postalCode: string | null;
  addressType: 'SHIPPING' | 'BILLING';
  isDefault: boolean;
};

export type ProfileUpdate = {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  avatarUrl?: string | null;
};

export async function getProfile(): Promise<BackendUser> {
  const res = await apiFetch('/api/users/profile');
  if (!res.ok) throw await apiError(res);
  return ((await res.json()) as { user: BackendUser }).user;
}

export async function updateProfile(data: ProfileUpdate): Promise<BackendUser> {
  const res = await apiFetch('/api/users/profile', { method: 'PUT', body: JSON.stringify(data) });
  if (!res.ok) throw await apiError(res);
  return ((await res.json()) as { user: BackendUser }).user;
}

export async function listAddresses(): Promise<Address[]> {
  const res = await apiFetch('/api/addresses');
  if (!res.ok) throw await apiError(res);
  return ((await res.json()) as { addresses: Address[] }).addresses;
}

export type AddressInput = {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  region?: string;
  country?: string;
  postalCode?: string;
  isDefault?: boolean;
};

export async function createAddress(data: AddressInput): Promise<Address> {
  const res = await apiFetch('/api/addresses', { method: 'POST', body: JSON.stringify(data) });
  if (!res.ok) throw await apiError(res);
  return ((await res.json()) as { address: Address }).address;
}

export async function deleteAddress(id: string): Promise<void> {
  const res = await apiFetch(`/api/addresses/${id}`, { method: 'DELETE' });
  if (!res.ok) throw await apiError(res);
}

// ---------- Verification & uploads ----------

/** Uploads an image (avatar, ID document) and returns its public URL. */
export async function uploadFile(localUri: string, mimeType = 'image/jpeg'): Promise<string> {
  const token = await getAccessToken();

  const form = new FormData();
  const filename = localUri.split('/').pop()?.split('?')[0] ?? 'upload.jpg';

  if (Platform.OS === 'web') {
    // Browsers can't serialize RN's { uri, name, type } file objects — fetch a real Blob.
    const blob = await (await fetch(localUri)).blob();
    form.append('file', blob, filename);
  } else {
    // React Native FormData accepts { uri, name, type } objects.
    form.append('file', { uri: localUri, name: filename, type: mimeType } as unknown as Blob);
  }

  const res = await fetch(`${API_URL}/api/uploads`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  if (!res.ok) throw await apiError(res);
  return ((await res.json()) as { url: string }).url;
}

/** Absolute URL for a backend-relative path like /uploads/xyz.jpg. */
export function assetUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${API_URL}${path}`;
}

export async function resendVerificationEmail(): Promise<void> {
  const res = await apiFetch('/api/auth/resend-verification', { method: 'POST' });
  if (!res.ok) throw await apiError(res);
}

export async function requestPhoneOtp(): Promise<void> {
  const res = await apiFetch('/api/auth/phone/request-otp', { method: 'POST' });
  if (!res.ok) throw await apiError(res);
}

export async function verifyPhoneOtp(code: string): Promise<void> {
  const res = await apiFetch('/api/auth/phone/verify', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
  if (!res.ok) throw await apiError(res);
}

export type VendorVerificationInput = {
  idNumber: string;
  dateOfBirth: string; // YYYY-MM-DD
  idDocumentUrl: string;
};

export async function submitVendorVerification(data: VendorVerificationInput): Promise<BackendUser['vendorProfile']> {
  const res = await apiFetch('/api/vendors/verification', { method: 'POST', body: JSON.stringify(data) });
  if (!res.ok) throw await apiError(res);
  return ((await res.json()) as { vendorProfile: BackendUser['vendorProfile'] }).vendorProfile;
}
