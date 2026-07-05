import Link from "next/link";

const forms = [
  { href: "/forms/live-account", title: "Live Account", description: "Open a Live Account — full KYC-style fields" },
  { href: "/forms/demo-account", title: "Demo Account", description: "Open a Demo Account — minimal signup" },
  { href: "/forms/ib", title: "IB Registration", description: "Introducing Broker journey with conditional field" },
];

export default function FormsIndexPage() {
  return (
    <div className="mx-auto max-w-xl space-y-6 p-8">
      <h1 className="text-3xl font-semibold">Example Forms</h1>
      <ul className="space-y-3">
        {forms.map((form) => (
          <li key={form.href}>
            <Link href={form.href} className="block rounded-lg border p-4 hover:bg-muted">
              <div className="font-medium">{form.title}</div>
              <div className="text-sm text-muted-foreground">{form.description}</div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
