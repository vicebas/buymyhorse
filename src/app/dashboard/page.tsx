import prisma from "@/lib/db/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import ResolvedAppHeader from "@/components/layout/resolved-app-header";
import MainHeader from "@/components/layout/main-header";
import DashboardExperience from "@/components/dashboard/dashboard-experience";
import { isHorsePubliclyVisible } from "@/lib/billing/entitlements";

export default async function UserDashboardPage() {
    const session = await getServerSession(authOptions);

    const baseHorseWhere = {
        isPublished: true,
        deletedAt: null,
        adminDisabledAt: null,
        sellerProfile: { adminDisabledAt: null },
    };

    const sellerProfileSelect = {
        displayName: true,
        plan: true,
        billingCadence: true,
        billingStatus: true,
        adminPlanOverride: true,
        adminBillingCadenceOverride: true,
        adminBillingStatusOverride: true,
        adminBillingOverrideReason: true,
        adminBillingOverrideExpiresAt: true,
        trialEndsAt: true,
        currentPeriodEndsAt: true,
        adminDisabledAt: true,
    };

    // Fetch seller profile, barn follows, and featured horses in parallel.
    const [sellerProfile, barnFollows, featuredHorses] = await Promise.all([
        session?.user?.id
            ? prisma.sellerProfile.findUnique({ where: { userId: session.user.id }, select: { id: true } })
            : Promise.resolve(null),
        session?.user?.id
            ? prisma.barnFollow.findMany({ where: { userId: session.user.id }, select: { sellerProfileId: true } })
            : Promise.resolve([]),
        prisma.horse.findMany({
            where: { ...baseHorseWhere, isPlatformFeatured: true },
            include: { sellerProfile: { select: sellerProfileSelect } },
            orderBy: [{ platformFeaturedAt: "desc" }, { createdAt: "desc" }],
            take: 24,
        }),
    ]);

    const followedSellerIds = barnFollows.map((f) => f.sellerProfileId);
    const hasFollows = followedSellerIds.length > 0;

    // For logged-in users following barns: horses from those barns sorted by most recently updated.
    // For everyone else: latest published listings.
    const contentHorsesRaw = hasFollows
        ? await prisma.horse.findMany({
            where: { ...baseHorseWhere, sellerProfileId: { in: followedSellerIds } },
            include: { sellerProfile: { select: sellerProfileSelect } },
            orderBy: [{ updatedAt: "desc" }],
            take: 24,
          })
        : await prisma.horse.findMany({
            where: { ...baseHorseWhere, isPlatformFeatured: false },
            include: { sellerProfile: { select: sellerProfileSelect } },
            orderBy: [{ createdAt: "desc" }],
            take: 48,
          });

    const toCard = (horse: (typeof contentHorsesRaw)[0]) => ({
        id: horse.id,
        name: horse.name,
        breed: horse.breed,
        age: horse.age,
        height: horse.height,
        gender: horse.gender,
        discipline: horse.discipline,
        level: horse.level,
        price: horse.price ? Number(horse.price) : null,
        image: horse.image,
        location: horse.location,
        saleStatus: horse.saleStatus,
        isPlatformFeatured: horse.isPlatformFeatured,
        sellerProfile: { displayName: horse.sellerProfile.displayName },
    });

    const featuredVisibleHorses = featuredHorses.filter(isHorsePubliclyVisible).slice(0, 6);
    const contentVisible = contentHorsesRaw.filter(isHorsePubliclyVisible).slice(0, hasFollows ? 24 : 12);

    const featuredHorseCards = featuredVisibleHorses.map(toCard);
    // followedBarnsHorses is non-null only when the user follows barns; null triggers fresh-listings fallback.
    const followedBarnsHorses = hasFollows ? contentVisible.map(toCard) : null;
    const horseCards = hasFollows ? [] : contentVisible.map(toCard);

    const isLoggedIn = Boolean(session?.user?.id);
    const isSeller = Boolean(sellerProfile?.id);

    return (
        <main className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)]">
            {isLoggedIn ? (
                <ResolvedAppHeader variant={isSeller ? "seller" : "buyer"} />
            ) : (
                <MainHeader activeItem="dashboard" />
            )}
            <DashboardExperience
                horses={horseCards}
                featuredHorses={featuredHorseCards}
                followedBarnsHorses={followedBarnsHorses}
                isLoggedIn={isLoggedIn}
                isSeller={isSeller}
            />
        </main>
    );
}
