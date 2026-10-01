import Image from "next/image";
import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { complaintCategoryLabels, complaintStatusLabels } from "@/lib/labels";
import { photoUrl } from "@/lib/storage";
import type { Complaint, ComplaintStatus } from "@/types/database";
import { formatRelativeDate } from "@/utils/format";

const statusStyle: Record<ComplaintStatus, string> = {
  pending: "bg-agua/20 text-tinta",
  answered: "bg-petroleo-100 text-petroleo",
  resolved: "bg-restinga/15 text-restinga",
  closed: "bg-linha text-tinta-soft",
};

export function ComplaintCard({
  complaint,
  showPlace,
  children,
}: {
  complaint: Complaint;
  showPlace?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <article className="space-y-3 rounded-[var(--radius-card)] bg-white p-5 ring-1 ring-linha">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className={`rounded-full px-2.5 py-1 font-bold ${statusStyle[complaint.status]}`}>
          {complaintStatusLabels[complaint.status]}
        </span>
        <span className="rounded-full bg-espuma px-2.5 py-1 font-semibold text-tinta-soft">
          {complaintCategoryLabels[complaint.category]}
        </span>
        <time dateTime={complaint.created_at} className="text-tinta-soft">
          {formatRelativeDate(complaint.created_at)}
        </time>
      </div>
      {showPlace && complaint.place && (
        <Link
          href={`/lugares/${complaint.place.slug}?aba=reclamacoes`}
          className="text-sm font-bold text-petroleo hover:underline"
        >
          {complaint.place.name}
        </Link>
      )}
      <h3 className="text-lg font-extrabold">{complaint.title}</h3>
      <p className="whitespace-pre-line text-tinta">{complaint.description}</p>
      <p className="text-xs text-tinta-soft">
        Por{" "}
        <Link
          href={`/perfil/${complaint.author.username}`}
          className="font-semibold hover:underline"
        >
          @{complaint.author.username}
        </Link>
      </p>
      {complaint.photos.length > 0 && (
        <ul className="relative flex gap-2 overflow-x-auto">
          {complaint.photos.map((p) => (
            <li key={p.id}>
              <Image
                src={photoUrl(p.storage_path)}
                alt="Foto anexada à reclamação"
                width={96}
                height={96}
                className="h-24 w-24 rounded-xl object-cover"
              />
            </li>
          ))}
        </ul>
      )}
      {complaint.responses.map((r) => (
        <div key={r.id} className="space-y-1 rounded-2xl bg-petroleo-100/60 p-4">
          <p className="flex items-center gap-1.5 text-sm font-bold text-petroleo">
            <BadgeCheck aria-hidden="true" className="h-4 w-4" />
            Resposta de {r.business?.name ?? "estabelecimento"}
          </p>
          <p className="text-sm whitespace-pre-line">{r.body}</p>
          <time dateTime={r.created_at} className="text-xs text-tinta-soft">
            {formatRelativeDate(r.created_at)}
          </time>
        </div>
      ))}
      {children}
    </article>
  );
}
