import { redirect } from "next/navigation";
import { api } from "@/lib/api";
import Header from "../Header";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const me = await api.me().catch(() => ({ customer: null }));
  if (!me.customer) redirect("/login?next=/account");

  let loyalty: Awaited<ReturnType<typeof api.getLoyaltyPoints>> | null = null;
  let loyaltyError: string | null = null;
  try {
    loyalty = await api.getLoyaltyPoints();
  } catch (e) {
    loyaltyError = e instanceof Error ? e.message : String(e);
  }

  return (
    <main style={{ maxWidth: 720, margin: "0 auto" }}>
      <Header />
      <h1>My account</h1>

      <section style={{ background: "#fafafa", padding: 20, borderRadius: 6, marginBottom: 20 }}>
        <h2 style={{ marginTop: 0, fontSize: 16 }}>Profile</h2>
        <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 8, fontSize: 14 }}>
          <span style={{ color: "#666" }}>Name</span>
          <span>{me.customer.name ?? "—"}</span>
          <span style={{ color: "#666" }}>Email</span>
          <span>{me.customer.email}</span>
          <span style={{ color: "#666" }}>Phone</span>
          <span>{me.customer.phone ?? "—"}</span>
        </div>
      </section>

      <section style={{ background: "#fafafa", padding: 20, borderRadius: 6 }}>
        <h2 style={{ marginTop: 0, fontSize: 16 }}>Loyalty points</h2>
        {loyaltyError ? (
          <p style={{ color: "#c00", fontSize: 13 }}>{loyaltyError}</p>
        ) : loyalty ? (
          loyalty.balance === 0 && loyalty.entries.length === 0 ? (
            <p style={{ color: "#666", fontSize: 13 }}>
              You don&apos;t have any loyalty points yet. Earn points on every order — they&apos;ll
              show up here, redeemable during checkout.
            </p>
          ) : (
            <>
              <p style={{ fontSize: 28, fontWeight: 700, margin: "8px 0" }}>
                {loyalty.balance.toLocaleString()}{" "}
                <span style={{ fontSize: 14, fontWeight: 400, color: "#666" }}>
                  available points
                </span>
              </p>
              {loyalty.used_total > 0 && (
                <p style={{ fontSize: 12, color: "#888" }}>
                  Used so far: {loyalty.used_total.toLocaleString()} points
                </p>
              )}
              {loyalty.locally_redeemed > 0 && (
                <p style={{ fontSize: 12, color: "#888" }}>
                  Redeemed in-app: {loyalty.locally_redeemed.toLocaleString()} points
                </p>
              )}
              {loyalty.entries.length > 0 && (
                <details style={{ marginTop: 16 }}>
                  <summary style={{ cursor: "pointer", fontSize: 13 }}>Points history</summary>
                  <table style={{ width: "100%", marginTop: 10, fontSize: 13, borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #ddd", color: "#666" }}>
                        <th style={{ textAlign: "left", padding: "6px 4px" }}>Source</th>
                        <th style={{ textAlign: "right", padding: "6px 4px" }}>+Points</th>
                        <th style={{ textAlign: "right", padding: "6px 4px" }}>Used</th>
                        <th style={{ textAlign: "left", padding: "6px 4px" }}>Expires</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loyalty.entries.map((e, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid #f0f0f0" }}>
                          <td style={{ padding: "6px 4px" }}>{e.name}</td>
                          <td style={{ padding: "6px 4px", textAlign: "right" }}>{e.points}</td>
                          <td style={{ padding: "6px 4px", textAlign: "right" }}>{e.used_points}</td>
                          <td style={{ padding: "6px 4px", fontSize: 12, color: "#666" }}>
                            {e.expiry_date ?? "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </details>
              )}
            </>
          )
        ) : null}
      </section>
    </main>
  );
}
