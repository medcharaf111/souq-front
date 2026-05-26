/**
 * Returns the prefix that http() prepends to each path.
 *
 * In the browser: relative paths only. Requests go to the frontend's own
 * origin (e.g. https://souq-front.vercel.app/api/auth/me), where the Next.js
 * rewrite proxies them to the backend. This makes the backend look same-origin
 * to the browser, so the session cookie set by the backend is stored on the
 * frontend domain and automatically sent on every fetch.
 *
 * In a Node/server-component context: we still hit the same proxied path, but
 * fetch() requires an absolute URL, so we construct one against the
 * deployment's own URL (Vercel injects VERCEL_URL automatically).
 */
function getApiBase(): string {
  if (typeof window !== "undefined") return "";
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl}`;
  // Local dev: server components calling http://localhost:3001/api → rewrite → :3000
  return `http://localhost:${process.env.PORT ?? "3001"}`;
}

/** Absolute URL to the backend, used only for full-page navigations (e.g. /install). */
export const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export interface ApiStore {
  store_id: string;
  store_name: string | null;
  installed_at: string;
  last_synced_at: string | null;
  expires_at: string;
  scope: string;
  product_count: number;
}

export interface ApiProduct {
  id: string;
  salla_id: string;
  name: string;
  sku: string | null;
  description: string | null;
  price: { amount: number; currency: string };
  sale_price: number | null;
  quantity: number | null;
  status: string;
  type: string | null;
  url: string | null;
  image: string | null;
  synced_at: string;
}

export interface ProductsResponse {
  store_id: string;
  page: number;
  per_page: number;
  total: number;
  has_more: boolean;
  products: ApiProduct[];
}

export interface Customer {
  id: string;
  store_id: string;
  email: string;
  name: string | null;
  phone: string | null;
}

export interface CartItem {
  id: string;
  product_id: string;
  salla_product_id: string;
  name: string;
  image: string | null;
  url: string | null;
  sku: string | null;
  unit_price: number;
  line_total: number;
  currency: string;
  qty: number;
  stock: number | null;
  status: string;
}

export interface Cart {
  id: string;
  store_id: string;
  items: CartItem[];
  item_count: number;
  subtotal: number;
  currency: string;
}

/** The merchant this deployment is branded for. Set NEXT_PUBLIC_STORE_ID in
 *  the env file per Vercel deployment. */
export const STORE_ID = process.env.NEXT_PUBLIC_STORE_ID ?? "";

async function getServerCookieHeader(): Promise<string | null> {
  // typeof window check ensures the next/headers import is tree-shaken from
  // client bundles.
  if (typeof window !== "undefined") return null;
  try {
    const mod = await import("next/headers");
    const jar = await mod.cookies();
    const all = jar.getAll();
    if (!all.length) return null;
    return all.map((c) => `${c.name}=${c.value}`).join("; ");
  } catch {
    return null;
  }
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    ...((init?.headers as Record<string, string>) ?? {}),
  };
  // On the server, forward the user's incoming cookies so the backend's
  // session check works. On the client, the browser handles this via the
  // same-origin cookie jar (thanks to the rewrite).
  const serverCookies = await getServerCookieHeader();
  if (serverCookies) headers["cookie"] = serverCookies;

  const res = await fetch(`${getApiBase()}${path}`, {
    ...init,
    headers,
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json() as Promise<T>;
}

export const api = {
  listStores: () => http<{ stores: ApiStore[] }>("/api/stores"),
  listProducts: (storeId: string, params: Record<string, string | number> = {}) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) qs.set(k, String(v));
    const q = qs.toString();
    return http<ProductsResponse>(
      `/api/stores/${encodeURIComponent(storeId)}/products${q ? `?${q}` : ""}`
    );
  },
  syncStore: (storeId: string) =>
    http<{ storeId: string; productsUpserted: number; durationMs: number }>(
      `/api/stores/${encodeURIComponent(storeId)}/sync`,
      { method: "POST" }
    ),
  // Hits the backend directly. The OAuth state cookie has to be set on the
  // backend's domain because that's where Salla redirects back to.
  installUrl: () => `${BACKEND_URL}/install`,

  // Customer auth — every call gets the deployment's hardcoded STORE_ID injected.
  me: () => http<{ customer: Customer | null }>("/api/auth/me"),
  signup: (data: { email: string; password: string; name?: string; phone?: string }) =>
    http<{ customer: Customer }>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ ...data, storeId: STORE_ID }),
    }),
  login: (data: { email: string; password: string }) =>
    http<{ customer: Customer }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ ...data, storeId: STORE_ID }),
    }),
  logout: () => http<{ ok: true }>("/api/auth/logout", { method: "POST" }),

  // Cart
  getCart: () => http<{ cart: Cart }>("/api/cart"),
  addToCart: (productId: string, qty = 1) =>
    http<{ cart: Cart }>("/api/cart/items", {
      method: "POST",
      body: JSON.stringify({ product_id: productId, qty }),
    }),
  updateCartItem: (itemId: string, qty: number) =>
    http<{ cart: Cart }>(`/api/cart/items/${encodeURIComponent(itemId)}`, {
      method: "PATCH",
      body: JSON.stringify({ qty }),
    }),
  removeCartItem: (itemId: string) =>
    http<{ cart: Cart }>(`/api/cart/items/${encodeURIComponent(itemId)}`, {
      method: "DELETE",
    }),
  emptyCart: () => http<{ cart: Cart }>("/api/cart", { method: "DELETE" }),

  // Checkout — POSTs cart contents to Salla, returns a hosted-payment URL
  // the customer must be redirected to.
  checkout: (body: {
    shipping?: {
      country?: string;
      city?: string;
      block?: string;
      street_number?: string;
      address_line?: string;
      postal_code?: string;
      geo_coordinates?: { latitude: number; longitude: number };
    };
    courier_id?: number;
  }) =>
    http<{
      order_id: string;
      checkout_url: string | null;
      customer_order_url: string | null;
      is_pending_payment: boolean;
      total?: { amount: number; currency: string };
    }>("/api/checkout", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  // Loyalty
  getLoyaltyPoints: () =>
    http<{
      balance: number;
      used_total: number;
      entries: Array<{
        name: string;
        points: number;
        used_points: number;
        status: string;
        order_id: string | null;
        expiry_date: string | null;
      }>;
    }>("/api/loyalty/points"),
};
