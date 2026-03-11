import prisma from "@/lib/db/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/options"
import { NextResponse } from "next/server"

export async function POST(req:Request,{params}:{params:{id:string}}){

  const session = await getServerSession(authOptions)

  if(!session?.user?.id){
    return NextResponse.json({error:"Unauthorized"},{status:401})
  }

  const horse = await prisma.horse.findUnique({
    where:{ id:params.id }
  })

  if(!horse){
    return NextResponse.json({error:"Horse not found"},{status:404})
  }

  const existing = await prisma.accessRequest.findUnique({
    where:{
      horseId_buyerId:{
        horseId:params.id,
        buyerId:session.user.id
      }
    }
  })

  if(existing){
    return NextResponse.json(existing)
  }

  const request = await prisma.accessRequest.create({
    data:{
      horseId:params.id,
      buyerId:session.user.id
    }
  })

  return NextResponse.json(request)
}