"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { api, type Cart } from "@/lib/api";

export default function CartLines({ cart: initialCart }: { cart: Cart }) {
  const router = useRouter();
  const [cart, setCart] = useState<Cart>(initialCart);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function setQty(itemId: string, qty: number) {
    setError(null);
    try {
      const r = await api.updateCartItem(itemId, qty);
      setCart(r.cart);
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function remove(itemId: string) {
    setError(null);
    try {
      const r = await api.removeCartItem(itemId);
      setCart(r.cart);
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  function onCheckout() {
    router.push("/checkout");
  }

  return (
    <div>
      {error && <p style={{ color: "#c00", fontSize: 13 }}>{error}</p>}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #eee", fontSize: 13, color: "#666" }}>
            <th style={{ textAlign: "left", padding: "10px 6px" }}>Item</th>
            <th style={{ textAlign: "right", padding: "10px 6px" }}>Unit</th>
            <th style={{ textAlign: "center", padding: "10px 6px" }}>Qty</th>
            <th style={{ textAlign: "right", padding: "10px 6px" }}>Total</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {cart.items.map((it) => (
            <tr key={it.id} style={{ borderBottom: "1px solid #f4f4f4" }}>
              <td style={{ padding: "10px 6px", display: "flex", alignItems: "center", gap: 10 }}>
                {it.image ? (
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 4,
                      background: `url(${it.image}) center/cover #fafafa`,
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div style={{ width: 56, height: 56, background: "#fafafa", borderRadius: 4 }} />
                )}
                <div>
                  <div style={{ fontSize: 14 }}>{it.name}</div>
                  {it.sku && <div style={{ fontSize: 11, color: "#888" }}>SKU {it.sku}</div>}
                </div>
              </td>
              <td style={{ padding: "10px 6px", textAlign: "right", fontSize: 14 }}>
                {it.unit_price} {it.currency}
              </td>
              <td style={{ padding: "10px 6px", textAlign: "center" }}>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={it.qty}
                  onChange={(e) => setQty(it.id, Math.max(1, Number(e.target.value) || 1))}
                  disabled={pending}
                  style={{ width: 60, padding: 4, textAlign: "center" }}
                />
              </td>
              <td style={{ padding: "10px 6px", textAlign: "right", fontSize: 14, fontWeight: 600 }}>
                {it.line_total.toFixed(2)} {it.currency}
              </td>
              <td style={{ padding: "10px 6px" }}>
                <button
                  onClick={() => remove(it.id)}
                  disabled={pending}
                  style={{ border: 0, background: "none", color: "#c00", cursor: "pointer", fontSize: 13 }}
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3} style={{ padding: "16px 6px", textAlign: "right", fontWeight: 600 }}>
              Subtotal
            </td>
            <td style={{ padding: "16px 6px", textAlign: "right", fontWeight: 600, fontSize: 16 }}>
              {cart.subtotal.toFixed(2)} {cart.currency}
            </td>
            <td />
          </tr>
        </tfoot>
      </table>
      <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end", gap: 12 }}>
        <a
          href="/"
          style={{
            padding: "10px 16px",
            border: "1px solid #ccc",
            borderRadius: 4,
            textDecoration: "none",
            color: "#333",
            fontSize: 14,
          }}
        >
          Continue shopping
        </a>
        <button
          onClick={onCheckout}
          disabled={pending || cart.items.length === 0}
          style={{
            padding: "10px 20px",
            background: "#111",
            color: "white",
            border: 0,
            borderRadius: 4,
            cursor: pending ? "wait" : "pointer",
            fontSize: 14,
          }}
        >
          Continue to checkout
        </button>
      </div>
    </div>
  );
}
