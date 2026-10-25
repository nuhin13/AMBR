import { db } from "@/lib/db";
import { requireUser } from "@/modules/auth/session";
import { toLocalPhone } from "@/lib/phone";
import { ProfileForms } from "@/components/account/profile-forms";

export default async function ProfilePage() {
  const me = await requireUser("/account/profile");
  const user = await db.user.findUniqueOrThrow({ where: { id: me.id }, include: { profile: true } });
  return <ProfileForms name={user.name} email={user.email ?? ""} phone={user.phone ? toLocalPhone(user.phone) : ""} marketingOptIn={user.profile?.marketingOptIn ?? false} />;
}
