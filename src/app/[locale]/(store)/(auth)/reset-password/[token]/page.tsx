import type { Metadata } from "next";
import { ResetForm } from "@/components/account/auth-forms";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t.auth.resetTitle, robots: { index: false } };
}

export default async function ResetPage(props: PageProps<"/[locale]/reset-password/[token]">) {
  const { t } = await getT();
  const { token } = await props.params;
  return (
    <>
      <h1 className="t-h1">{t.auth.resetTitle}</h1>
      <div className="mt-12"><ResetForm token={token} /></div>
    </>
  );
}
