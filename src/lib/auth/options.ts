import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
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
        console.log("Authorize called with credentials:", credentials)
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
        console.log("JWT callback called with token:", token, "and user:", user, 'from options file')
      if (user) {
        token.id = user.id
      }
      return token
    },

    async session({ session,user, token }) {
      console.log("Session callback called with session:", session, "and token:", token, 'from options file')
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },

  secret: process.env.AUTH_SECRET,
}