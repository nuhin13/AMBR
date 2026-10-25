import type { Metadata } from "next";
import { requireUser } from "@/modules/auth/session";
import { AccountNav } from "@/components/account/account-nav";
import { Kicker } from "@/components/editorial/kicker";
import { logoutAction } from "@/modules/auth/actions";
import { getT } from "@/i18n/server";
import { fmt } from "@/i18n/config";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t.meta.account, robots: { index: false } };
}

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/account");
  const { t } = await getT();
  return (
    <div className="container-wide pb-24 pt-10 md:pt-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Kicker>{t.account.kicker}</Kicker>
          <h1 className="t-h1 mt-5">{fmt(t.account.hello, { name: user.name.split(" ")[0] })}</h1>
        </div>
        <form action={logoutAction}>
          <button className="btn-text link-quiet text-[11px] text-burgundy">{t.account.signOut}</button>
        </form>
      </div>
      <div className="mt-12 grid gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-3"><AccountNav /></div>
        <div className="min-w-0 lg:col-span-9">{children}</div>
      </div>
    </div>
  );
}
