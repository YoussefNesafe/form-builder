import * as LucideIcons from "lucide-react";
import type { LucideProps } from "lucide-react";
import type { FieldType } from "@/form-builder";
import { FIELD_META } from "../model/fieldMeta";

type IconComponent = React.ComponentType<LucideProps>;

/** Resolve a field type's lucide icon, falling back to a neutral square. */
export function FieldIcon({ type, ...props }: { type: FieldType } & LucideProps) {
  const name = FIELD_META[type].icon as keyof typeof LucideIcons;
  const Icon = (LucideIcons[name] as IconComponent) ?? LucideIcons.Square;
  return <Icon {...props} />;
}
