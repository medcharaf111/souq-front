import { notFound } from "next/navigation";
import { api, STORE_ID } from "@/lib/api";
import Header from "../../Header";
import ProductOptionsForm from "./ProductOptionsForm";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  if (!STORE_ID) {
    return (
      <main style={{ maxWidth: 720, margin: "0 auto" }}>
        <Header />
        <p>NEXT_PUBLIC_STORE_ID is not set on this deployment.</p>
      </main>
    );
  }

  let product: Awaited<ReturnType<typeof api.getProduct>>["product"] | null = null;
  let fetchError: string | null = null;
  try {
    product = (await api.getProduct(STORE_ID, productId)).product;
  } catch (e) {
    fetchError = e instanceof Error ? e.message : String(e);
  }
  if (fetchError && fetchError.startsWith("404")) {
    notFound();
  }
  if (fetchError) {
    return (
      <main style={{ maxWidth: 720, margin: "0 auto" }}>
        <Header />
        <p style={{ color: "#c00" }}>
          Could not load product: <code>{fetchError}</code>
        </p>
        <p style={{ fontSize: 13 }}>
          <a href="/">← back to shop</a>
        </p>
      </main>
    );
  }
  if (!product) notFound();

  const isOnSale = product.sale_price !== null && product.sale_price !== undefined;

  return (
    <main style={{ maxWidth: 1000, margin: "0 auto" }}>
      <Header />
      <p style={{ fontSize: 13 }}>
        <a href="/">← back to shop</a>
      </p>

      <div
        style={{
          display: "grid",
          // minmax(0, 1fr) instead of 1fr so columns don't blow out the
          // container when content has any min-width (default 1fr = minmax(auto,1fr)
          // lets the columns expand past the parent — that's how the product
          // image div was rendering 1541px on a 1000px-wide main).
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
          gap: 32,
          marginTop: 16,
        }}
      >
        <div
          style={{
            // Hard cap as a belt-and-braces for any browser that still
            // mis-sizes aspect-ratio in a grid column.
            maxWidth: "100%",
            aspectRatio: "1",
            background: "#fafafa",
            backgroundImage: product.image ? `url(${product.image})` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
            borderRadius: 8,
          }}
        />

        <div>
          <h1 style={{ marginTop: 0 }}>{product.name}</h1>
          {product.sku && (
            <p style={{ fontSize: 12, color: "#888", margin: "0 0 16px" }}>
              SKU {product.sku}
            </p>
          )}

          <div style={{ fontSize: 22, fontWeight: 600, marginBottom: 16 }}>
            {isOnSale ? (
              <>
                <span style={{ color: "#c00" }}>
                  {product.sale_price} {product.price.currency}
                </span>{" "}
                <span
                  style={{
                    color: "#888",
                    textDecoration: "line-through",
                    fontWeight: 400,
                    fontSize: 14,
                  }}
                >
                  {product.price.amount} {product.price.currency}
                </span>
              </>
            ) : (
              <>
                {product.price.amount} {product.price.currency}
              </>
            )}
          </div>

          {product.description && (
            <>
              <style>{`
                main img, main video, main iframe { max-width: 100% !important; height: auto !important; width: auto !important; max-height: 360px !important; object-fit: contain !important; display: block !important; box-sizing: border-box !important; }
                .product-description, .product-description * { max-width: 100% !important; box-sizing: border-box !important; }
                .product-description img { margin: 8px 0; border-radius: 4px; }
                .product-description table { display: block; overflow-x: auto; }
              `}</style>
              <div
                className="product-description"
                style={{
                  fontSize: 14,
                  lineHeight: 1.6,
                  marginBottom: 20,
                  color: "#444",
                  overflow: "hidden",
                  overflowWrap: "break-word",
                  wordBreak: "break-word",
                }}
                dangerouslySetInnerHTML={{
                  // Pre-strip width/height attributes so they can't fight our CSS.
                  __html: product.description
                    .replace(/\s+(width|height)\s*=\s*["'][^"']*["']/gi, "")
                    .replace(/style\s*=\s*["'][^"']*\b(width|min-width|height|min-height)\s*:[^;"']*[;"'][^"']*["']/gi, ""),
                }}
              />
            </>
          )}

          <ProductOptionsForm
            productId={product.id}
            options={product.options}
            inStock={product.status === "sale"}
          />

          {product.url && (
            <p style={{ marginTop: 16, fontSize: 12, color: "#888" }}>
              <a href={product.url} target="_blank" rel="noreferrer">
                View on merchant site ↗
              </a>
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
