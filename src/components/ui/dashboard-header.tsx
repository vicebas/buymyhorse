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
    <div className="mb-8 flex flex-col gap-4 rounded-3xl border border-[--border] bg-white p-6 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-3xl text-stone-900">{title}</h1>
        {description ? (
          <p className="mt-2 text-stone-600">{description}</p>
        ) : null}
      </div>
      {action ?? <Button>Action</Button>}
    </div>
  );
}