import prisma from "@/lib/db/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { redirect } from "next/navigation";
import Link from "next/link";

import AppHeader from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import PublishToggleButton from "@/components/horses/publish-toggle-button";

export default async function SellerHorsesPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) redirect("/login");

    const seller = await prisma.sellerProfile.findUnique({
        where: { userId: session.user.id },
        include: {
            horses: true,
        },
    });

    if (!seller) redirect("/seller/onboard");

    return (
        <main className="min-h-screen bg-stone-50">
            <AppHeader variant="seller" />

            <section className="mx-auto max-w-6xl px-6 py-10">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="font-serif text-3xl">Your Horses</h1>

                    <Link href="/seller/horses/new">
                        <Button>Add Horse</Button>
                    </Link>
                </div>

                {seller.horses.length === 0 ? (
                    <Card className="p-10 text-center">
                        <CardContent>
                            <p className="text-lg text-stone-700">No horses yet</p>
                            <p className="text-sm text-stone-500 mt-2">
                                Create your first horse listing.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-6 md:grid-cols-3">
                        {seller.horses.map((horse) => (
                            <Card key={horse.id} className="p-5">
                                <CardContent className="space-y-4">
                                    <h3 className="text-lg font-semibold">{horse.name}</h3>

                                    <p className="text-sm text-stone-500">
                                        {horse.breed || "Breed not set"}
                                    </p>

                                    <p className="text-sm">
                                        {horse.price
                                            ? `$${Number(horse.price).toLocaleString()}`
                                            : "Price not set"}
                                    </p>

                                    <p className="text-xs text-stone-500">
                                        {horse.isPublished ? "Published" : "Draft"}
                                    </p>
                                    <p>                                    <PublishToggleButton horseId={horse.id} isPublished={horse.isPublished} />
                                    </p>
                                    <div className="flex flex-wrap gap-2 pt-2">

                                        <Link href={`/seller/horses/${horse.id}/edit`}>
                                            <Button variant="outline" size="sm">Edit</Button>
                                        </Link>

                                        <Link href={`/seller/horses/${horse.id}/vault`}>
                                            <Button variant="outline" size="sm">DocumentVault</Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}