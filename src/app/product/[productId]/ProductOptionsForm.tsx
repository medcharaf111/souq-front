"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api, type ProductOption } from "@/lib/api";

/**
 * Per-option selector + Add to Cart button.
 *
 * Salla orders accept options shaped as: [{ id: <option_id>, value: [<value_id>] }]
 * We default each required (or variant-purpose) option to the first in-stock
 * value so the customer can ship even if they don't touch a control. Quantity
 * defaults to 1.
 */
export default function ProductOptionsForm({
  productId,
  options,
  inStock,
}: {
  productId: string;
  options: ProductOption[];
  inStock: boolean;
}) {
  const router = useRouter();

  // option_id → value_id (as string for radio compatibility)
  const initialSelection = useMemo(() => {
    const m: Record<number, string> = {};
    for (const o of options) {
      const isVariant = o.purpose === "variants";
      if (!o.required && !isVariant) continue;
      const inStockVal = o.values.find((v) => !v.is_out_of_stock);
      const chosen = inStockVal ?? o.values[0];
      if (chosen) m[o.id] = String(chosen.id);
    }
    return m;
  }, [options]);

  const [selection, setSelection] = useState<Record<number, string>>(initialSelection);
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  async function addToCart() {
    setMsg(null);
    setBusy(true);
    try {
      const payload = Object.entries(selection).map(([id, value]) => ({
        id: Number(id),
        value: [value],
      }));
      await api.addToCart(productId, qty, payload);
      setMsg({ kind: "ok", text: "Added to cart" });
      router.refresh();
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      if (message.includes("401")) {
        router.push("/login?next=" + encodeURIComponent(`/product/${productId}`));
        return;
      }
      setMsg({ kind: "err", text: message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {options.map((o) => (
        <div key={o.id} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
            {o.name}
            {o.required && <span style={{ color: "#c00" }}> *</span>}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {o.values.map((v) => {
              const selected = selection[o.id] === String(v.id);
              const oos = v.is_out_of_stock;
              return (
                <button
                  type="button"
                  key={v.id}
                  onClick={() =>
                    setSelection((s) => ({ ...s, [o.id]: String(v.id) }))
                  }
                  style={{
                    padding: "8px 14px",
                    borderRadius: 4,
                    border: selected ? "2px solid #111" : "1px solid #ccc",
                    background: oos ? "#f5f5f5" : "white",
                    color: oos ? "#999" : "#111",
                    fontSize: 13,
                    cursor: "pointer",
                    textDecoration: oos ? "line-through" : undefined,
                  }}
                >
                  {v.name}
                  {oos && <span style={{ marginLeft: 6, fontSize: 11 }}>(out)</span>}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "16px 0" }}>
        <label style={{ fontSize: 13 }}>
          Qty
          <input
            type="number"
            min={1}
            max={99}
            value={qty}
            onChange={(e) => setQty(Math.max(1, Math.min(99, Number(e.target.value) || 1)))}
            style={{ width: 70, padding: 6, marginLeft: 8 }}
          />
        </label>
      </div>

      <button
        type="button"
        onClick={addToCart}
        disabled={busy || !inStock}
        style={{
          padding: "12px 20px",
          background: inStock ? (busy ? "#666" : "#111") : "#aaa",
          color: "white",
          border: 0,
          borderRadius: 4,
          fontSize: 15,
          cursor: busy ? "wait" : inStock ? "pointer" : "not-allowed",
        }}
      >
        {!inStock ? "Out of stock" : busy ? "Adding…" : "Add to cart"}
      </button>

      {msg && (
        <p
          style={{
            marginTop: 12,
            fontSize: 13,
            color: msg.kind === "ok" ? "#080" : "#c00",
          }}
        >
          {msg.text}
        </p>
      )}
    </div>
  );
}
