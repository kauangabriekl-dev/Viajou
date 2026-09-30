import Link from "next/link";
import type { ReactNode } from "react";

type SectionHeadingProps = {
  id: string;
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
  badge?: ReactNode;
  as?: "h2" | "h3";
};

export function SectionHeading({
  id,
  title,
  description,
  href,
  linkLabel,
  badge,
  as: Tag = "h2",
}: SectionHeadingProps) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="space-y-2">
        {badge}
        <Tag id={id} className="text-2xl font-extrabold tracking-tight text-tinta sm:text-3xl">
          {title}
        </Tag>
        {description && <p className="max-w-prose text-tinta-soft">{description}</p>}
      </div>
      {href && linkLabel && (
        <Link href={href} className="text-sm font-semibold text-atlantico hover:underline">
          {linkLabel}
        </Link>
      )}
    </div>
  );
}
