import type { Metadata } from "next";
import { ResetForm } from "@/components/account/auth-forms";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } };

export default async function ResetPage(props: PageProps<"/reset-password/[token]">) {
  const { token } = await props.params;
  return (
    <>
      <h1 className="text-center text-[36px]">Choose a new password</h1>
      <div className="mt-10"><ResetForm token={token} /></div>
    </>
  );
}
