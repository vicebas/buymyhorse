export default function BuyerDashboardHero() {
  return (
    <section
      className="relative h-[360px] w-full bg-cover bg-center"
      style={{
        backgroundImage: "url('/img/horse-bg.png')",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-stone-50" />

      <div className="relative mx-auto flex h-full max-w-5xl items-end px-6 pb-10">
        <div className="w-full">
          <div className="mx-auto max-w-2xl">
            <input
              placeholder="Search by name, discipline, location..."
              className="w-full rounded-md border border-stone-300 bg-white px-4 py-3 text-sm shadow-sm outline-none placeholder:text-stone-400"
            />
          </div>
        </div>
      </div>
    </section>
  );
}