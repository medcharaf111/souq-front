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
  const method = typeof sp.method === "string" ? sp.method : null;

  // Method-specific copy. If we don't recognize it, fall back to generic.
  const methodCopy: Record<string, { title: string; body: string }> = {
    cod: {
      title: "Cash on delivery",
      body: "The merchant will contact you to confirm the shipping address and delivery time. Pay the courier when your order arrives.",
    },
    bank: {
      title: "Bank transfer",
      body: "The merchant will contact you with bank transfer instructions. Your order will be processed once payment is confirmed.",
    },
    credit_card: {
      title: "Credit card payment",
      body: "Your payment was processed. The merchant will fulfill your order shortly.",
    },
    mada: {
      title: "Mada payment",
      body: "Your payment was processed. The merchant will fulfill your order shortly.",
    },
    apple_pay: {
      title: "Apple Pay",
      body: "Your payment was processed. The merchant will fulfill your order shortly.",
    },
    stc_pay: {
      title: "STC Pay",
      body: "Your payment was processed. The merchant will fulfill your order shortly.",
    },
  };
  const detail = method ? methodCopy[method] : null;

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
        ) : detail ? (
          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#333", margin: 0 }}>
              {detail.title}
            </p>
            <p style={{ fontSize: 14, color: "#333", marginTop: 6 }}>{detail.body}</p>
          </div>
        ) : (
          <p style={{ marginTop: 16, fontSize: 14, color: "#333" }}>
            Your order is being processed. The merchant will contact you with the
            next steps for payment and delivery.
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
