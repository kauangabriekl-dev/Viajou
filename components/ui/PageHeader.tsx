import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 pt-10 pb-8 sm:pt-14">
      <div className="max-w-2xl space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
        {description && <p className="text-lg text-tinta-soft">{description}</p>}
      </div>
      {actions}
    </div>
  );
}
