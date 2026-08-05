import prisma from "@/lib/db/prisma";
import { deletePublicAsset } from "@/lib/storage/public-assets";
import { processHorseMediaUpload, removeHorseMediaFiles } from "@/lib/media/horse-media";

type SerializablePhotoPlanItem = {
  id: string;
  source: "existing-primary" | "existing-gallery" | "new";
  existingMediaId?: string;
  isPrimary: boolean;
};

type ExistingImageMedia = {
  id: string;
  originalPath: string;
  processedPath: string | null;
  posterPath: string | null;
  mimeType: string | null;
  fileName: string;
};

export function parseHorsePhotoPlan(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.trim()) {
    return [] as SerializablePhotoPlanItem[];
  }

  try {
    const parsed = JSON.parse(value) as SerializablePhotoPlanItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function hasHorsePhotoSelection(plan: SerializablePhotoPlanItem[]) {
  return plan.length > 0;
}

export async function syncHorsePhotoPlan({
  horseId,
  currentImagePath,
  existingImageMedia,
  plan,
  newPhotoFiles,
}: {
  horseId: string;
  currentImagePath: string | null;
  existingImageMedia: ExistingImageMedia[];
  plan: SerializablePhotoPlanItem[];
  newPhotoFiles: File[];
}) {
  const uploadedNewItems = new Map<
    string,
    Awaited<ReturnType<typeof processHorseMediaUpload>>
  >();
  let nextNewPhotoIndex = 0;

  for (const item of plan) {
    if (item.source !== "new") {
      continue;
    }

    const file = newPhotoFiles[nextNewPhotoIndex];
    nextNewPhotoIndex += 1;

    if (!file) {
      throw new Error("A new horse photo upload was missing from the submission.");
    }

    uploadedNewItems.set(
      item.id,
      await processHorseMediaUpload({
        horseId,
        file,
      })
    );
  }

  const existingMediaById = new Map(existingImageMedia.map((item) => [item.id, item]));
  const primaryItem = plan.find((item) => item.isPrimary) ?? plan[0] ?? null;

  let nextImagePath: string | null = null;

  if (primaryItem?.source === "existing-primary") {
    nextImagePath = currentImagePath;
  } else if (primaryItem?.source === "existing-gallery" && primaryItem.existingMediaId) {
    const existingMedia = existingMediaById.get(primaryItem.existingMediaId);
    nextImagePath = existingMedia?.processedPath || existingMedia?.originalPath || null;
  } else if (primaryItem?.source === "new") {
    nextImagePath = uploadedNewItems.get(primaryItem.id)?.processedPath || null;
  }

  const retainedExistingGalleryIds = new Set<string>();
  const galleryCreates: Array<{
    type: "IMAGE";
    status: "READY";
    originalPath: string;
    processedPath: string | null;
    posterPath: string | null;
    mimeType: string | null;
    fileName: string;
    sortOrder: number;
  }> = [];
  const galleryUpdates: Array<{ id: string; sortOrder: number }> = [];

  let gallerySortOrder = 0;

  for (const item of plan) {
    if (item.isPrimary) {
      continue;
    }

    if (item.source === "existing-gallery" && item.existingMediaId) {
      retainedExistingGalleryIds.add(item.existingMediaId);
      galleryUpdates.push({
        id: item.existingMediaId,
        sortOrder: gallerySortOrder,
      });
      gallerySortOrder += 1;
      continue;
    }

    if (item.source === "existing-primary" && currentImagePath) {
      galleryCreates.push({
        type: "IMAGE",
        status: "READY",
        originalPath: currentImagePath,
        processedPath: currentImagePath,
        posterPath: currentImagePath,
        mimeType: "image/jpeg",
        fileName: "primary-photo",
        sortOrder: gallerySortOrder,
      });
      gallerySortOrder += 1;
      continue;
    }

    if (item.source === "new") {
      const uploaded = uploadedNewItems.get(item.id);

      if (!uploaded) {
        throw new Error("A new horse photo could not be processed.");
      }

      galleryCreates.push({
        type: "IMAGE",
        status: "READY",
        originalPath: uploaded.originalPath,
        processedPath: uploaded.processedPath,
        posterPath: uploaded.posterPath,
        mimeType: uploaded.mimeType,
        fileName: uploaded.fileName,
        sortOrder: gallerySortOrder,
      });
      gallerySortOrder += 1;
    }
  }

  const deletedExistingMedia = existingImageMedia.filter((item) => {
    if (primaryItem?.source === "existing-gallery" && primaryItem.existingMediaId === item.id) {
      return true;
    }

    return !retainedExistingGalleryIds.has(item.id);
  });

  await prisma.$transaction(async (tx) => {
    await tx.horse.update({
      where: { id: horseId },
      data: {
        image: nextImagePath,
      },
    });

    for (const update of galleryUpdates) {
      await tx.horseMedia.update({
        where: { id: update.id },
        data: {
          sortOrder: update.sortOrder,
        },
      });
    }

    if (deletedExistingMedia.length > 0) {
      await tx.horseMedia.deleteMany({
        where: {
          id: {
            in: deletedExistingMedia.map((item) => item.id),
          },
        },
      });
    }

    if (galleryCreates.length > 0) {
      await tx.horseMedia.createMany({
        data: galleryCreates.map((item) => ({
          horseId,
          ...item,
        })),
      });
    }
  });

  await Promise.all(deletedExistingMedia.map((item) => removeHorseMediaFiles(item).catch(() => null)));

  const demotedCurrentPrimary = plan.some(
    (item) => item.source === "existing-primary" && item.isPrimary === false
  );
  const replacedCurrentPrimary =
    currentImagePath &&
    nextImagePath !== currentImagePath &&
    !demotedCurrentPrimary;

  if (replacedCurrentPrimary) {
    await deletePublicAsset(currentImagePath).catch(() => null);
  }

  return {
    imagePath: nextImagePath,
  };
}
