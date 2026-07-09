import {
  AlignLeft,
  Asterisk,
  Boxes,
  Calendar,
  ChevronsUpDown,
  CircleDot,
  Clock,
  Columns3,
  EyeOff,
  Globe,
  Hash,
  Heading,
  KeyRound,
  Mail,
  Paperclip,
  PenLine,
  Phone,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Square,
  SquareCheck,
  Star,
  ToggleRight,
  Type,
  type LucideIcon,
  type LucideProps,
} from "lucide-react";
import type { FieldType } from "@/form-builder";
import { FIELD_META } from "../model/fieldMeta";

// Explicit map (not a barrel import) so only these icons ship to the client.
const ICONS: Record<string, LucideIcon> = {
  Type,
  Mail,
  AlignLeft,
  KeyRound,
  Asterisk,
  Hash,
  ChevronsUpDown,
  CircleDot,
  Columns3,
  SquareCheck,
  ToggleRight,
  Globe,
  Calendar,
  Clock,
  ShieldCheck,
  Phone,
  Star,
  SlidersHorizontal,
  PenLine,
  Paperclip,
  Heading,
  EyeOff,
  Send,
  Boxes,
};

/** Resolve a field type's lucide icon, falling back to a neutral square. */
export function FieldIcon({ type, ...props }: { type: FieldType } & LucideProps) {
  const Icon = ICONS[FIELD_META[type].icon] ?? Square;
  return <Icon {...props} />;
}
