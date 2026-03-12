import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import {
    Camera,
    Eye,
    FileText,
    FolderOpen,
    Pencil,
    Plus,
    TrendingUp,
    CircleCheck,
    CircleX,
    Clock3,
    Trash2,
} from "lucide-react";

import prisma from "@/lib/db/prisma";
import { authOptions } from "@/lib/auth/options";
import AppHeader from "@/components/layout/app-header";
import PublishToggleButton from "@/components/horses/publish-toggle-button";
import { Button } from "@/components/ui/button";

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
            horses: {
                orderBy: {
                    createdAt: "desc",
                },
            },
        },
    });

    if (!seller) {
        redirect("/seller/onboard");
    }

    const totalHorses = seller.horses.length;
    const publishedHorses = seller.horses.filter((horse) => horse.isPublished).length;
    const draftHorses = seller.horses.filter((horse) => !horse.isPublished).length;

    const accessRequests = await prisma.accessRequest.findMany({
        where: {
            horse: {
                sellerProfileId: seller.id,
            },
        },
        select: {
            status: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    const pendingRequests = accessRequests.filter(
        (request) => request.status === "PENDING"
    ).length;

    const answeredRequests = accessRequests.filter(
        (request) => request.status === "APPROVED" || request.status === "DENIED"
    );

    const totalRequests = accessRequests.length;
    const averageResponseMs =
        answeredRequests.length > 0
            ? answeredRequests.reduce((sum, request) => {
                return sum + (request.updatedAt.getTime() - request.createdAt.getTime());
            }, 0) / answeredRequests.length
            : 0;

    function formatDuration(ms: number) {
        if (!ms) return "—";

        const totalMinutes = Math.round(ms / 1000 / 60);

        if (totalMinutes < 60) {
            return `${totalMinutes}m`;
        }

        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        if (hours < 24) {
            return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
        }

        const days = Math.floor(hours / 24);
        const remainingHours = hours % 24;

        return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
    }

    const averageResponseTime = formatDuration(averageResponseMs);

    return (
        <main className="min-h-screen bg-stone-50 text-stone-900">
            <AppHeader variant="seller" />

            <section className="border-b border-stone-200">
                <div className="mx-auto max-w-7xl px-6 py-10">
                    <p className="text-xs font-medium uppercase tracking-[0.24em] text-stone-500">
                        Sales Program Dashboard
                    </p>
                    <h1 className="mt-3 font-serif text-5xl">MyBarn</h1>
                    <p className="mt-3 max-w-2xl text-lg text-stone-600">
                        Manage your sales roster, documents, and buyer inquiries.
                    </p>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-6 py-8">
                <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-5">
                            <div className="relative">
                                <div className="overflow-hidden rounded-2xl border border-stone-200 bg-stone-50">
                                    <Image
                                        src={seller.logo || "/img/default-horse.png"}
                                        alt={seller.displayName}
                                        width={120}
                                        height={120}
                                        className="h-24 w-24 object-cover"
                                    />
                                </div>

                                <div className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full border border-stone-300 bg-white">
                                    <Camera className="h-4 w-4 text-stone-600" />
                                </div>
                            </div>

                            <div>
                                <h2 className="font-serif text-3xl text-stone-900">
                                    {seller.displayName}
                                </h2>
                                <p className="mt-2 text-sm text-stone-500">
                                    This appears on all your listings in the marketplace.
                                </p>

                                <div className="mt-4 flex flex-wrap gap-3">
                                    <Link href="/seller/settings">
                                        <Button variant="outline">Edit Profile</Button>
                                    </Link>

                                    <Link href={`/sellers/${seller.slug}`}>
                                        <Button variant="outline">View Public Page</Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
                    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center gap-2 text-sm text-stone-500">
                            <TrendingUp className="h-4 w-4" />
                            Total Horses
                        </div>
                        <p className="mt-4 font-serif text-4xl text-stone-900">{totalHorses}</p>
                    </div>

                    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center gap-2 text-sm text-stone-500">
                            <CircleCheck className="h-4 w-4 text-emerald-600" />
                            For Sale
                        </div>
                        <p className="mt-4 font-serif text-4xl text-stone-900">{publishedHorses}</p>
                    </div>

                    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center gap-2 text-sm text-stone-500">
                            <CircleX className="h-4 w-4 text-stone-500" />
                            Draft
                        </div>
                        <p className="mt-4 font-serif text-4xl text-stone-900">{draftHorses}</p>
                    </div>

                    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center gap-2 text-sm text-stone-500">
                            <Eye className="h-4 w-4 text-blue-600" />
                            Total Views
                        </div>
                        <p className="mt-4 font-serif text-4xl text-stone-900">1,247</p>
                        <p className="mt-1 text-sm text-stone-500">+12% this week</p>
                    </div>

                    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center gap-2 text-sm text-stone-500">
                            <FileText className="h-4 w-4 text-amber-600" />
                            Document Requests
                        </div>
                        <p className="mt-4 font-serif text-4xl text-stone-900">{totalRequests}</p>
                        <p className="mt-1 text-sm text-stone-500">{pendingRequests} pending</p>
                    </div>

                    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center gap-2 text-sm text-stone-500">
                            <Clock3 className="h-4 w-4 text-violet-600" />
                            Avg. Response Time
                        </div>
                        <p className="mt-4 font-serif text-4xl text-stone-900">{averageResponseTime}</p>
                    </div>
                </div>

                <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
                    <div className="inline-flex rounded-xl bg-stone-100 p-1">
                        <button className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2 text-sm font-medium text-stone-900 shadow-sm">
                            <FolderOpen className="h-4 w-4" />
                            My Horses
                        </button>

                        <Link
                            href="/seller/requests"
                            className="inline-flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium text-stone-600"
                        >
                            <FileText className="h-4 w-4" />
                            EquiVault
                        </Link>

                        <Link
                            href="/seller/requests"
                            className="inline-flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium text-stone-600"
                        >
                            <FolderOpen className="h-4 w-4" />
                            Doc Requests
                        </Link>
                    </div>

                    <Link href="/seller/horses/new">
                        <Button className="inline-flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Add Horse
                        </Button>
                    </Link>
                </div>

                {seller.horses.length === 0 ? (
                    <div className="mt-16 rounded-3xl border border-dashed border-stone-300 bg-white p-16 text-center">
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-stone-100">
                            <FolderOpen className="h-8 w-8 text-stone-500" />
                        </div>

                        <h2 className="mt-6 font-serif text-4xl text-stone-900">Your barn is empty</h2>
                        <p className="mx-auto mt-3 max-w-xl text-lg text-stone-500">
                            Add your first horse to start sharing listings and connecting with buyers.
                        </p>

                        <div className="mt-8">
                            <Link href="/seller/horses/new">
                                <Button className="inline-flex items-center gap-2">
                                    <Plus className="h-4 w-4" />
                                    Add Your First Horse
                                </Button>
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="mt-10 space-y-5">
                        {seller.horses.map((horse) => (
                            <div
                                key={horse.id}
                                className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm"
                            >
                                <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                                    <div className="flex gap-4">
                                        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-stone-50">
                                            <Image
                                                src={horse.image || "/img/default-horse.png"}
                                                alt={horse.name}
                                                width={220}
                                                height={160}
                                                className="h-28 w-36 object-cover"
                                            />
                                        </div>

                                        <div>
                                            <div className="flex flex-wrap items-center gap-3">
                                                <h3 className="font-serif text-3xl text-stone-900">{horse.name}</h3>
                                                <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
                                                    {horse.isPublished ? "For Sale" : "Draft"}
                                                </span>
                                            </div>

                                            <p className="mt-2 text-stone-500">
                                                {horse.breed || "Breed not specified"} {horse.age ? `• ${horse.age}` : ""}
                                            </p>

                                            {horse.isPublished ? (
                                                <div className="mt-3 inline-flex rounded-full bg-stone-100 px-3 py-1 text-sm font-medium text-stone-800">
                                                    Active in Marketplace
                                                </div>
                                            ) : null}

                                            <div className="mt-4 flex flex-wrap gap-4 text-sm text-stone-500">
                                                <span>{horse.age ? `${horse.age} yrs` : "Age not set"}</span>
                                                <span>{horse.discipline || "Discipline not set"}</span>
                                                <span>{horse.gender || "Gender not set"}</span>
                                            </div>

                                            <p className="mt-4 font-serif text-3xl text-amber-700">
                                                {horse.price
                                                    ? `$${Number(horse.price).toLocaleString()}`
                                                    : "Price on request"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3 xl:justify-end">
                                        <Button variant="outline">Feature</Button>

                                        <PublishToggleButton
                                            horseId={horse.id}
                                            isPublished={horse.isPublished}
                                        />

                                        <Link href={`/horses/${horse.id}`}>
                                            <Button variant="outline" className="inline-flex items-center gap-2">
                                                <Eye className="h-4 w-4" />
                                                Preview
                                            </Button>
                                        </Link>

                                        <Link href={`/seller/horses/${horse.id}/edit`}>
                                            <Button variant="outline" className="inline-flex items-center gap-2">
                                                <Pencil className="h-4 w-4" />
                                                Edit
                                            </Button>
                                        </Link>

                                        <Link href={`/seller/horses/${horse.id}/vault`}>
                                            <Button variant="outline" className="inline-flex items-center gap-2">
                                                <FileText className="h-4 w-4" />
                                                Vault
                                            </Button>
                                        </Link>

                                        <Button variant="outline" className="inline-flex items-center gap-2 text-red-600">
                                            <Trash2 className="h-4 w-4" />
                                            Remove
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}
