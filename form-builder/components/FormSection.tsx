import type { ReactNode } from "react";

type FormSectionProps = {
  title?: string;
  description?: string;
  children: ReactNode;
};

export function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <section className="space-y-[4.272vw] tablet:space-y-[2vw] desktop:space-y-[0.832vw]">
      {title && (
        <h2 className="text-[5.34vw] tablet:text-[2.5vw] desktop:text-[1.04vw] font-semibold">{title}</h2>
      )}
      {description && <p className="text-muted-foreground">{description}</p>}
      {children}
    </section>
  );
}
