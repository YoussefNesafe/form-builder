import type { ReactNode } from "react";

type FormSectionProps = {
  title?: string;
  description?: string;
  children: ReactNode;
};

export function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <section className="space-y-[16px] tablet:space-y-[16px] desktop:space-y-[16px]">
      {title && (
        <h2 className="text-[20px] tablet:text-[20px] desktop:text-[20px] font-semibold">{title}</h2>
      )}
      {description && <p className="text-muted-foreground">{description}</p>}
      {children}
    </section>
  );
}
