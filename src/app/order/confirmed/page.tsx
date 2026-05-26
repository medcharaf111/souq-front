import Header from "../../Header";

export const dynamic = "force-dynamic";

export default async function OrderConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const orderId = typeof sp.order_id === "string" ? sp.order_id : null;
  const sallaUrl = typeof sp.salla_url === "string" ? sp.salla_url : null;
  const pendingPayment = sp.pending_payment === "1";

  return (
    <main style={{ maxWidth: 640, margin: "0 auto" }}>
      <Header />

      <div
        style={{
          background: "#f5fbf7",
          border: "1px solid #cfe9d8",
          borderRadius: 8,
          padding: 32,
          textAlign: "center",
          marginTop: 24,
        }}
      >
        <div style={{ fontSize: 48, lineHeight: 1, marginBottom: 12 }}>✓</div>
        <h1 style={{ margin: 0, fontSize: 22 }}>Order placed successfully</h1>
        {orderId && (
          <p style={{ marginTop: 8, fontSize: 14, color: "#555" }}>
            Order reference: <strong>#{orderId}</strong>
          </p>
        )}

        {pendingPayment ? (
          <p style={{ marginTop: 16, fontSize: 14 }}>
            Payment is still required. We&apos;re sending you to the secure payment page now.
          </p>
        ) : (
          <p style={{ marginTop: 16, fontSize: 14, color: "#333" }}>
            Cash on delivery. The merchant will contact you to confirm the
            shipping address and delivery time. No further action required from you
            right now.
          </p>
        )}

        <div style={{ marginTop: 24, display: "flex", gap: 12, justifyContent: "center" }}>
          <a
            href="/"
            style={{
              padding: "10px 16px",
              background: "#111",
              color: "white",
              borderRadius: 4,
              textDecoration: "none",
              fontSize: 14,
            }}
          >
            Continue shopping
          </a>
          {sallaUrl && (
            <a
              href={sallaUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                padding: "10px 16px",
                border: "1px solid #ccc",
                color: "#333",
                borderRadius: 4,
                textDecoration: "none",
                fontSize: 14,
              }}
            >
              View on merchant&apos;s site →
            </a>
          )}
        </div>
      </div>
    </main>
  );
}
