"use client";

import { useState } from "react";
import { api, type Cart } from "@/lib/api";

// Hardcoded conversion rate for the UI preview. The backend reads the real
// rate from Salla's loyalty program config; this is just for showing the user
// a rough discount estimate before they click "Place order". If your merchant
// has configured a different rate, update this constant.
const POINTS_PER_CURRENCY_UNIT = 10;

export default function CheckoutForm({
  cart,
  customerName,
  customerPhone,
  loyaltyBalance,
}: {
  cart: Cart;
  customerName: string;
  customerPhone: string;
  loyaltyBalance: number;
}) {
  const [name, setName] = useState(customerName);
  const [phone, setPhone] = useState(customerPhone);
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "online">("cod");
  const [redeemPoints, setRedeemPoints] = useState(0);
  const [country, setCountry] = useState("SA");
  const [city, setCity] = useState("");
  const [block, setBlock] = useState("");
  const [street, setStreet] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [postal, setPostal] = useState("");
  const [lat, setLat] = useState<string>("");
  const [lng, setLng] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | null>(null);
  const [busy, setBusy] = useState(false);

  function parseError(message: string): { summary: string; fields: Record<string, string[]> | null } {
    // Backend sends 400 with { error, message, fields? } as JSON; the http()
    // wrapper formats failures as "<status> <body>". Try to extract the body.
    const m = message.match(/^\d+\s+(.+)$/s);
    if (m) {
      try {
        const parsed = JSON.parse(m[1]) as {
          message?: string;
          fields?: Record<string, string[]>;
          error?: string;
        };
        return {
          summary: parsed.message ?? parsed.error ?? message,
          fields: parsed.fields ?? null,
        };
      } catch {
        /* fall through */
      }
    }
    return { summary: message, fields: null };
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setError("Geolocation not supported by this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        setError(null);
      },
      (err) => setError(`Location error: ${err.message}`),
      { timeout: 10000 }
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors(null);
    // Client-side validation: Salla requires first + last name and a phone.
    const trimmedName = name.trim();
    if (!trimmedName.includes(" ")) {
      setError("Please enter your full name (first and last).");
      return;
    }
    if (!phone.trim()) {
      setError("Phone number is required.");
      return;
    }
    setBusy(true);
    try {
      const r = await api.checkout({
        name: trimmedName,
        phone: phone.trim(),
        payment_method: paymentMethod,
        ...(redeemPoints > 0 ? { redeem_points: redeemPoints } : {}),
        shipping: {
          country,
          city,
          block,
          street_number: street,
          address_line: addressLine,
          postal_code: postal,
          ...(lat && lng
            ? {
                geo_coordinates: {
                  latitude: Number(lat),
                  longitude: Number(lng),
                },
              }
            : {}),
        },
      });
      // Headless stores (Path A: no installed partner app) send the customer
      // straight to the merchant's native /cart page, where Salla's published
      // checkout completes the order. Our backend already mirrored the cart
      // to the customer's Salla account, so the page picks it up server-side.
      if (r.headless && r.checkout_url) {
        window.location.href = r.checkout_url;
        return;
      }
      // Customer picked "Pay online" → send them to Salla's checkout URL
      // regardless of is_pending_payment. Salla's payment_pending orders return
      // is_pending_payment:false but the URL IS the place where the customer
      // picks a method and pays. Only fall back to /order/confirmed if Salla
      // didn't return a URL at all.
      if (paymentMethod === "online" && r.checkout_url) {
        window.location.href = r.checkout_url;
        return;
      }
      // True pending-payment with a URL also gets the redirect (covers any
      // future "saved card" or "express checkout" path we might add).
      if (r.is_pending_payment && r.checkout_url) {
        window.location.href = r.checkout_url;
        return;
      }
      const params = new URLSearchParams({
        order_id: r.order_id ?? "",
        ...(r.customer_order_url ? { salla_url: r.customer_order_url } : {}),
        ...(r.is_pending_payment ? { pending_payment: "1" } : {}),
        ...(r.payment_method ? { method: r.payment_method } : {}),
      });
      window.location.href = `/order/confirmed?${params.toString()}`;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const { summary, fields } = parseError(message);
      setError(summary);
      setFieldErrors(fields);
    } finally {
      setBusy(false);
    }
  }

  const field = (
    label: string,
    value: string,
    setter: (v: string) => void,
    extra?: { required?: boolean; hint?: string; readOnly?: boolean; type?: string }
  ) => (
    <label style={{ fontSize: 13 }}>
      {label}
      {extra?.required && <span style={{ color: "#c00" }}> *</span>}
      <input
        type={extra?.type ?? "text"}
        required={extra?.required}
        readOnly={extra?.readOnly}
        value={value}
        onChange={(e) => setter(e.target.value)}
        style={{
          display: "block",
          width: "100%",
          padding: 8,
          marginTop: 4,
          background: extra?.readOnly ? "#f5f5f5" : "white",
        }}
      />
      {extra?.hint && <span style={{ fontSize: 11, color: "#888" }}>{extra.hint}</span>}
    </label>
  );

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 32, marginTop: 20 }}>
      <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2 style={{ marginTop: 0 }}>Shipping address</h2>

        {field("Full name", name, setName, {
          required: true,
          hint: "First and last name — Salla requires both",
        })}
        {field("Phone", phone, setPhone, {
          required: true,
          type: "tel",
          hint: "Include country code, e.g. +966500000000",
        })}

        <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: 8 }}>
          {field("Country", country, (v) => setCountry(v.toUpperCase()), {
            required: true,
            hint: "ISO 2-letter",
          })}
          {field("City", city, setCity, { required: true })}
        </div>

        {field("District / Block", block, setBlock, { required: true, hint: "حي / المنطقة" })}
        {field("Street", street, setStreet, { required: true })}
        {field("Address line", addressLine, setAddressLine, {
          required: true,
          hint: "Building, apartment, floor — وصف البيت",
        })}
        {field("Postal code", postal, setPostal)}

        <div>
          <label style={{ fontSize: 13 }}>
            Geo-coordinates <span style={{ color: "#c00" }}>*</span>
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <input
                type="text"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="Latitude"
                required
                style={{ flex: 1, padding: 8 }}
              />
              <input
                type="text"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                placeholder="Longitude"
                required
                style={{ flex: 1, padding: 8 }}
              />
              <button
                type="button"
                onClick={useMyLocation}
                style={{
                  padding: "8px 12px",
                  border: "1px solid #ccc",
                  background: "white",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                Use my location
              </button>
            </div>
            <span style={{ fontSize: 11, color: "#888" }}>
              Salla requires lat/long for shipping. Click the button or enter manually.
            </span>
          </label>
        </div>

        {loyaltyBalance > 0 && (
          <fieldset
            style={{
              border: "1px solid #eee",
              borderRadius: 6,
              padding: 16,
              margin: 0,
              background: "#fafffb",
            }}
          >
            <legend style={{ fontSize: 14, fontWeight: 600, padding: "0 6px" }}>
              Loyalty points
            </legend>
            <p style={{ margin: "4px 0 12px", fontSize: 13, color: "#444" }}>
              You have <strong>{loyaltyBalance.toLocaleString()}</strong> points
              available. Redeem at a rate of {POINTS_PER_CURRENCY_UNIT} points = 1{" "}
              {cart.currency} off your order.
            </p>
            <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
              Use
              <input
                type="number"
                min={0}
                max={loyaltyBalance}
                step={POINTS_PER_CURRENCY_UNIT}
                value={redeemPoints}
                onChange={(e) =>
                  setRedeemPoints(
                    Math.max(0, Math.min(loyaltyBalance, Math.floor(Number(e.target.value) || 0)))
                  )
                }
                style={{ width: 100, padding: 6 }}
              />
              points
              {redeemPoints > 0 && (
                <span style={{ color: "#0a7", fontWeight: 600 }}>
                  → {Math.floor(redeemPoints / POINTS_PER_CURRENCY_UNIT)} {cart.currency} off
                </span>
              )}
            </label>
            {redeemPoints > 0 && (
              <p style={{ fontSize: 11, color: "#666", margin: "8px 0 0" }}>
                Points are deducted only after your order is successfully placed.
              </p>
            )}
          </fieldset>
        )}

        <fieldset style={{ border: "1px solid #eee", borderRadius: 6, padding: 16, margin: 0 }}>
          <legend style={{ fontSize: 14, fontWeight: 600, padding: "0 6px" }}>Payment method</legend>

          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              padding: 8,
              borderRadius: 4,
              cursor: "pointer",
              background: paymentMethod === "cod" ? "#f5f8ff" : "transparent",
            }}
          >
            <input
              type="radio"
              name="payment_method"
              value="cod"
              checked={paymentMethod === "cod"}
              onChange={() => setPaymentMethod("cod")}
              style={{ marginTop: 3 }}
            />
            <span>
              <strong style={{ fontSize: 14 }}>Cash on delivery</strong>
              <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
                Pay the courier in cash when your order arrives. No card needed now.
              </div>
            </span>
          </label>

          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              padding: 8,
              borderRadius: 4,
              cursor: "pointer",
              background: paymentMethod === "online" ? "#f5f8ff" : "transparent",
            }}
          >
            <input
              type="radio"
              name="payment_method"
              value="online"
              checked={paymentMethod === "online"}
              onChange={() => setPaymentMethod("online")}
              style={{ marginTop: 3 }}
            />
            <span>
              <strong style={{ fontSize: 14 }}>Pay online (Credit card, Mada, Apple Pay, STC Pay)</strong>
              <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
                You&apos;ll be redirected to Salla&apos;s secure payment page. Whatever methods
                this merchant has enabled will be available there.
              </div>
            </span>
          </label>
        </fieldset>

        {error && (
          <div
            style={{
              border: "1px solid #fcc",
              background: "#fff5f5",
              borderRadius: 4,
              padding: 12,
            }}
          >
            <p style={{ color: "#c00", fontSize: 13, margin: 0, fontWeight: 600 }}>{error}</p>
            {fieldErrors && (
              <ul style={{ margin: "8px 0 0 16px", padding: 0, fontSize: 13, color: "#900" }}>
                {Object.entries(fieldErrors).map(([fieldName, msgs]) => (
                  <li key={fieldName}>
                    <strong>{fieldName}:</strong> {msgs.join("; ")}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

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
          {busy ? "Placing order…" : "Place order"}
        </button>
      </form>

      <aside style={{ background: "#fafafa", padding: 20, borderRadius: 6, height: "fit-content" }}>
        <h3 style={{ marginTop: 0, fontSize: 16 }}>Order summary</h3>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: 13 }}>
          {cart.items.map((it) => (
            <li
              key={it.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "6px 0",
                borderBottom: "1px solid #eee",
              }}
            >
              <span>
                {it.name} <span style={{ color: "#888" }}>× {it.qty}</span>
              </span>
              <span>
                {it.line_total.toFixed(2)} {it.currency}
              </span>
            </li>
          ))}
        </ul>
        <div
          style={{
            marginTop: 16,
            display: "flex",
            justifyContent: "space-between",
            fontWeight: 600,
            fontSize: 15,
          }}
        >
          <span>Subtotal</span>
          <span>
            {cart.subtotal.toFixed(2)} {cart.currency}
          </span>
        </div>
        <p style={{ fontSize: 11, color: "#888", marginTop: 12 }}>
          Payment on delivery. Shipping cost is calculated by the merchant&apos;s
          courier after the order is placed.
        </p>
      </aside>
    </div>
  );
}
