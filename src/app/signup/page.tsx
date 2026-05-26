"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await api.signup({
        email,
        password,
        name: name || undefined,
        phone: phone || undefined,
      });
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
      <h1>Create account</h1>
      <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <label style={{ fontSize: 13 }}>
          Name (optional)
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ display: "block", width: "100%", padding: 8, fontSize: 14, marginTop: 4 }}
          />
        </label>
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
          Phone (optional)
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{ display: "block", width: "100%", padding: 8, fontSize: 14, marginTop: 4 }}
          />
        </label>
        <label style={{ fontSize: 13 }}>
          Password <span style={{ color: "#888" }}>(min 8 characters)</span>
          <input
            type="password"
            required
            minLength={8}
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
          {busy ? "Creating…" : "Create account"}
        </button>
      </form>
      <p style={{ marginTop: 16, fontSize: 13 }}>
        Already have an account? <a href="/login">Sign in</a>
      </p>
    </main>
  );
}
