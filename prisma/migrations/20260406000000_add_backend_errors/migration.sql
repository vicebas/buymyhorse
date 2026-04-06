-- CreateTable
CREATE TABLE "BackendError" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "stack" TEXT,
    "route" TEXT,
    "method" TEXT,
    "userId" TEXT,
    "metadata" JSONB,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BackendError_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BackendError_createdAt_idx" ON "BackendError"("createdAt");

-- CreateIndex
CREATE INDEX "BackendError_route_createdAt_idx" ON "BackendError"("route", "createdAt");

-- CreateIndex
CREATE INDEX "BackendError_resolvedAt_createdAt_idx" ON "BackendError"("resolvedAt", "createdAt");
