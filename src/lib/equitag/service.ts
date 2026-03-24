import { randomBytes } from "node:crypto";

import QRCode from "qrcode";

import prisma from "@/lib/db/prisma";
import { EquiTagAttachmentType } from "@/generated/prisma/enums";
import { readPublicAsset, uploadPublicAsset } from "@/lib/storage/public-assets";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function getBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000"
  );
}

function randomCodeSegment(length: number) {
  const bytes = randomBytes(length * 2);
  let output = "";

  for (const byte of bytes) {
    output += CODE_ALPHABET[byte % CODE_ALPHABET.length];

    if (output.length === length) {
      break;
    }
  }

  return output;
}

function buildCode() {
  return `EQ${randomCodeSegment(7)}`;
}

async function createUniqueCode() {
  while (true) {
    const code = buildCode();
    const existing = await prisma.equiTag.findUnique({
      where: { code },
      select: { id: true },
    });

    if (!existing) {
      return code;
    }
  }
}

async function createQrAssets(code: string) {
  const encodedUrl = `${getBaseUrl()}/eq/${code}`;
  const svgFileName = `${code}.svg`;
  const pngFileName = `${code}.png`;
  const svgKey = `equitag/tags/${svgFileName}`;
  const pngKey = `equitag/tags/${pngFileName}`;

  const svg = await QRCode.toString(encodedUrl, {
    type: "svg",
    errorCorrectionLevel: "H",
    margin: 1,
    color: {
      dark: "#0F2A44",
      light: "#FFFFFF",
    },
  });

  const png = await QRCode.toBuffer(encodedUrl, {
    type: "png",
    errorCorrectionLevel: "H",
    margin: 1,
    color: {
      dark: "#0F2A44",
      light: "#FFFFFF",
    },
    width: 720,
  });

  await Promise.all([
    uploadPublicAsset({
      key: svgKey,
      body: svg,
      contentType: "image/svg+xml",
    }),
    uploadPublicAsset({
      key: pngKey,
      body: png,
      contentType: "image/png",
    }),
  ]);

  return {
    svgPath: svgKey,
    pngPath: pngKey,
  };
}

export async function createEquiTag(ownerSellerProfileId: string) {
  const code = await createUniqueCode();
  const assets = await createQrAssets(code);

  return prisma.equiTag.create({
    data: {
      code,
      ownerSellerProfileId,
      svgPath: assets.svgPath,
      pngPath: assets.pngPath,
    },
  });
}

export async function createHorseEquiTag(ownerSellerProfileId: string, horseId: string) {
  const equiTag = await createEquiTag(ownerSellerProfileId);

  try {
    return await attachEquiTagToHorse(equiTag.id, ownerSellerProfileId, horseId);
  } catch (error) {
    await prisma.equiTag.delete({ where: { id: equiTag.id } }).catch(() => null);
    throw error;
  }
}

export async function ensureHorseHasEquiTag({
  ownerSellerProfileId,
  horseId,
}: {
  ownerSellerProfileId: string;
  horseId: string;
}) {
  const existing = await prisma.equiTag.findFirst({
    where: {
      ownerSellerProfileId,
      attachedEntityType: 'HORSE',
      attachedHorseId: horseId,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (existing) {
    return existing;
  }

  return createHorseEquiTag(ownerSellerProfileId, horseId);
}

export async function attachEquiTagToBarn(equiTagId: string, ownerSellerProfileId: string) {
  return prisma.equiTag.update({
    where: { id: equiTagId },
    data: {
      attachedEntityType: "BARN",
      attachedBarnId: ownerSellerProfileId,
      attachedHorseId: null,
    },
  });
}

export async function attachEquiTagToHorse(
  equiTagId: string,
  ownerSellerProfileId: string,
  attachedHorseId: string
) {
  const horse = await prisma.horse.findFirst({
    where: {
      id: attachedHorseId,
      sellerProfileId: ownerSellerProfileId,
    },
    select: { id: true },
  });

  if (!horse) {
    throw new Error("Horse not found.");
  }

  return prisma.equiTag.update({
    where: { id: equiTagId },
    data: {
      attachedEntityType: "HORSE",
      attachedBarnId: null,
      attachedHorseId,
    },
  });
}

export async function detachEquiTag(equiTagId: string) {
  return prisma.equiTag.update({
    where: { id: equiTagId },
    data: {
      attachedEntityType: null,
      attachedBarnId: null,
      attachedHorseId: null,
    },
  });
}

export async function recordEquiTagVisit(tag: {
  id: string;
  code: string;
  ownerSellerProfileId: string;
  attachedEntityType: EquiTagAttachmentType | null;
  attachedBarnId: string | null;
  attachedHorseId: string | null;
}) {
  return prisma.equiTagVisit.create({
    data: {
      equiTagId: tag.id,
      codeSnapshot: tag.code,
      ownerSellerProfileId: tag.ownerSellerProfileId,
      attachedEntityType: tag.attachedEntityType,
      attachedBarnId: tag.attachedBarnId,
      attachedHorseId: tag.attachedHorseId,
    },
  });
}

export function getEquiTagAttachmentLabel(tag: {
  attachedEntityType: EquiTagAttachmentType | null;
  attachedBarn?: { displayName: string } | null;
  attachedHorse?: { name: string } | null;
}) {
  if (tag.attachedEntityType === "BARN" && tag.attachedBarn) {
    return `Attached to barn: ${tag.attachedBarn.displayName}`;
  }

  if (tag.attachedEntityType === "HORSE" && tag.attachedHorse) {
    return `Attached to horse: ${tag.attachedHorse.name}`;
  }

  return "Unassigned";
}

export function getEquiTagScanHref(code: string) {
  return `/eq/${code}`;
}

export function getEquiTagEntryHref(code: string) {
  return `/eq/${code}`;
}

export async function readEquiTagAsset(publicPath: string) {
  return readPublicAsset(publicPath);
}
