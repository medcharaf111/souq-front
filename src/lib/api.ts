export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

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

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
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
  installUrl: () => `${API_URL}/install`,
};
