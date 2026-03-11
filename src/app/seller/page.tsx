import prisma from "@/lib/db/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { redirect } from "next/navigation";
import Link from "next/link";
import AppHeader from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SellerPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        redirect("/login");
    }

    const seller = await prisma.sellerProfile.findUnique({
        where: {
            userId: session.user.id,
        },
        include: {
            horses: true,
        },
    });

    if (!seller) {
        redirect("/seller/onboard");
    }

    return (
        <main className="min-h-screen bg-stone-50 text-stone-900">
            <AppHeader variant="seller" />

            <section className="mx-auto max-w-6xl px-6 py-10">
                <div className="rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
                    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="text-sm font-medium uppercase tracking-[0.18em] text-stone-500">
                                Seller Dashboard
                            </p>
                            <h1 className="mt-2 font-serif text-4xl text-stone-900">
                                Welcome, {seller.displayName}
                            </h1>
                            <p className="mt-3 max-w-2xl text-stone-600">
                                Manage your profile, publish horse listings, and grow your presence in the marketplace.
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <Link href="/seller/horses">
                                <Button variant="outline">Manage Horses</Button>
                            </Link>

                            <Link href="/seller/settings">
                                <Button variant="outline">Edit Profile</Button>
                            </Link>

                            <Link href={`/sellers/${seller.slug}`}>
                                <Button variant="outline">View Public Page</Button>
                            </Link>

                            <Link href="/seller/horses/new">
                                <Button>Add New Horse</Button>
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="mt-8 grid gap-4 md:grid-cols-3">
                    <Card className="rounded-2xl border-stone-200 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base text-stone-600">Total Horses</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="font-serif text-4xl text-stone-900">{seller.horses.length}</p>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-stone-200 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base text-stone-600">Published</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="font-serif text-4xl text-stone-900">
                                {seller.horses.filter((horse) => horse.isPublished).length}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-stone-200 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base text-stone-600">Drafts</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="font-serif text-4xl text-stone-900">
                                {seller.horses.filter((horse) => !horse.isPublished).length}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="mt-8 rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
                    <h2 className="font-serif text-2xl text-stone-900">Your Listings</h2>

                    {seller.horses.length === 0 ? (
                        <div className="mt-8 rounded-2xl border border-dashed border-stone-300 p-10 text-center">
                            <p className="text-lg text-stone-700">No horses added yet</p>
                            <p className="mt-2 text-sm text-stone-500">
                                Create your first horse listing to start showcasing your inventory.
                            </p>
                            <div className="mt-6">
                                <Link href="/seller/horses/new">
                                    <Button>Add Your First Horse</Button>
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {seller.horses.map((horse) => (
                                <div
                                    key={horse.id}
                                    className="rounded-2xl border border-stone-200 bg-stone-50 p-5"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <h3 className="text-lg font-semibold text-stone-900">{horse.name}</h3>
                                            <p className="mt-1 text-sm text-stone-500">
                                                {horse.breed || "Breed not set"}
                                            </p>
                                        </div>

                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-medium ${horse.isPublished
                                                    ? "bg-emerald-100 text-emerald-700"
                                                    : "bg-stone-200 text-stone-700"
                                                }`}
                                        >
                                            {horse.isPublished ? "Published" : "Draft"}
                                        </span>
                                    </div>

                                    <div className="mt-4 text-sm text-stone-600">
                                        {horse.price ? `$${Number(horse.price).toLocaleString()}` : "Price not set"}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </main>
    );
}