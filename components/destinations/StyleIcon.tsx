import {
  Building,
  Droplets,
  Footprints,
  Landmark,
  Mountain,
  Snowflake,
  Tent,
  TreePalm,
  Trees,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import type { DestinationStyle } from "@/types/database";

const ICONS: Record<DestinationStyle, LucideIcon> = {
  praia: TreePalm,
  frio: Snowflake,
  montanha: Mountain,
  trilha: Footprints,
  floresta: Trees,
  cachoeira: Droplets,
  cidade: Building,
  historico: Landmark,
  gastronomia: Utensils,
  aventura: Tent,
};

/** Ícone do estilo de destino (sempre decorativo: o nome vem escrito ao lado). */
export function StyleIcon({
  style,
  className = "h-4 w-4",
}: {
  style: DestinationStyle;
  className?: string;
}) {
  const Icon = ICONS[style];
  return <Icon aria-hidden="true" className={className} />;
}
