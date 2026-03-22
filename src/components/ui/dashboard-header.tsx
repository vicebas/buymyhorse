import { Button } from "@/components/ui/button";

export function DashboardHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 rounded-3xl border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-[var(--shadow-card)] md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-3xl font-extrabold text-[color:var(--foreground-strong)]">{title}</h1>
        {description ? (
          <p className="mt-2 text-[color:var(--foreground-soft)]">{description}</p>
        ) : null}
      </div>
      {action ?? <Button>Action</Button>}
    </div>
  );
}
