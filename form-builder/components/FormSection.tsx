import type { ReactNode } from "react";

type FormSectionProps = {
  title?: string;
  description?: string;
  children: ReactNode;
};

export function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <section className="space-y-4">
      {title && <h2 className="text-xl font-semibold">{title}</h2>}
      {description && <p className="text-muted-foreground">{description}</p>}
      {children}
    </section>
  );
}
