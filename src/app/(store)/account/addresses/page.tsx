import { db } from "@/lib/db";
import { requireUser } from "@/modules/auth/session";
import { getCheckoutGeography } from "@/modules/shipping/service";
import { AddressBook } from "@/components/account/address-book";
import { toLocalPhone } from "@/lib/phone";

export default async function AddressesPage() {
  const user = await requireUser("/account/addresses");
  const [addresses, geo] = await Promise.all([
    db.address.findMany({ where: { userId: user.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }], include: { district: true, upazila: true } }),
    getCheckoutGeography(),
  ]);
  return (
    <AddressBook
      districts={geo.districts.map((d) => ({ id: d.id, name: d.name, upazilas: d.upazilas.map((u) => ({ id: u.id, name: u.name })) }))}
      addresses={addresses.map((a) => ({
        id: a.id,
        label: a.label,
        recipientName: a.recipientName,
        phone: toLocalPhone(a.phone),
        districtId: a.districtId,
        upazilaId: a.upazilaId ?? 0,
        line: a.line,
        isDefault: a.isDefault,
        summary: [a.line, a.upazila?.name, a.district.name].filter(Boolean).join(", "),
      }))}
    />
  );
}
