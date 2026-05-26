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
      />
    </main>
  );
}
