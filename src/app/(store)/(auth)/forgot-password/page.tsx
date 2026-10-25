import type { Metadata } from "next";
import Link from "next/link";
import { ForgotForm } from "@/components/account/auth-forms";

export const metadata: Metadata = { title: "Forgot password", robots: { index: false } };

export default function ForgotPage() {
  return (
    <>
      <h1 className="text-center text-[36px]">Forgot your password?</h1>
      <p className="mt-3 text-center text-[14px] text-muted">Enter your account email and we&apos;ll send you a link to choose a new one.</p>
      <div className="mt-10"><ForgotForm /></div>
      <p className="mt-8 text-center text-[14px]"><Link href="/login" className="text-burgundy underline underline-offset-4">Back to sign in</Link></p>
    </>
  );
}
