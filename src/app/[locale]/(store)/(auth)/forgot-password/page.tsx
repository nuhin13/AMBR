import type { Metadata } from "next";
import { ForgotForm } from "@/components/account/auth-forms";
import { LLink } from "@/components/i18n/llink";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t.auth.forgotTitle, robots: { index: false } };
}

export default async function ForgotPage() {
  const { t } = await getT();
  return (
    <>
      <h1 className="t-h1">{t.auth.forgotTitle}</h1>
      <p className="t-lead mt-4 text-muted">{t.auth.forgotIntro}</p>
      <div className="mt-12"><ForgotForm /></div>
      <p className="mt-10 text-[14px]"><LLink href="/login" className="link-underline text-burgundy">{t.auth.backToSignIn}</LLink></p>
    </>
  );
}
