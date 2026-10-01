import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { cartSummary, getCart } from "@/lib/cart";
import { getSettings } from "@/lib/settings";
import { CheckoutForm } from "./checkout-form";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage() {
  const user = await requireUser("/checkout");
  const [cart, settings, addresses, rates] = await Promise.all([
    getCart(),
    getSettings(),
    db.address.findMany({ where: { userId: user.id }, orderBy: [{ isDefault: "desc" }, { id: "asc" }] }),
    db.shippingRate.findMany({ select: { region: true, cost: true } }),
  ]);
  const { items, subtotal } = cartSummary(cart);
  if (items.length === 0) redirect("/keranjang");

  return (
    <div className="container-page py-8">
      <h1 className="mb-6 text-2xl font-bold text-brand-900">Checkout</h1>
      <CheckoutForm
        addresses={addresses}
        defaults={{ name: user.name, phone: user.phone ?? "" }}
        subtotal={subtotal}
        shipping={{ rates, flatShippingCost: settings.flatShippingCost, freeShippingMin: settings.freeShippingMin }}
        codEnabled={settings.codEnabled}
        items={items.map((i) => ({
          id: i.id,
          name: i.product.name,
          quantity: i.quantity,
          total: i.product.price * i.quantity,
        }))}
      />
    </div>
  );
}
