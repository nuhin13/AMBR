import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/admin/ui";

export const metadata = { title: "Not allowed" };

export default function ForbiddenPage() {
  return (
    <div className="max-w-xl">
      <PageHeader title="You don't have access to this section" description="Your staff role doesn't include this area of the admin. Ask the store owner to change your role if you need it." />
      <ButtonLink href="/admin" variant="secondary">Back to dashboard</ButtonLink>
    </div>
  );
}
