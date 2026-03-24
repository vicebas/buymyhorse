export const HORSE_GALLERY_MAX_IMAGES = 20;
export const HORSE_GALLERY_MAX_VIDEOS = 2;
export const HORSE_IMAGE_MAX_BYTES = 10 * 1024 * 1024;
export const HORSE_VIDEO_MAX_BYTES = 250 * 1024 * 1024;

export function getHorseMediaLimitSummary() {
  return `${HORSE_GALLERY_MAX_IMAGES} photos max • ${HORSE_GALLERY_MAX_VIDEOS} videos max • 10 MB per image • 250 MB per video`;
}
