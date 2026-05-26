import { redirect } from "next/navigation";
import { api } from "@/lib/api";
import Header from "../Header";
import CartLines from "./CartLines";

export const dynamic = "force-dynamic";

export default async function CartPage() {
  const me = await api.me().catch(() => ({ customer: null }));
  if (!me.customer) {
    redirect("/login?next=/cart");
  }

  let cart: Awaited<ReturnType<typeof api.getCart>>["cart"] | null = null;
  let apiError: string | null = null;
  try {
    const r = await api.getCart();
    cart = r.cart;
  } catch (e) {
    apiError = e instanceof Error ? e.message : String(e);
  }

  return (
    <main style={{ maxWidth: 900, margin: "0 auto" }}>
      <Header />
      <h1>Your cart</h1>

      {apiError && (
        <p style={{ color: "#c00" }}>
          Could not load cart: <code>{apiError}</code>
        </p>
      )}

      {cart && cart.items.length === 0 ? (
        <p style={{ color: "#666" }}>
          Your cart is empty. <a href="/">Continue shopping →</a>
        </p>
      ) : cart ? (
        <CartLines cart={cart} />
      ) : null}
    </main>
  );
}
