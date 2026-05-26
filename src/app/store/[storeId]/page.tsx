import { api } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function StorePage({
  params,
  searchParams,
}: {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { storeId } = await params;
  const sp = await searchParams;
  const page = Number(typeof sp.page === "string" ? sp.page : "1") || 1;
  const search = typeof sp.search === "string" ? sp.search : undefined;

  let data: Awaited<ReturnType<typeof api.listProducts>> | null = null;
  let apiError: string | null = null;
  try {
    data = await api.listProducts(storeId, {
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
      <p style={{ fontSize: 13 }}>
        <a href="/">← back</a>
      </p>
      <h1>
        Store <code>{storeId}</code>
      </h1>

      <form
        method="get"
        style={{ marginBottom: 16, display: "flex", gap: 8 }}
      >
        <input
          type="text"
          name="search"
          defaultValue={search ?? ""}
          placeholder="Search products"
          style={{ flex: 1, padding: 8, fontSize: 14 }}
        />
        <button
          type="submit"
          style={{
            padding: "8px 14px",
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
        <p style={{ color: "#666" }}>
          No products yet. Hit <strong>Sync</strong> from the admin page.
        </p>
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
                href={p.url ?? "#"}
                target={p.url ? "_blank" : undefined}
                rel="noreferrer"
                style={{
                  textDecoration: "none",
                  color: "inherit",
                  border: "1px solid #eee",
                  borderRadius: 6,
                  overflow: "hidden",
                  display: "block",
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
                <div style={{ padding: 10 }}>
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
