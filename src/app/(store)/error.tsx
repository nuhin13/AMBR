"use client";

import { Button, ButtonLink } from "@/components/ui/button";

export default function StoreError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="container-x flex flex-col items-center py-24 text-center">
      <h1 className="text-[36px]">Something went wrong</h1>
      <p className="mt-4 max-w-md text-muted">Sorry — we couldn&apos;t load this page. Please try again in a moment.</p>
      <div className="mt-8 flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <ButtonLink href="/" variant="secondary">Home</ButtonLink>
      </div>
    </div>
  );
}
