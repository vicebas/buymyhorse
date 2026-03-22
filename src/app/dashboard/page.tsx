import prisma from "@/lib/db/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import AppHeader from "@/components/layout/app-header";
import MainHeader from "@/components/layout/main-header";
import DashboardExperience from "@/components/dashboard/dashboard-experience";
import { isHorsePubliclyVisible } from "@/lib/billing/entitlements";

export default async function UserDashboardPage() {
    const session = await getServerSession(authOptions);


    const sellerProfile = session?.user?.id
        ? await prisma.sellerProfile.findUnique({
            where: {
                userId: session.user.id,
            },
            select: {
                id: true,
            },
        })
        : null;

    const horses = await prisma.horse.findMany({
        where: {
            isPublished: true,
            deletedAt: null,
            adminDisabledAt: null,
            sellerProfile: {
                adminDisabledAt: null,
            },
        },
        include: {
            sellerProfile: {
                select: {
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
                },
            },
        },
        take: 48,
    });

    const visibleHorses = horses.filter((horse) => isHorsePubliclyVisible(horse)).slice(0, 12);

    const horseCards = visibleHorses.map((horse) => ({
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
        sellerProfile: {
            displayName: horse.sellerProfile.displayName,
        },
    }));

    const isLoggedIn = Boolean(session?.user?.id);
    const isSeller = Boolean(sellerProfile);

    return (
        <main className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)]">
            {isLoggedIn ? (
                <AppHeader variant={isSeller ? "seller" : "buyer"} />
            ) : (
                <MainHeader activeItem="dashboard" />
            )}
            <DashboardExperience
                horses={horseCards}
                isLoggedIn={isLoggedIn}
                isSeller={isSeller}
            />
        </main>
    );
}
