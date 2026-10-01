import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

type SectionHeadingProps = {
  id: string;
  /** Parte em peso fino, antes do destaque ("Destinos que"). */
  lead?: string;
  /** Destaque em negrito ("estão bombando"). */
  title: string;
  eyebrow?: string;
  description?: string;
  href?: string;
  linkLabel?: string;
  badge?: ReactNode;
  as?: "h2" | "h3";
};

/** Título de seção no estilo da marca: peso fino + negrito, com linha de trajeto opcional. */
export function SectionHeading({
  id,
  lead,
  title,
  eyebrow,
  description,
  href,
  linkLabel,
  badge,
  as: Tag = "h2",
}: SectionHeadingProps) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="space-y-2">
        {badge}
        {eyebrow && (
          <p className="text-xs font-semibold tracking-[0.18em] text-agua-700 uppercase">
            {eyebrow}
          </p>
        )}
        <Tag id={id} className="text-3xl leading-tight tracking-tight text-petroleo sm:text-4xl">
          {lead && <span className="font-light">{lead} </span>}
          <span className="font-bold">{title}</span>
        </Tag>
        {description && <p className="max-w-prose font-light text-tinta-soft">{description}</p>}
      </div>
      {href && linkLabel && (
        <Link
          href={href}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-petroleo/30 px-5 text-sm font-semibold text-petroleo hover:border-petroleo hover:bg-petroleo hover:text-white"
        >
          {linkLabel}
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
