import type { Metadata } from "next";
import { requireUser } from "@/modules/auth/session";
import { AccountNav } from "@/components/account/account-nav";
import { logoutAction } from "@/modules/auth/actions";

export const metadata: Metadata = { title: "My account", robots: { index: false } };

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/account");
  return (
    <div className="container-x py-10 md:py-14">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-beige pb-6">
        <div>
          <p className="eyebrow text-burgundy/80">My account</p>
          <h1 className="mt-2 text-[32px] md:text-[42px]">Hello, {user.name.split(" ")[0]}</h1>
        </div>
        <form action={logoutAction}>
          <button className="text-[12px] font-semibold uppercase tracking-[0.14em] text-burgundy underline underline-offset-4">Sign out</button>
        </form>
      </div>
      <div className="grid gap-8 lg:grid-cols-[220px_1fr] lg:gap-14">
        <AccountNav />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
