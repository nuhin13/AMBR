import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/account/auth-forms";
import { LLink } from "@/components/i18n/llink";
import { Kicker } from "@/components/editorial/kicker";
import { getCurrentUser } from "@/modules/auth/session";
import { getT } from "@/i18n/server";
import { localePath } from "@/i18n/config";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t.meta.register, robots: { index: false } };
}

export default async function RegisterPage(props: PageProps<"/[locale]/register">) {
  const { t, locale } = await getT();
  const sp = await props.searchParams;
  const next = typeof sp.next === "string" ? sp.next : undefined;
  if (await getCurrentUser()) redirect(localePath(locale, "/account"));
  return (
    <>
      <Kicker>{t.auth.join}</Kicker>
      <h1 className="t-h1 mt-5">{t.auth.createTitle}</h1>
      <p className="t-lead mt-4 text-muted">{t.auth.createIntro}</p>
      <div className="mt-12"><RegisterForm next={next} /></div>
      <p className="mt-10 text-[14px] text-muted">
        {t.auth.haveAccount} <LLink href="/login" className="link-underline text-burgundy">{t.auth.signIn}</LLink>
      </p>
    </>
  );
}
