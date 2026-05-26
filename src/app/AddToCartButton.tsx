"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function AddToCartButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setBusy(true);
    setMsg(null);
    try {
      await api.addToCart(productId, 1);
      setMsg("Added");
      // Refresh the page so the header count updates.
      router.refresh();
      setTimeout(() => setMsg(null), 1500);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("401")) {
        router.push("/login");
        return;
      }
      setMsg("Error");
      setTimeout(() => setMsg(null), 1500);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={onClick}
      disabled={busy}
      style={{
        width: "100%",
        padding: "8px 10px",
        marginTop: 8,
        background: msg === "Added" ? "#0a8" : msg === "Error" ? "#c00" : "#111",
        color: "white",
        border: 0,
        borderRadius: 4,
        fontSize: 13,
        cursor: busy ? "wait" : "pointer",
      }}
    >
      {busy ? "Adding…" : msg ?? "Add to cart"}
    </button>
  );
}
