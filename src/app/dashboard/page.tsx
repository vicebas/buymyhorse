import prisma from "@/lib/db/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { redirect } from "next/navigation";
import AppHeader from "@/components/layout/app-header";
import BuyerDashboardHero from "@/components/dashboard/buyer-dashboard-hero";
import { Search } from "lucide-react";
import Image from "next/image"
import Link from "next/link";

export default async function UserDashboardPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        redirect("/login");
    }

    if (session.user.role === "ADMIN") {
        redirect("/admin");
    }



    const sellerProfile = await prisma.sellerProfile.findUnique({
        where: {
            userId: session.user.id,
        },
        select: {
            id: true,
            displayName: true,
        },
    });

    if (sellerProfile) {
        redirect("/seller");
    }

    const horses = await prisma.horse.findMany({
        where: {
            isPublished: true,
        },
        include: {
            sellerProfile: true,
        },
        take: 12,
    });
    return (
        <main className="min-h-screen bg-stone-50 text-stone-900">
            <AppHeader variant="buyer" />
            <BuyerDashboardHero />

            <section className="mx-auto max-w-5xl px-6 py-12">
                <p className="text-sm text-stone-600">0 listings</p>

                <div className="mt-20 flex flex-col items-center gap-4 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-stone-200 text-stone-600">
                        <Search size={28} />
                    </div>

                    <h2 className="font-serif text-3xl text-stone-900">No listings found</h2>

                    {horses.length === 0 && (
                        <p className="max-w-md text-sm leading-6 text-stone-500">
                            No horses have been posted to listings yet.
                        </p>
                    )}
                    {horses.length > 0 && (
                        <div className="grid gap-6 md:grid-cols-3">
                            {horses.map((horse) => (
                                <Link
                                    key={horse.id}
                                    href={`/horses/${horse.id}`}
                                    className="rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition block"
                                    >
                                    <Image
                                        src={horse.image || "/img/default-horse.png"}
                                        width={400}
                                        height={250}
                                        alt={horse.name}
                                        className="rounded-lg mb-3"
                                        />
                                        <h3 className="font-semibold text-lg">{horse.name}</h3>

                                    <p className="text-sm text-stone-500">
                                        {horse.breed || "Breed not set"}
                                    </p>

                                    <p className="text-sm mt-2">
                                        {horse.price
                                            ? `$${Number(horse.price).toLocaleString()}`
                                            : "Price on request"}
                                    </p>

                                    <p className="text-xs text-stone-500 mt-2">
                                        Seller: {horse.sellerProfile.displayName}
                                    </p>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </main>
    );
}