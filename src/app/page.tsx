import { api } from "@/lib/api";
import SyncButton from "./SyncButton";

export const dynamic = "force-dynamic";

export default async function Home() {
  let stores: Awaited<ReturnType<typeof api.listStores>>["stores"] = [];
  let apiError: string | null = null;
  try {
    const r = await api.listStores();
    stores = r.stores;
  } catch (e) {
    apiError = e instanceof Error ? e.message : String(e);
  }

  return (
    <main style={{ maxWidth: 760, margin: "0 auto" }}>
      <h1>Souq — admin</h1>
      <p>
        <a
          href={api.installUrl()}
          style={{
            display: "inline-block",
            padding: "10px 16px",
            background: "#111",
            color: "white",
            borderRadius: 6,
            textDecoration: "none",
          }}
        >
          Install on a Salla store
        </a>
      </p>

      {apiError && (
        <p style={{ color: "#c00" }}>
          Could not reach the backend: <code>{apiError}</code>
        </p>
      )}

      <h2>Installed stores</h2>
      {stores.length === 0 && !apiError ? (
        <p style={{ color: "#666" }}>Nothing installed yet.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
              <th style={{ padding: "8px 4px" }}>Store</th>
              <th style={{ padding: "8px 4px" }}>Products</th>
              <th style={{ padding: "8px 4px" }}>Last synced</th>
              <th style={{ padding: "8px 4px" }}></th>
            </tr>
          </thead>
          <tbody>
            {stores.map((s) => (
              <tr key={s.store_id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                <td style={{ padding: "10px 4px" }}>
                  <div>
                    {s.store_name ?? <code>{s.store_id}</code>}
                  </div>
                  <div style={{ fontSize: 12, color: "#888" }}>
                    token exp {s.expires_at.slice(0, 16).replace("T", " ")}
                  </div>
                </td>
                <td style={{ padding: "10px 4px" }}>
                  <a href={`/store/${encodeURIComponent(s.store_id)}`}>
                    {s.product_count}
                  </a>
                </td>
                <td style={{ padding: "10px 4px", fontSize: 13, color: "#666" }}>
                  {s.last_synced_at
                    ? s.last_synced_at.slice(0, 16).replace("T", " ")
                    : "never"}
                </td>
                <td style={{ padding: "10px 4px" }}>
                  <SyncButton storeId={s.store_id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <p style={{ marginTop: 32, fontSize: 12, color: "#888" }}>
        Customer storefront lives at <code>/store/[storeId]</code>.
      </p>
    </main>
  );
}
