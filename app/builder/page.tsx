import type { Metadata } from "next";
import { FormBuilder } from "@/components/builder/FormBuilder";

export const metadata: Metadata = { title: "Builder" };

export default function BuilderPage() {
  return <FormBuilder />;
}
