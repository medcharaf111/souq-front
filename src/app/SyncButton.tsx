"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function SyncButton({ storeId }: { storeId: string }) {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<string | null>(null);
  const router = useRouter();

  async function onClick() {
    setStatus(null);
    try {
      const r = await api.syncStore(storeId);
      setStatus(`synced ${r.productsUpserted} in ${r.durationMs}ms`);
      startTransition(() => router.refresh());
    } catch (e) {
      setStatus(`error: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return (
    <span>
      <button
        onClick={onClick}
        disabled={pending}
        style={{
          padding: "4px 10px",
          fontSize: 13,
          borderRadius: 4,
          border: "1px solid #ccc",
          background: pending ? "#eee" : "white",
          cursor: pending ? "wait" : "pointer",
        }}
      >
        {pending ? "Syncing…" : "Sync"}
      </button>
      {status && (
        <span
          style={{
            marginLeft: 8,
            fontSize: 12,
            color: status.startsWith("error") ? "#c00" : "#080",
          }}
        >
          {status}
        </span>
      )}
    </span>
  );
}
