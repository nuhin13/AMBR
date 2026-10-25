import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/account/auth-forms";
import { LLink } from "@/components/i18n/llink";
import { Kicker } from "@/components/editorial/kicker";
import { getCurrentUser } from "@/modules/auth/session";
import { getT } from "@/i18n/server";
import { localePath } from "@/i18n/config";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t.meta.signIn, robots: { index: false } };
}

export default async function LoginPage(props: PageProps<"/[locale]/login">) {
  const { t, locale } = await getT();
  const sp = await props.searchParams;
  const next = typeof sp.next === "string" ? sp.next : undefined;
  if (await getCurrentUser()) redirect(next?.startsWith("/") ? next : localePath(locale, "/account"));
  return (
    <>
      <Kicker>{t.auth.welcomeBack}</Kicker>
      <h1 className="t-h1 mt-5">{t.auth.signIn}</h1>
      <div className="mt-12"><LoginForm next={next} /></div>
      <p className="mt-10 text-[14px] text-muted">
        {t.auth.newHere} <LLink href={`/register${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="link-underline text-burgundy">{t.auth.createAccount}</LLink>
      </p>
      <p className="mt-2 text-[13px] text-muted">{t.auth.guestHint}</p>
    </>
  );
}
