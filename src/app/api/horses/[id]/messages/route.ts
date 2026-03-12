import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/options"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;

  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()

  const horse = await prisma.horse.findUnique({
    where: {
      id: resolvedParams.id
    }
  })

  if (!horse) {
    return Response.json({ error: "Horse not found" }, { status: 404 })
  }

  let conversation = await prisma.horseConversation.findUnique({
    where: {
      horseId_buyerId: {
        horseId: resolvedParams.id,
        buyerId: session.user.id
      }
    }
  })

  if (!conversation) {

    conversation = await prisma.horseConversation.create({
      data: {
        horseId: resolvedParams.id,
        buyerId: session.user.id,
        sellerId: horse.sellerProfileId
      }
    })

  }

  const message = await prisma.horseMessage.create({
    data: {
      conversationId: conversation.id,
      senderUserId: session.user.id,
      body: body.body
    }
  })

  return Response.json(message)
}