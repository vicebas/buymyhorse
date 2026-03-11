import { getServerSession } from "next-auth"
import { authOptions } from "./options"

export async function getAuthSession() {
  return getServerSession(authOptions)
}