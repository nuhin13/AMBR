"use client";

/** Thin wrappers over GA4 (gtag) and Meta Pixel (fbq). No-ops when the scripts aren't configured. */
type Item = { id: string; name: string; variant?: string; price: number; quantity?: number };

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

const taka = (p: number) => p / 100;

export function trackViewItem(item: Item) {
  window.gtag?.("event", "view_item", { currency: "BDT", value: taka(item.price), items: [{ item_id: item.id, item_name: item.name, item_variant: item.variant, price: taka(item.price) }] });
  window.fbq?.("track", "ViewContent", { content_ids: [item.id], content_name: item.name, content_type: "product", value: taka(item.price), currency: "BDT" });
}

export function trackAddToCart(item: Item) {
  const q = item.quantity ?? 1;
  window.gtag?.("event", "add_to_cart", { currency: "BDT", value: taka(item.price * q), items: [{ item_id: item.id, item_name: item.name, item_variant: item.variant, price: taka(item.price), quantity: q }] });
  window.fbq?.("track", "AddToCart", { content_ids: [item.id], content_name: item.name, content_type: "product", value: taka(item.price * q), currency: "BDT" });
}

export function trackBeginCheckout(value: number, count: number) {
  window.gtag?.("event", "begin_checkout", { currency: "BDT", value: taka(value) });
  window.fbq?.("track", "InitiateCheckout", { value: taka(value), currency: "BDT", num_items: count });
}

/** Browser-side purchase; event_id matches the server CAPI event so Meta de-duplicates. */
export function trackPurchase(orderNumber: string, value: number, items: Item[]) {
  window.gtag?.("event", "purchase", {
    transaction_id: orderNumber,
    currency: "BDT",
    value: taka(value),
    items: items.map((i) => ({ item_id: i.id, item_name: i.name, item_variant: i.variant, price: taka(i.price), quantity: i.quantity })),
  });
  window.fbq?.("track", "Purchase", { value: taka(value), currency: "BDT", content_type: "product", content_ids: items.map((i) => i.id) }, { eventID: orderNumber });
}

export function trackSearch(term: string) {
  window.gtag?.("event", "search", { search_term: term });
  window.fbq?.("track", "Search", { search_string: term });
}
