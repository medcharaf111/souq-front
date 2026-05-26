"use client";

import { useState } from "react";
import { api, type Cart } from "@/lib/api";

export default function CheckoutForm({
  cart,
  customerName,
  customerPhone,
}: {
  cart: Cart;
  customerName: string;
  customerPhone: string;
}) {
  const [country, setCountry] = useState("SA");
  const [city, setCity] = useState("");
  const [street, setStreet] = useState("");
  const [postal, setPostal] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const r = await api.checkout({
        shipping: { country, city, street, postal_code: postal },
      });
      if (r.checkout_url) {
        window.location.href = r.checkout_url;
        return;
      }
      // No checkout URL → order may already be paid (e.g., 100% loyalty discount).
      if (r.customer_order_url) {
        window.location.href = r.customer_order_url;
        return;
      }
      setError("Order was created but no payment URL was returned. Check /account.");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 32, marginTop: 20 }}>
      <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2 style={{ marginTop: 0 }}>Shipping address</h2>
        <label style={{ fontSize: 13 }}>
          Name on order
          <input
            type="text"
            defaultValue={customerName}
            readOnly
            style={{ display: "block", width: "100%", padding: 8, marginTop: 4, background: "#f5f5f5" }}
          />
        </label>
        <label style={{ fontSize: 13 }}>
          Phone
          <input
            type="tel"
            defaultValue={customerPhone}
            readOnly
            style={{ display: "block", width: "100%", padding: 8, marginTop: 4, background: "#f5f5f5" }}
          />
        </label>
        <label style={{ fontSize: 13 }}>
          Country
          <input
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value.toUpperCase())}
            maxLength={2}
            required
            style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
          />
          <span style={{ fontSize: 11, color: "#888" }}>2-letter ISO code, e.g. SA</span>
        </label>
        <label style={{ fontSize: 13 }}>
          City
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
            style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
          />
        </label>
        <label style={{ fontSize: 13 }}>
          Street address
          <input
            type="text"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            required
            style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
          />
        </label>
        <label style={{ fontSize: 13 }}>
          Postal code
          <input
            type="text"
            value={postal}
            onChange={(e) => setPostal(e.target.value)}
            style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
          />
        </label>

        {error && <p style={{ color: "#c00", fontSize: 13, margin: 0 }}>{error}</p>}

        <button
          type="submit"
          disabled={busy}
          style={{
            padding: "12px 20px",
            background: "#111",
            color: "white",
            border: 0,
            borderRadius: 4,
            fontSize: 15,
            cursor: busy ? "wait" : "pointer",
            marginTop: 8,
          }}
        >
          {busy ? "Creating order…" : "Place order & continue to payment"}
        </button>
      </form>

      <aside style={{ background: "#fafafa", padding: 20, borderRadius: 6, height: "fit-content" }}>
        <h3 style={{ marginTop: 0, fontSize: 16 }}>Order summary</h3>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: 13 }}>
          {cart.items.map((it) => (
            <li key={it.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #eee" }}>
              <span>
                {it.name} <span style={{ color: "#888" }}>× {it.qty}</span>
              </span>
              <span>
                {it.line_total.toFixed(2)} {it.currency}
              </span>
            </li>
          ))}
        </ul>
        <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", fontWeight: 600, fontSize: 15 }}>
          <span>Subtotal</span>
          <span>
            {cart.subtotal.toFixed(2)} {cart.currency}
          </span>
        </div>
        <p style={{ fontSize: 11, color: "#888", marginTop: 12 }}>
          Shipping costs are calculated by the merchant&apos;s couriers during the payment step.
        </p>
      </aside>
    </div>
  );
}
