import AppHeader from "@/components/layout/app-header";
import HorseForm from "@/components/horses/horse-form";

export default function NewHorsePage() {
  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <AppHeader variant="seller" />

      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-stone-500">
            MyBarn
          </p>
          <h1 className="mt-2 font-serif text-4xl">Add New Horse</h1>
          <p className="mt-3 max-w-2xl text-stone-600">
            Fill in the details below to add a horse to your barn.
          </p>
        </div>

        <HorseForm mode="create" />
      </section>
    </main>
  );
}