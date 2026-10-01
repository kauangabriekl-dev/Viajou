import Link from "next/link";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: { href: string; label: string };
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-[var(--radius-card)] border border-dashed border-linha bg-white px-6 py-10 text-center">
      <p className="font-bold text-tinta">{title}</p>
      {description && (
        <p className="mx-auto mt-1 max-w-prose text-sm text-tinta-soft">{description}</p>
      )}
      {action && (
        <Link
          href={action.href}
          className="mt-4 inline-flex rounded-full bg-petroleo px-5 py-2.5 text-sm font-bold text-white hover:bg-petroleo-900"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
