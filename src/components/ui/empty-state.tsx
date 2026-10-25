import type { ReactNode } from "react";

export function EmptyState({ title, description, action }: { title: string; description?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <span className="mb-6 block h-px w-16 bg-gold" aria-hidden />
      <h3 className="text-2xl">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-muted">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
