# Horse Gallery Async Video Processing

Last updated: 2026-03-20

> Deprecated for the current production deployment direction.
> The active hosting path is the single-container EC2 deployment in [`docs/ec2-docker-deployment.md`](/home/vicebas/Workspace/buymyhorse/buymyhorse/docs/ec2-docker-deployment.md), where FFmpeg runs inside the main app container and `POST /api/horses/[id]/media` handles both images and videos.

## Purpose

Horse gallery videos now use a hybrid pipeline:
- images stay on the existing app-managed upload route
- videos upload directly to the public S3 bucket with a presigned PUT URL
- an S3-triggered Lambda transcodes the original video and generates the public poster image

## App Contract

### Seller video upload flow

1. `POST /api/horses/[id]/media/video/init`
2. App validates seller ownership, horse write access, MIME type, and max size
3. App creates a `HorseMedia` row with:
   - `type = VIDEO`
   - `status = PENDING_UPLOAD`
   - `originalPath = horses/media/{horseId}/originals/{mediaId}/...`
4. App returns:
   - `mediaId`
   - `objectKey`
   - presigned `uploadUrl`
   - required headers (`Content-Type`)
5. Browser uploads the original video directly to S3 with `PUT`
6. Browser calls `POST /api/horses/[id]/media/[mediaId]/upload` with `{ "status": "uploaded" }`
7. App verifies the object exists and matches allowed type/size, then marks the row `PROCESSING`

If browser upload fails, call the same endpoint with `{ "status": "failed" }`. The app deletes the pending row and the partial original object.

### Processor callback

Route:
- `POST /api/internal/media/video-processing`

Auth header:
- `x-horse-media-processor-secret: <HORSE_MEDIA_PROCESSOR_SECRET>`

Success payload:

```json
{
  "mediaId": "media-row-id",
  "status": "READY",
  "processedPath": "horses/media/<horseId>/processed/<mediaId>.mp4",
  "posterPath": "horses/media/<horseId>/posters/<mediaId>.jpg",
  "mimeType": "video/mp4"
}
```

Failure payload:

```json
{
  "mediaId": "media-row-id",
  "status": "FAILED"
}
```

## S3 Layout

- originals: `horses/media/{horseId}/originals/{mediaId}/...`
- processed video: `horses/media/{horseId}/processed/{mediaId}.mp4`
- poster image: `horses/media/{horseId}/posters/{mediaId}.jpg`

## Lambda Requirements

Reference implementation in repo:
- [`scripts/aws/horse-video-processor-lambda.mjs`](/home/vicebas/Workspace/buymyhorse/buymyhorse/scripts/aws/horse-video-processor-lambda.mjs)
- [`scripts/aws/Dockerfile.ffmpeg-layer`](/home/vicebas/Workspace/buymyhorse/buymyhorse/scripts/aws/Dockerfile.ffmpeg-layer)
- [`scripts/aws/build-ffmpeg-layer.sh`](/home/vicebas/Workspace/buymyhorse/buymyhorse/scripts/aws/build-ffmpeg-layer.sh)

### Trigger

- S3 `ObjectCreated:*`
- scope to the `horses/media/` originals prefix used for video uploads
- restrict suffixes to the allowed video extensions you support

### IAM

Minimum Lambda permissions:
- `s3:GetObject` for the original-video prefix
- `s3:PutObject` for processed/poster prefixes
- `logs:CreateLogGroup`
- `logs:CreateLogStream`
- `logs:PutLogEvents`

### Runtime behavior

- download original video from S3 to `/tmp`
- run FFmpeg to create:
  - H.264/AAC MP4 output
  - JPG poster image
- upload both artifacts back to the same public bucket
- call the internal callback route with the shared secret
- if processing fails, call the callback with `FAILED`

Required Lambda env vars:
- `AWS_REGION`
- `HORSE_MEDIA_PROCESSOR_CALLBACK_URL`
- `HORSE_MEDIA_PROCESSOR_SECRET`
- optional `FFMPEG_PATH` if your binary is not available at `/opt/bin/ffmpeg`

### Building the FFmpeg layer with Docker

Run:

```bash
./scripts/aws/build-ffmpeg-layer.sh
```

That produces:

```text
scripts/aws/dist/ffmpeg-layer.zip
```

Publish that zip as a Lambda Layer, attach it to the processor Lambda, and keep:

```text
FFMPEG_PATH=/opt/bin/ffmpeg
```

The layer zip is built with the Lambda-compatible structure:

```text
/opt/bin/ffmpeg
```

### FFmpeg profile

Recommended baseline:

```bash
ffmpeg -y \
  -i input.mov \
  -vf "scale='min(1280,iw)':-2" \
  -c:v libx264 \
  -preset veryfast \
  -crf 28 \
  -movflags +faststart \
  -pix_fmt yuv420p \
  -c:a aac \
  -b:a 128k \
  output.mp4
```

Poster:

```bash
ffmpeg -y \
  -ss 00:00:01 \
  -i output.mp4 \
  -frames:v 1 \
  -vf scale=960:-2 \
  poster.jpg
```

If the one-second frame is unavailable, retry with the first decodable frame.

## Notes

- Public horse pages render only `HorseMedia.status = READY`
- MyBarn gallery renders `PENDING_UPLOAD`, `PROCESSING`, and `FAILED` video states for operators
- Existing image uploads still use `POST /api/horses/[id]/media`
- Prisma migrations and Prisma client generation remain manual workflows in this environment
