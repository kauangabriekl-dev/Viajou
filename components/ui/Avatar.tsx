import Image from "next/image";
import { initials } from "@/utils/format";

type AvatarProps = {
  name: string;
  src?: string | null;
  size?: "sm" | "md" | "lg";
};

const sizes = { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-20 w-20 text-xl" };
const pixels = { sm: 32, md: 40, lg: 80 };

export function Avatar({ name, src, size = "md" }: AvatarProps) {
  if (src) {
    return (
      <Image
        src={src}
        alt={`Foto de ${name}`}
        width={pixels[size]}
        height={pixels[size]}
        className={`${sizes[size]} shrink-0 rounded-full object-cover`}
      />
    );
  }
  return (
    <span
      className={`${sizes[size]} inline-flex shrink-0 items-center justify-center rounded-full bg-atlantico-100 font-bold text-atlantico`}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}
