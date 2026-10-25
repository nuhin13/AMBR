import { db } from "@/lib/db";
import { requireUser } from "@/modules/auth/session";
import { getCheckoutGeography } from "@/modules/shipping/service";
import { AddressBook } from "@/components/account/address-book";
import { toLocalPhone } from "@/lib/phone";
import { getT } from "@/i18n/server";

export default async function AddressesPage() {
  const user = await requireUser("/account/addresses");
  const { locale } = await getT();
  const name = (n: { name: string; nameBn: string | null }) => (locale === "bn" && n.nameBn ? n.nameBn : n.name);
  const [addresses, geo] = await Promise.all([
    db.address.findMany({ where: { userId: user.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }], include: { district: true, upazila: true } }),
    getCheckoutGeography(locale),
  ]);
  return (
    <AddressBook
      districts={geo.districts.map((d) => ({ id: d.id, name: name(d), upazilas: d.upazilas.map((u) => ({ id: u.id, name: name(u) })) })).sort((a, b) => a.name.localeCompare(b.name))}
      addresses={addresses.map((a) => ({
        id: a.id,
        label: a.label,
        recipientName: a.recipientName,
        phone: toLocalPhone(a.phone),
        districtId: a.districtId,
        upazilaId: a.upazilaId ?? 0,
        line: a.line,
        isDefault: a.isDefault,
        summary: [a.line, a.upazila ? name(a.upazila) : null, name(a.district)].filter(Boolean).join(", "),
      }))}
    />
  );
}
