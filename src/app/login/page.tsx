"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";

  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("SA");
  const [needsRegistration, setNeedsRegistration] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function sendCode(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      await api.otpStart(email.trim());
      setStep("code");
      setInfo("We emailed you a 6-digit code. Check spam / Promotions if you don't see it.");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await api.otpVerify({
        email: email.trim(),
        code: code.trim(),
        first_name: firstName.trim() || undefined,
        last_name: lastName.trim() || undefined,
        phone: phone.trim() || undefined,
        country_code: country.trim() || undefined,
      });
      router.push(next);
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("registration_required")) {
        setNeedsRegistration(true);
        setError("New email on this store — please add your name, phone, and country to finish creating your account.");
      } else if (msg.includes("invalid_code")) {
        setError("That code is incorrect or expired. Request a new one if needed.");
      } else {
        setError(msg);
      }
    } finally {
      setBusy(false);
    }
  }

  const labelStyle: React.CSSProperties = { fontSize: 13 };
  const inputStyle: React.CSSProperties = {
    display: "block",
    width: "100%",
    padding: 8,
    fontSize: 14,
    marginTop: 4,
    boxSizing: "border-box",
  };

  return (
    <main style={{ maxWidth: 420, margin: "60px auto", padding: 16 }}>
      <h1 style={{ marginBottom: 6 }}>Sign in</h1>
      <p style={{ color: "#666", fontSize: 13, marginTop: 0 }}>
        Passwordless sign-in via Salla — we&apos;ll email you a verification code.
      </p>

      {step === "email" && (
        <form onSubmit={sendCode} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label style={labelStyle}>
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              autoFocus
            />
          </label>
          {error && <p style={{ color: "#c00", fontSize: 13, margin: 0 }}>{error}</p>}
          <button
            type="submit"
            disabled={busy || !email}
            style={{
              padding: "10px 16px",
              background: "#111",
              color: "white",
              border: 0,
              borderRadius: 4,
              cursor: busy ? "wait" : "pointer",
            }}
          >
            {busy ? "Sending code…" : "Send verification code"}
          </button>
        </form>
      )}

      {step === "code" && (
        <form onSubmit={verifyCode} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <p style={{ fontSize: 13, color: "#444", margin: 0 }}>
            Code sent to <strong>{email}</strong>.{" "}
            <button
              type="button"
              onClick={() => setStep("email")}
              style={{ background: "none", border: 0, color: "#06c", cursor: "pointer", padding: 0, fontSize: 13 }}
            >
              change
            </button>
          </p>
          <label style={labelStyle}>
            Verification code
            <input
              type="text"
              inputMode="numeric"
              pattern="\d*"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              style={{ ...inputStyle, letterSpacing: 4, fontFamily: "monospace", fontSize: 18 }}
              autoFocus
            />
          </label>

          {needsRegistration && (
            <>
              <div style={{ display: "flex", gap: 8 }}>
                <label style={{ ...labelStyle, flex: 1 }}>
                  First name
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    style={inputStyle}
                  />
                </label>
                <label style={{ ...labelStyle, flex: 1 }}>
                  Last name
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    style={inputStyle}
                  />
                </label>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <label style={{ ...labelStyle, width: 90 }}>
                  Country
                  <input
                    type="text"
                    required
                    value={country}
                    onChange={(e) => setCountry(e.target.value.toUpperCase())}
                    style={inputStyle}
                    placeholder="SA"
                    title="ISO country code (e.g. SA, TN)"
                  />
                </label>
                <label style={{ ...labelStyle, flex: 1 }}>
                  Phone (local, no country code)
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={inputStyle}
                    placeholder="500000000"
                  />
                </label>
              </div>
            </>
          )}

          {info && !error && <p style={{ color: "#444", fontSize: 12, margin: 0 }}>{info}</p>}
          {error && <p style={{ color: "#c00", fontSize: 13, margin: 0 }}>{error}</p>}

          <button
            type="submit"
            disabled={busy || code.length < 3}
            style={{
              padding: "10px 16px",
              background: "#111",
              color: "white",
              border: 0,
              borderRadius: 4,
              cursor: busy ? "wait" : "pointer",
            }}
          >
            {busy ? "Verifying…" : needsRegistration ? "Create account" : "Verify & sign in"}
          </button>
          <button
            type="button"
            onClick={() => sendCode()}
            disabled={busy}
            style={{
              padding: "8px 14px",
              background: "transparent",
              color: "#06c",
              border: "1px solid #ddd",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Resend code
          </button>
        </form>
      )}
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
