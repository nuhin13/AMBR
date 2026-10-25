import { db } from "@/lib/db";
import { requirePermission } from "@/modules/auth/rbac";
import { getSettings } from "@/modules/content/settings";
import { removeDemoDataAction } from "@/modules/catalog/admin-actions";
import { PageHeader, Card } from "@/components/admin/ui";
import { SettingsForm } from "@/components/admin/settings-forms";
import { ActionButton } from "@/components/admin/action-form";
import { Input, Textarea } from "@/components/ui/field";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  await requirePermission("settings:manage");
  const [{ store, social, seo, checkout }, demoProducts, demoOrders] = await Promise.all([getSettings(), db.product.count({ where: { isDemo: true } }), db.order.count({ where: { isDemo: true } })]);
  return (
    <>
      <PageHeader title="Settings" description="Store details shown in the footer, contact page, invoices and emails. Empty fields are simply hidden on the site." />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Store & contact">
          <SettingsForm group="store">
            <div className="grid gap-4 md:grid-cols-2">
              <Input name="name" label="Store name" defaultValue={store.name} />
              <Input name="tagline" label="Tagline" defaultValue={store.tagline} />
            </div>
            <Textarea name="description" label="Short description (footer)" rows={3} defaultValue={store.description} />
            <div className="grid gap-4 md:grid-cols-2">
              <Input name="phone" label="Support phone" defaultValue={store.phone} placeholder="01XXXXXXXXX" />
              <Input name="whatsapp" label="WhatsApp number" defaultValue={store.whatsapp} placeholder="01XXXXXXXXX" hint="Enables the WhatsApp button." />
              <Input name="email" label="Support email" type="email" defaultValue={store.email} hint="Also receives contact-form messages." />
              <Input name="hours" label="Support hours" defaultValue={store.hours} placeholder="Sat–Thu, 10am–8pm" />
            </div>
            <Textarea name="address" label="Business address" rows={2} defaultValue={store.address} />
            <div className="grid gap-4 md:grid-cols-2">
              <Input name="legalName" label="Legal business name" defaultValue={store.legalName} />
              <Input name="tradeLicense" label="Trade licence number" defaultValue={store.tradeLicense} />
            </div>
          </SettingsForm>
        </Card>
        <div className="space-y-6">
          <Card title="Social links">
            <SettingsForm group="social">
              <Input name="facebook" label="Facebook page URL" defaultValue={social.facebook} placeholder="https://facebook.com/…" />
              <Input name="instagram" label="Instagram URL" defaultValue={social.instagram} placeholder="https://instagram.com/…" />
            </SettingsForm>
          </Card>
          <Card title="Search engine defaults">
            <SettingsForm group="seo">
              <Input name="defaultTitle" label="Homepage title" defaultValue={seo.defaultTitle} maxLength={70} />
              <Textarea name="defaultDescription" label="Homepage description" rows={3} defaultValue={seo.defaultDescription} maxLength={170} />
            </SettingsForm>
          </Card>
          <Card title="Checkout">
            <SettingsForm group="checkout">
              <Input name="maxQtyPerItem" type="number" min={1} max={20} label="Maximum quantity per item" defaultValue={checkout.maxQtyPerItem} />
              <Textarea name="orderNote" label="Note shown at checkout (optional)" rows={2} defaultValue={checkout.orderNote} />
            </SettingsForm>
          </Card>
          <Card title="Demo data">
            <p className="mb-3 text-[13.5px] text-muted">
              {demoProducts + demoOrders === 0 ? "No demo data remains." : `${demoProducts} demo products and ${demoOrders} demo orders are in the store. Remove them before launch. Products with real orders are archived instead of deleted.`}
            </p>
            {demoProducts + demoOrders > 0 && (
              <ActionButton action={removeDemoDataAction} variant="danger" confirm="Remove all demo products, demo orders, empty collections and the DEMO10 coupon? This can't be undone.">Remove all demo data</ActionButton>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
