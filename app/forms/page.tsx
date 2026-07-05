import Link from "next/link";

const forms = [
  { href: "/forms/live-account", title: "Live Account", description: "Open a Live Account — full KYC-style fields" },
  { href: "/forms/demo-account", title: "Demo Account", description: "Open a Demo Account — minimal signup" },
  { href: "/forms/ib", title: "IB Registration", description: "Introducing Broker journey with conditional field" },
];

export default function FormsIndexPage() {
  return (
    <div className="mx-auto max-w-[576px] tablet:max-w-[576px] desktop:max-w-[576px] space-y-[24px] tablet:space-y-[24px] desktop:space-y-[24px] p-[32px] tablet:p-[32px] desktop:p-[32px]">
      <h1 className="text-[30px] tablet:text-[30px] desktop:text-[30px] font-semibold">Example Forms</h1>
      <ul className="space-y-[12px] tablet:space-y-[12px] desktop:space-y-[12px]">
        {forms.map((form) => (
          <li key={form.href}>
            <Link href={form.href} className="block rounded-[10px] tablet:rounded-[10px] desktop:rounded-[10px] border p-[16px] tablet:p-[16px] desktop:p-[16px] hover:bg-muted">
              <div className="font-medium">{form.title}</div>
              <div className="text-[14px] tablet:text-[14px] desktop:text-[14px] text-muted-foreground">{form.description}</div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
