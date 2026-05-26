"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await api.login({ email, password });
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ maxWidth: 380, margin: "60px auto" }}>
      <h1>Sign in</h1>
      <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <label style={{ fontSize: 13 }}>
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ display: "block", width: "100%", padding: 8, fontSize: 14, marginTop: 4 }}
          />
        </label>
        <label style={{ fontSize: 13 }}>
          Password
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ display: "block", width: "100%", padding: 8, fontSize: 14, marginTop: 4 }}
          />
        </label>
        {error && <p style={{ color: "#c00", fontSize: 13, margin: 0 }}>{error}</p>}
        <button
          type="submit"
          disabled={busy}
          style={{
            padding: "10px 16px",
            background: "#111",
            color: "white",
            border: 0,
            borderRadius: 4,
            cursor: busy ? "wait" : "pointer",
          }}
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p style={{ marginTop: 16, fontSize: 13 }}>
        New here? <a href="/signup">Create an account</a>
      </p>
    </main>
  );
}
