import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/account/auth-forms";
import { getCurrentUser } from "@/modules/auth/session";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function LoginPage(props: PageProps<"/login">) {
  const sp = await props.searchParams;
  const next = typeof sp.next === "string" ? sp.next : undefined;
  if (await getCurrentUser()) redirect(next?.startsWith("/") ? next : "/account");
  return (
    <>
      <p className="eyebrow text-center text-burgundy/80">Welcome back</p>
      <h1 className="mt-3 text-center text-[38px]">Sign in</h1>
      <div className="mt-10"><LoginForm next={next} /></div>
      <p className="mt-8 text-center text-[14px] text-muted">
        New to AMBR? <Link href={`/register${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="text-burgundy underline underline-offset-4">Create an account</Link>
      </p>
      <p className="mt-2 text-center text-[13px] text-muted">You can also check out as a guest — no account needed.</p>
    </>
  );
}
