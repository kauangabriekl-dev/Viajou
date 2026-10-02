import type { ReactNode } from "react";

export function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-12 sm:py-16">
      <div className="space-y-6 rounded-[2rem] bg-white p-6 ring-1 ring-linha sm:p-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
          <p className="text-tinta-soft">{description}</p>
        </div>
        {children}
      </div>
    </div>
  );
}
