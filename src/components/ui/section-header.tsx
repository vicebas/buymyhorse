export function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-8 space-y-2">
      {eyebrow ? (
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-stone-500">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="text-4xl text-stone-900 md:text-5xl">{title}</h1>
      {description ? (
        <p className="max-w-2xl text-base leading-7 text-stone-600">{description}</p>
      ) : null}
    </div>
  );
}