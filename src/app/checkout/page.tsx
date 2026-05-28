import { redirect } from "next/navigation";
import { api } from "@/lib/api";
import Header from "../Header";
import CheckoutForm from "./CheckoutForm";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const me = await api.me().catch(() => ({ customer: null }));
  if (!me.customer) redirect("/login?next=/checkout");

  let cart: Awaited<ReturnType<typeof api.getCart>>["cart"] | null = null;
  try {
    cart = (await api.getCart()).cart;
  } catch {}

  if (!cart || cart.items.length === 0) {
    redirect("/cart");
  }

  // Best-effort: load loyalty balance so we can offer redemption. Failure is
  // non-fatal — checkout still works without showing the loyalty section.
  let loyaltyBalance = 0;
  try {
    const r = await api.getLoyaltyPoints();
    loyaltyBalance = r.balance;
  } catch {}

  return (
    <main style={{ maxWidth: 720, margin: "0 auto" }}>
      <Header />
      <h1>Checkout</h1>
      <p style={{ color: "#666", fontSize: 13 }}>
        We&apos;ll redirect you to Salla&apos;s secure payment page to complete your order.
      </p>
      <CheckoutForm
        cart={cart}
        customerName={me.customer.name ?? ""}
        customerPhone={me.customer.phone ?? ""}
        loyaltyBalance={loyaltyBalance}
      />
    </main>
  );
}
