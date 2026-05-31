import { api } from "@/lib/api";

export default async function Header() {
  // Both calls go through the user's browser session via the request cookies
  // when this component renders on the server.
  let customerName: string | null = null;
  let cartCount = 0;
  try {
    const me = await api.me();
    customerName = me.customer?.name ?? me.customer?.email ?? null;
    if (me.customer) {
      const c = await api.getCart();
      cartCount = c.cart.item_count;
    }
  } catch {
    // Header is best-effort. Render the logged-out state if anything errors.
  }

  return (
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24,
        paddingBottom: 12,
        borderBottom: "1px solid #eee",
      }}
    >
      <a href="/" style={{ textDecoration: "none", color: "inherit" }}>
        <h1 style={{ margin: 0, fontSize: 22 }}>Shop</h1>
      </a>
      <nav style={{ fontSize: 14, display: "flex", gap: 16, alignItems: "center" }}>
        <a href="/cart" style={{ textDecoration: "none", color: "inherit" }}>
          Cart{cartCount > 0 && <span style={{ marginLeft: 4, color: "#c00", fontWeight: 600 }}>({cartCount})</span>}
        </a>
        {customerName ? (
          <>
            <a href="/account" style={{ textDecoration: "none", color: "#666", fontSize: 13 }}>
              {customerName}
            </a>
            <a href="/logout" style={{ textDecoration: "none", color: "inherit" }}>
              Sign out
            </a>
          </>
        ) : (
          <a href="/login" style={{ textDecoration: "none", color: "inherit" }}>Sign in</a>
        )}
      </nav>
    </header>
  );
}
