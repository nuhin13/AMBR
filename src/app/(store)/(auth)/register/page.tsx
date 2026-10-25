import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/account/auth-forms";
import { getCurrentUser } from "@/modules/auth/session";

export const metadata: Metadata = { title: "Create account", robots: { index: false } };

export default async function RegisterPage(props: PageProps<"/register">) {
  const sp = await props.searchParams;
  const next = typeof sp.next === "string" ? sp.next : undefined;
  if (await getCurrentUser()) redirect("/account");
  return (
    <>
      <p className="eyebrow text-center text-burgundy/80">Join AMBR</p>
      <h1 className="mt-3 text-center text-[38px]">Create account</h1>
      <p className="mt-3 text-center text-[14px] text-muted">Track orders, save addresses and keep a wishlist.</p>
      <div className="mt-10"><RegisterForm next={next} /></div>
      <p className="mt-8 text-center text-[14px] text-muted">
        Already have an account? <Link href="/login" className="text-burgundy underline underline-offset-4">Sign in</Link>
      </p>
    </>
  );
}
