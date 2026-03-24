import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth/options";
import { isAdminRole } from "@/lib/admin/roles";
import prisma from "@/lib/db/prisma";
import { logAdminAction } from "@/lib/admin/audit";

type ResourceName =
  | "discipline"
  | "division"
  | "idealRider"
  | "horseType"
  | "pricingVisibility"
  | "saleType"
  | "breed"
  | "sex"
  | "color"
  | "importStatus";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as
    | {
        action?: "create" | "update";
        resource?: ResourceName;
        id?: string;
        label?: string;
        sortOrder?: number;
        isActive?: boolean;
        disciplineId?: string;
      }
    | null;

  const action = body?.action;
  const resource = body?.resource;
  const label = body?.label?.trim();

  if (!action || !resource) {
    return NextResponse.json({ error: "Invalid listing option request." }, { status: 400 });
  }

  try {
    if (resource === "discipline") {
      if (!label) {
        return NextResponse.json({ error: "Label is required." }, { status: 400 });
      }

      if (action === "create") {
        const created = await prisma.disciplineOption.create({
          data: {
            label,
            sortOrder: Number.isFinite(body?.sortOrder) ? Number(body?.sortOrder) : 0,
          },
        });

        await log(session.user.id, "create", resource, created.id, { label });
        return NextResponse.json({ success: true });
      }

      if (!body?.id) {
        return NextResponse.json({ error: "Option id is required." }, { status: 400 });
      }

      await prisma.disciplineOption.update({
        where: { id: body.id },
        data: {
          label,
          sortOrder: Number.isFinite(body?.sortOrder) ? Number(body?.sortOrder) : 0,
          isActive: Boolean(body?.isActive),
        },
      });
      await log(session.user.id, "update", resource, body.id, {
        label,
        sortOrder: body?.sortOrder ?? 0,
        isActive: Boolean(body?.isActive),
      });
      return NextResponse.json({ success: true });
    }

    if (resource === "division") {
      if (!label) {
        return NextResponse.json({ error: "Label is required." }, { status: 400 });
      }

      if (action === "create") {
        if (!body?.disciplineId) {
          return NextResponse.json({ error: "Discipline is required." }, { status: 400 });
        }

        const created = await prisma.divisionOption.create({
          data: {
            disciplineId: body.disciplineId,
            label,
            sortOrder: Number.isFinite(body?.sortOrder) ? Number(body?.sortOrder) : 0,
          },
        });

        await log(session.user.id, "create", resource, created.id, {
          label,
          disciplineId: body.disciplineId,
        });
        return NextResponse.json({ success: true });
      }

      if (!body?.id || !body?.disciplineId) {
        return NextResponse.json({ error: "Division id and discipline are required." }, { status: 400 });
      }

      await prisma.divisionOption.update({
        where: { id: body.id },
        data: {
          disciplineId: body.disciplineId,
          label,
          sortOrder: Number.isFinite(body?.sortOrder) ? Number(body?.sortOrder) : 0,
          isActive: Boolean(body?.isActive),
        },
      });
      await log(session.user.id, "update", resource, body.id, {
        label,
        disciplineId: body.disciplineId,
        sortOrder: body?.sortOrder ?? 0,
        isActive: Boolean(body?.isActive),
      });
      return NextResponse.json({ success: true });
    }

    if (!label) {
      return NextResponse.json({ error: "Label is required." }, { status: 400 });
    }

    if (action === "create") {
      const created = await createSimpleOption(resource, label, Number.isFinite(body?.sortOrder) ? Number(body?.sortOrder) : 0);
      await log(session.user.id, "create", resource, created.id, { label });
      return NextResponse.json({ success: true });
    }

    if (!body?.id) {
      return NextResponse.json({ error: "Option id is required." }, { status: 400 });
    }

    await updateSimpleOption(resource, body.id, label, Number.isFinite(body?.sortOrder) ? Number(body?.sortOrder) : 0, Boolean(body?.isActive));
    await log(session.user.id, "update", resource, body.id, {
      label,
      sortOrder: body?.sortOrder ?? 0,
      isActive: Boolean(body?.isActive),
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update listing option", error);
    return NextResponse.json({ error: "Could not update listing options." }, { status: 500 });
  }
}

async function log(actorUserId: string, action: "create" | "update", resource: ResourceName, targetId: string, metadata: Record<string, unknown>) {
  await logAdminAction({
    actorUserId,
    actionType: "LISTING_OPTIONS_UPDATED",
    targetType: "LISTING_OPTION",
    targetId,
    reason: `${action} ${resource} listing option`,
    metadata: metadata as never,
  });
}

async function createSimpleOption(resource: Exclude<ResourceName, "discipline" | "division">, label: string, sortOrder: number) {
  switch (resource) {
    case "idealRider":
      return prisma.idealRiderOption.create({ data: { label, sortOrder } });
    case "horseType":
      return prisma.horseTypeOption.create({ data: { label, sortOrder } });
    case "pricingVisibility":
      return prisma.pricingVisibilityOption.create({ data: { label, sortOrder } });
    case "saleType":
      return prisma.saleTypeOption.create({ data: { label, sortOrder } });
    case "breed":
      return prisma.breedOption.create({ data: { label, sortOrder } });
    case "sex":
      return prisma.sexOption.create({ data: { label, sortOrder } });
    case "color":
      return prisma.colorOption.create({ data: { label, sortOrder } });
    case "importStatus":
      return prisma.importStatusOption.create({ data: { label, sortOrder } });
  }
}

async function updateSimpleOption(
  resource: Exclude<ResourceName, "discipline" | "division">,
  id: string,
  label: string,
  sortOrder: number,
  isActive: boolean
) {
  switch (resource) {
    case "idealRider":
      return prisma.idealRiderOption.update({ where: { id }, data: { label, sortOrder, isActive } });
    case "horseType":
      return prisma.horseTypeOption.update({ where: { id }, data: { label, sortOrder, isActive } });
    case "pricingVisibility":
      return prisma.pricingVisibilityOption.update({ where: { id }, data: { label, sortOrder, isActive } });
    case "saleType":
      return prisma.saleTypeOption.update({ where: { id }, data: { label, sortOrder, isActive } });
    case "breed":
      return prisma.breedOption.update({ where: { id }, data: { label, sortOrder, isActive } });
    case "sex":
      return prisma.sexOption.update({ where: { id }, data: { label, sortOrder, isActive } });
    case "color":
      return prisma.colorOption.update({ where: { id }, data: { label, sortOrder, isActive } });
    case "importStatus":
      return prisma.importStatusOption.update({ where: { id }, data: { label, sortOrder, isActive } });
  }
}
