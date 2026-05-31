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
          gridTemplateColumns: "1fr 1fr",
          gap: 32,
          marginTop: 16,
        }}
      >
        <div
          style={{
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
                .product-description img,
                .product-description video,
                .product-description iframe {
                  max-width: 100%;
                  height: auto;
                  display: block;
                  margin: 8px 0;
                  border-radius: 4px;
                }
                .product-description table { max-width: 100%; }
                .product-description * { max-width: 100% !important; box-sizing: border-box; }
              `}</style>
              <div
                className="product-description"
                style={{
                  fontSize: 14,
                  lineHeight: 1.6,
                  marginBottom: 20,
                  color: "#444",
                  overflowWrap: "break-word",
                  wordBreak: "break-word",
                }}
                dangerouslySetInnerHTML={{ __html: product.description }}
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
