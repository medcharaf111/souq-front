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
  const [name, setName] = useState(customerName);
  const [phone, setPhone] = useState(customerPhone);
  const [country, setCountry] = useState("SA");
  const [city, setCity] = useState("");
  const [block, setBlock] = useState("");
  const [street, setStreet] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [postal, setPostal] = useState("");
  const [lat, setLat] = useState<string>("");
  const [lng, setLng] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
      const target = r.checkout_url ?? r.customer_order_url;
      if (target) {
        window.location.href = target;
        return;
      }
      setError("Order placed but no checkout URL returned. Check /account.");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
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
