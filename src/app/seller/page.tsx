import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import {
    Camera,
    Eye,
    FileText,
    FolderOpen,
    Images,
    Pencil,
    Plus,
    TrendingUp,
    CircleCheck,
    CircleX,
    Clock3,
    Trash2,
    CreditCard,
} from "lucide-react";

import prisma from "@/lib/db/prisma";
import { authOptions } from "@/lib/auth/options";
import AdminBlockedNotice from "@/components/admin/admin-blocked-notice";
import { getBarnEntitlements } from "@/lib/billing/entitlements";
import { getBarnModerationMessage } from "@/lib/admin/moderation";
import AppHeader from "@/components/layout/app-header";
import PublishToggleButton from "@/components/horses/publish-toggle-button";
import HorseEquiTagModal from "@/components/equitag/horse-equitag-modal";
import { Button } from "@/components/ui/button";
import { ensureHorseHasEquiTag } from "@/lib/equitag/service";
import { resolvePublicAssetUrl } from "@/lib/storage/public-assets";

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
                include: {
                    attachedEquiTags: {
                        orderBy: {
                            createdAt: "desc",
                        },
                        select: {
                            id: true,
                            code: true,
                            svgPath: true,
                        },
                    },
                },
            },
        },
    });

    if (!seller) {
        redirect("/mybarn/onboard");
    }

    const horses = await Promise.all(
        seller.horses.map(async (horse) => {
            if (horse.attachedEquiTags.length > 0) {
                return horse;
            }

            try {
                const tag = await ensureHorseHasEquiTag({
                    ownerSellerProfileId: seller.id,
                    horseId: horse.id,
                });

                return {
                    ...horse,
                    attachedEquiTags: [
                        {
                            id: tag.id,
                            code: tag.code,
                            svgPath: tag.svgPath,
                        },
                    ],
                };
            } catch (error) {
                console.error("Failed to ensure horse EquiTag", error);
                return horse;
            }
        })
    );

    const entitlements = await getBarnEntitlements(seller.id);

    const totalHorses = horses.length;
    const publishedHorses = horses.filter((horse) => horse.isPublished).length;
    const inactiveHorses = horses.filter((horse) => !horse.isPublished).length;

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

    function formatBillingStatus(status: string) {
        switch (status) {
            case "TRIALING":
                return "Trialing";
            case "ACTIVE":
                return "Active";
            case "PAST_DUE":
                return "Past due";
            case "CANCELED":
                return "Canceled";
            case "EXPIRED":
                return "Expired";
            case "INCOMPLETE":
                return "Incomplete";
            default:
                return status;
        }
    }

    const averageResponseTime = formatDuration(averageResponseMs);

    return (
        <main className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)]">
            <AppHeader variant="seller" />

            <section className="border-b border-[color:var(--border)]">
                <div className="mx-auto max-w-7xl px-6 py-10">
                    <p className="mono text-xs font-medium uppercase tracking-[0.24em] text-[color:var(--foreground-soft)]">
                        Sales Program Dashboard
                    </p>
                    <h1 className="mt-3 text-5xl font-extrabold">MyBarn</h1>
                    <p className="mt-3 max-w-2xl text-lg text-[color:var(--foreground-soft)]">
                        Manage your sales roster, documents, and buyer inquiries.
                    </p>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-6 py-8">
                <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-[var(--shadow-card)]">
                    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-5">
                            <div className="relative">
                                <div className="overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--muted)]">
                                    <Image
                                        src={resolvePublicAssetUrl(seller.logo) || "/img/default-horse.png"}
                                        alt={seller.displayName}
                                        width={120}
                                        height={120}
                                        className="h-24 w-24 object-cover"
                                    />
                                </div>

                                <div className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--border)] bg-[color:var(--background-elevated)]">
                                    <Camera className="h-4 w-4 text-[color:var(--foreground-soft)]" />
                                </div>
                            </div>

                            <div>
                                <h2 className="text-3xl font-extrabold text-[color:var(--foreground-strong)]">
                                    {seller.displayName}
                                </h2>
                                <p className="mt-2 text-sm text-[color:var(--foreground-soft)]">
                                    This appears on all your listings in the marketplace.
                                </p>

                        <div className="mt-4 flex flex-wrap gap-3">
                                    <Link href="/mybarn/settings">
                                        <Button variant="outline">Edit Profile</Button>
                                    </Link>

                                    <Link href={`/barn/${seller.slug}`}>
                                        <Button variant="outline">View Public Page</Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
                    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-5 shadow-[var(--shadow-card)]">
                        <div className="flex items-center gap-2 text-sm text-[color:var(--foreground-soft)]">
                            <TrendingUp className="h-4 w-4" />
                            Total Horses
                        </div>
                        <p className="mt-4 text-4xl font-extrabold text-[color:var(--foreground-strong)]">{totalHorses}</p>
                    </div>

                    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-5 shadow-[var(--shadow-card)]">
                        <div className="flex items-center gap-2 text-sm text-[color:var(--foreground-soft)]">
                            <CircleCheck className="h-4 w-4 text-emerald-600" />
                            For Sale
                        </div>
                        <p className="mt-4 text-4xl font-extrabold text-[color:var(--foreground-strong)]">{publishedHorses}</p>
                    </div>

                    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-5 shadow-[var(--shadow-card)]">
                        <div className="flex items-center gap-2 text-sm text-[color:var(--foreground-soft)]">
                            <CircleX className="h-4 w-4 text-[color:var(--foreground-soft)]" />
                            Inactive
                        </div>
                        <p className="mt-4 text-4xl font-extrabold text-[color:var(--foreground-strong)]">{inactiveHorses}</p>
                    </div>

                    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-5 shadow-[var(--shadow-card)]">
                        <div className="flex items-center gap-2 text-sm text-[color:var(--foreground-soft)]">
                            <Eye className="h-4 w-4 text-blue-600" />
                            Total Views
                        </div>
                        <p className="mt-4 text-4xl font-extrabold text-[color:var(--foreground-strong)]">1,247</p>
                        <p className="mt-1 text-sm text-[color:var(--foreground-soft)]">+12% this week</p>
                    </div>

                    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-5 shadow-[var(--shadow-card)]">
                        <div className="flex items-center gap-2 text-sm text-[color:var(--foreground-soft)]">
                            <FileText className="h-4 w-4 text-amber-600" />
                            Document Requests
                        </div>
                        <p className="mt-4 text-4xl font-extrabold text-[color:var(--foreground-strong)]">{totalRequests}</p>
                        <p className="mt-1 text-sm text-[color:var(--foreground-soft)]">{pendingRequests} pending</p>
                    </div>

                    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-5 shadow-[var(--shadow-card)]">
                        <div className="flex items-center gap-2 text-sm text-[color:var(--foreground-soft)]">
                            <Clock3 className="h-4 w-4 text-violet-600" />
                            Avg. Response Time
                        </div>
                        <p className="mt-4 text-4xl font-extrabold text-[color:var(--foreground-strong)]">{averageResponseTime}</p>
                    </div>
                </div>

                <div className="mt-6 rounded-3xl border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-[var(--shadow-card)]">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="mono text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--foreground-soft)]">
                                Barn billing
                            </p>
                            <h2 className="mt-2 text-2xl font-extrabold text-[color:var(--foreground-strong)]">
                                HorseRoster activation
                            </h2>
                            <p className="mt-2 text-sm text-[color:var(--foreground-soft)]">
                                {seller.billingStatus === "TRIALING" && seller.trialEndsAt
                                    ? `Trial ends ${seller.trialEndsAt.toLocaleDateString()}`
                                    : seller.currentPeriodEndsAt
                                        ? `Renews ${seller.currentPeriodEndsAt.toLocaleDateString()}`
                                        : "Activation status will update after Stripe sync."}
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-4">
                            <div className="rounded-2xl bg-[color:var(--background-elevated)] px-4 py-3">
                                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-[color:var(--foreground-soft)]">
                                    <CircleCheck className="h-3.5 w-3.5" />
                                    Published
                                </div>
                                <p className="mt-2 text-xl font-extrabold text-[color:var(--foreground-strong)]">
                                    {entitlements.usage.publishedHorseCount}/{entitlements.activation.totalHorseCapacity}
                                </p>
                            </div>

                            <div className="rounded-2xl bg-[color:var(--background-elevated)] px-4 py-3">
                                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-[color:var(--foreground-soft)]">
                                    <CreditCard className="h-3.5 w-3.5" />
                                    Billing
                                </div>
                                <p className="mt-2 text-xl font-extrabold text-[color:var(--foreground-strong)]">
                                    {formatBillingStatus(seller.billingStatus)}
                                </p>
                            </div>

                            <Link href="/mybarn/billing">
                                <Button variant="outline">Open Billing</Button>
                            </Link>
                        </div>
                    </div>
                </div>

                {seller.adminDisabledAt ? (
                    <div className="mt-6">
                        <AdminBlockedNotice
                            title="This barn is disabled"
                            message={getBarnModerationMessage(seller.adminDisableReason)}
                        />
                    </div>
                ) : null}

                <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
                    <div className="inline-flex rounded-xl bg-[color:var(--muted)] p-1">
                        <button className="inline-flex items-center gap-2 rounded-lg bg-[color:var(--background-elevated)] px-5 py-2 text-sm font-medium text-[color:var(--foreground-strong)] shadow-[var(--shadow-card)]">
                            <FolderOpen className="h-4 w-4" />
                            My Horses
                        </button>

                        <Link
                            href="/mybarn/requests"
                            className="inline-flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium text-[color:var(--foreground-soft)]"
                        >
                            <FileText className="h-4 w-4" />
                            EquiVault
                        </Link>

                        <Link
                            href="/mybarn/requests"
                            className="inline-flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium text-[color:var(--foreground-soft)]"
                        >
                            <FolderOpen className="h-4 w-4" />
                            Doc Requests
                        </Link>
                    </div>

                    <Link href="/mybarn/horses/new">
                        <Button className="inline-flex items-center gap-2" disabled={Boolean(seller.adminDisabledAt)}>
                            <Plus className="h-4 w-4" />
                            Add Horse
                        </Button>
                    </Link>
                </div>

                {horses.length === 0 ? (
                    <div className="mt-16 rounded-3xl border border-dashed border-[color:var(--border)] bg-[color:var(--card)] p-16 text-center shadow-[var(--shadow-card)]">
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[color:var(--muted)]">
                            <FolderOpen className="h-8 w-8 text-[color:var(--foreground-soft)]" />
                        </div>

                        <h2 className="mt-6 text-4xl font-extrabold text-[color:var(--foreground-strong)]">Your barn is empty</h2>
                        <p className="mx-auto mt-3 max-w-xl text-lg text-[color:var(--foreground-soft)]">
                            Add your first horse to start sharing listings and connecting with buyers.
                        </p>

                        <div className="mt-8">
                            <Link href="/mybarn/horses/new">
                                <Button className="inline-flex items-center gap-2">
                                    <Plus className="h-4 w-4" />
                                    Add Your First Horse
                                </Button>
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="mt-10 space-y-5">
                        {horses.map((horse) => (
                            <div
                                key={horse.id}
                                className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--card)] p-4 shadow-[var(--shadow-card)]"
                            >
                                <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                                    <div className="flex gap-4">
                                        <div className="overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--muted)]">
                                            <Image
                                                src={resolvePublicAssetUrl(horse.image) || "/img/default-horse.png"}
                                                alt={horse.name}
                                                width={220}
                                                height={160}
                                                className="h-28 w-36 object-cover"
                                            />
                                        </div>

                                        <div>
                                            <div className="flex flex-wrap items-center gap-3">
                                                <h3 className="text-3xl font-extrabold text-[color:var(--foreground-strong)]">
                                                    {horse.name}
                                                </h3>
                                                <span
                                                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${
                                                        horse.adminDisabledAt
                                                            ? "bg-[color:var(--destructive)]/10 text-[color:var(--destructive)]"
                                                            : horse.isPublished
                                                            ? "bg-[rgba(45,84,56,0.14)] text-[#2d5438]"
                                                            : "bg-[color:var(--muted)] text-[color:var(--foreground-soft)]"
                                                    }`}
                                                >
                                                    {horse.adminDisabledAt ? "Disabled" : horse.isPublished ? "For Sale" : "Inactive"}
                                                </span>
                                            </div>

                                            <p className="mt-2 text-[color:var(--foreground-soft)]">
                                                {horse.breed || "Breed not specified"} {horse.age ? `• ${horse.age}` : ""}
                                            </p>

                                            {horse.adminDisabledAt ? (
                                                <div className="mt-3 inline-flex rounded-full bg-[color:var(--destructive)]/10 px-3 py-1 text-sm font-medium text-[color:var(--destructive)]">
                                                    Disabled by admin
                                                </div>
                                            ) : horse.isPublished ? (
                                                <div className="mt-3 inline-flex rounded-full bg-[rgba(45,84,56,0.14)] px-3 py-1 text-sm font-medium text-[#2d5438]">
                                                    Active in Marketplace
                                                </div>
                                            ) : (
                                                <div className="mt-3 inline-flex rounded-full bg-[color:var(--muted)] px-3 py-1 text-sm font-medium text-[color:var(--foreground-soft)]">
                                                    Inactive
                                                </div>
                                            )}

                                            <div className="mt-4 flex flex-wrap gap-4 text-sm text-[color:var(--foreground-soft)]">
                                                <span>{horse.age ? `${horse.age} yrs` : "Age not set"}</span>
                                                <span>{horse.discipline || "Discipline not set"}</span>
                                                <span>{horse.gender || "Gender not set"}</span>
                                            </div>

                                            <p className="mt-4 text-3xl font-extrabold text-[color:var(--foreground-strong)]">
                                                {horse.price
                                                    ? `$${Number(horse.price).toLocaleString()}`
                                                    : "Price on request"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3 xl:justify-end">
                                        <Button variant="outline" disabled={Boolean(seller.adminDisabledAt || horse.adminDisabledAt)}>Feature</Button>

                                        <PublishToggleButton
                                            horseId={horse.id}
                                            isPublished={horse.isPublished}
                                            disabled={Boolean(seller.adminDisabledAt || horse.adminDisabledAt)}
                                        />

                                        <HorseEquiTagModal equiTags={horse.attachedEquiTags} />

                                        <Link href={`/horses/${horse.id}`}>
                                            <Button variant="outline" className="inline-flex items-center gap-2">
                                                <Eye className="h-4 w-4" />
                                                Preview
                                            </Button>
                                        </Link>

                                        <Link href={`/mybarn/horses/${horse.id}/edit`}>
                                            <Button variant="outline" className="inline-flex items-center gap-2">
                                                <Pencil className="h-4 w-4" />
                                                Edit
                                            </Button>
                                        </Link>

                                        <Link href={`/mybarn/horses/${horse.id}/gallery`}>
                                            <Button variant="outline" className="inline-flex items-center gap-2">
                                                <Images className="h-4 w-4" />
                                                Gallery
                                            </Button>
                                        </Link>

                                        <Link href={`/mybarn/horses/${horse.id}/vault`}>
                                            <Button variant="outline" className="inline-flex items-center gap-2">
                                                <FileText className="h-4 w-4" />
                                                Vault
                                            </Button>
                                        </Link>

                                        <Button variant="outline" className="inline-flex items-center gap-2 text-[color:var(--destructive)] hover:text-[color:var(--destructive)]">
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
