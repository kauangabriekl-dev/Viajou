import type { PhotoCredit as Credit } from "@/lib/photos";

type PhotoCreditProps = { credit: Credit; className?: string };

/** Crédito exigido pela licença livre: autor, licença e link para a foto original. */
export function PhotoCredit({ credit, className = "" }: PhotoCreditProps) {
  return (
    <p className={`text-[10px] leading-tight ${className}`}>
      Foto:{" "}
      <a href={credit.source} target="_blank" rel="noopener noreferrer" className="underline">
        {credit.author}
      </a>
      ,{" "}
      <a href={credit.licenseUrl} target="_blank" rel="noopener noreferrer" className="underline">
        {credit.license}
      </a>
    </p>
  );
}
