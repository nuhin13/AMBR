import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { TrackOrderForm } from "@/components/checkout/track-order-form";

export const metadata: Metadata = { title: "Track Your Order", description: "Track your AMBR order with your order number and phone number.", alternates: { canonical: "/track-order" } };

export default function TrackOrderPage() {
  return (
    <>
      <PageHeader crumbs={[{ label: "Track order" }]} eyebrow="Orders" title="Track your order" description="Enter the order number from your confirmation and the phone number you used at checkout." />
      <div className="container-x max-w-lg py-12 md:py-16">
        <TrackOrderForm />
      </div>
    </>
  );
}
