import { PrismaClient } from "@/generated/prisma/client"
import { createPool } from "@/lib/db/pool"
import { PrismaPg } from "@prisma/adapter-pg"

const globalForPrisma = global as unknown as {
  prisma: PrismaClient
}

const pool = createPool()
const adapter = new PrismaPg(pool)

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter
  })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}

export default  prisma
