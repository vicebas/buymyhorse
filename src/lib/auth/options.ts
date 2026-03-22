import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcrypt"

import prisma from "@/lib/db/prisma"


export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
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

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as typeof user & { role?: string }).role ?? "BUYER"
        token.emailVerified = !!(user as typeof user & { emailVerified?: Date | null }).emailVerified
      }
      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        const currentUser = token.id
          ? await prisma.user.findUnique({
              where: { id: token.id as string },
              select: { role: true, emailVerified: true },
            })
          : null

        session.user.role = currentUser?.role ?? (token.role as string) ?? "BUYER"
        session.user.emailVerified = !!currentUser?.emailVerified
      }
      return session
    },
  },

  secret: process.env.AUTH_SECRET,
}
