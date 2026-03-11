export default function HorseHero() {
  return (
    <section
      className="relative h-[360px] w-full bg-cover bg-center"
      style={{
        backgroundImage: "url('/img/horse-bg.png')",
      }}
    >
      {/* gradient fade */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white"></div>

      <div className="relative mx-auto flex h-full max-w-5xl items-end px-6 pb-10">
        <div className="w-full">
          <input
            placeholder="Search by name, discipline, location..."
            className="w-full rounded-md border border-stone-300 bg-white px-4 py-3 text-sm shadow-sm"
          />
        </div>
      </div>
    </section>
  )
}