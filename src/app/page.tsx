import { api, STORE_ID } from "@/lib/api";
import Header from "./Header";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!STORE_ID) {
    return (
      <main style={{ maxWidth: 720, margin: "0 auto" }}>
        <h1>Configuration missing</h1>
        <p>
          This deployment doesn&apos;t have a <code>NEXT_PUBLIC_STORE_ID</code> set.
          Each frontend deployment must be branded for one specific merchant.
        </p>
        <p>
          Set <code>NEXT_PUBLIC_STORE_ID</code> in this project&apos;s environment
          variables to the merchant&apos;s store_id (visible at <a href="/admin">/admin</a>),
          then redeploy.
        </p>
      </main>
    );
  }

  const sp = await searchParams;
  const page = Number(typeof sp.page === "string" ? sp.page : "1") || 1;
  const search = typeof sp.search === "string" ? sp.search : undefined;

  let data: Awaited<ReturnType<typeof api.listProducts>> | null = null;
  let apiError: string | null = null;
  try {
    data = await api.listProducts(STORE_ID, {
      page,
      per_page: 24,
      status: "sale",
      ...(search ? { search } : {}),
    });
  } catch (e) {
    apiError = e instanceof Error ? e.message : String(e);
  }

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto" }}>
      <Header />

      <form
        method="get"
        style={{ marginBottom: 24, display: "flex", gap: 8 }}
      >
        <input
          type="text"
          name="search"
          defaultValue={search ?? ""}
          placeholder="Search products"
          style={{ flex: 1, padding: 10, fontSize: 14 }}
        />
        <button
          type="submit"
          style={{
            padding: "10px 16px",
            background: "#111",
            color: "white",
            border: 0,
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          Search
        </button>
      </form>

      {apiError && (
        <p style={{ color: "#c00" }}>
          Could not load products: <code>{apiError}</code>
        </p>
      )}

      {data && data.products.length === 0 ? (
        <p style={{ color: "#666" }}>No products yet.</p>
      ) : data ? (
        <>
          <p style={{ color: "#666", fontSize: 13 }}>
            {data.total} products · page {data.page}
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 16,
            }}
          >
            {data.products.map((p) => (
              <a
                key={p.id}
                href={`/product/${encodeURIComponent(p.id)}`}
                style={{
                  border: "1px solid #eee",
                  borderRadius: 6,
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <div
                  style={{
                    aspectRatio: "1",
                    background: "#fafafa",
                    backgroundImage: p.image ? `url(${p.image})` : undefined,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
                <div style={{ padding: 10, display: "flex", flexDirection: "column", flex: 1 }}>
                  <div
                    style={{
                      fontSize: 14,
                      lineHeight: 1.3,
                      minHeight: 36,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {p.name}
                  </div>
                  <div style={{ marginTop: 6, fontSize: 14, fontWeight: 600 }}>
                    {p.sale_price !== null && p.sale_price !== undefined ? (
                      <>
                        <span style={{ color: "#c00" }}>
                          {p.sale_price} {p.price.currency}
                        </span>{" "}
                        <span
                          style={{
                            color: "#888",
                            textDecoration: "line-through",
                            fontWeight: 400,
                            fontSize: 12,
                          }}
                        >
                          {p.price.amount} {p.price.currency}
                        </span>
                      </>
                    ) : (
                      <>
                        {p.price.amount} {p.price.currency}
                      </>
                    )}
                  </div>
                </div>
              </a>
            ))}
          </div>

          <div style={{ marginTop: 24, display: "flex", gap: 8 }}>
            {page > 1 && (
              <a href={`?page=${page - 1}${search ? `&search=${search}` : ""}`}>
                ← prev
              </a>
            )}
            {data.has_more && (
              <a href={`?page=${page + 1}${search ? `&search=${search}` : ""}`}>
                next →
              </a>
            )}
          </div>
        </>
      ) : null}
    </main>
  );
}
