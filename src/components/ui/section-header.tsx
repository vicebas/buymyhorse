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
        <p className="mono text-sm font-medium uppercase tracking-[0.18em] text-[color:var(--foreground-soft)]">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="text-4xl font-extrabold text-[color:var(--foreground-strong)] md:text-5xl">{title}</h1>
      {description ? (
        <p className="max-w-2xl text-base leading-7 text-[color:var(--foreground-soft)]">{description}</p>
      ) : null}
    </div>
  );
}
