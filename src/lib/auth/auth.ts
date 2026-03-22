import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import bcrypt from "bcrypt"

import prisma from "@/lib/db/prisma"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  debug: true,

  session: {
    strategy: "database",
  },

  providers: [
    Credentials({
      name: "credentials",

      credentials: {
        email: {
            label: "Email",
            type: "email",
        },
        password: {
            label: "Password",
            type: "password",
        },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })

        if (!user || !user.password) return null

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!valid) return null

        return user
      },
    }),
  ],

  callbacks: {
    async session({ session, user }) {
      console.log("Session callback called with session:", session, "and user:", user)
      if (session.user) {
        const sessionUser = user as { id: string; role?: string }
        session.user.id = user.id
        session.user.role = sessionUser.role ?? "BUYER"
      }

      return session
    },
  },
})
