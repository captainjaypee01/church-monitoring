import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "@/lib/db"
import { users, userRoles } from "@/lib/db/schema"
import { eq, or } from "drizzle-orm"
import bcrypt from "bcryptjs"
import { z } from "zod"

const credentialsSchema = z.object({
  emailOrUsername: z.string().min(1),
  password: z.string().min(1),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        emailOrUsername: { label: "Email or Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const { emailOrUsername, password } = credentialsSchema.parse(credentials)

          const user = await db
            .select()
            .from(users)
            .where(
              or(
                eq(users.email, emailOrUsername.toLowerCase()),
                eq(users.username, emailOrUsername.toLowerCase())
              )
            )
            .limit(1)

          if (!user[0]) {
            return null
          }

          const isValidPassword = await bcrypt.compare(password, user[0].hashedPassword)
          if (!isValidPassword) {
            return null
          }

          return {
            id: user[0].id,
            email: user[0].email,
            name: user[0].name,
            image: user[0].avatarUrl,
          }
        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
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
      }
      
      // Always fetch fresh roles data in JWT callback
      if (token.id) {
        const roles = await db
          .select()
          .from(userRoles)
          .where(eq(userRoles.userId, token.id as string))

        token.roles = roles
      }
      
      return token
    },
    async session({ session, token }) {
      if (token.id) {
        session.user.id = token.id as string
        session.roles = token.roles as any || []
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
})

declare module "next-auth" {
  interface Session {
    user: {
      id?: string
      email?: string | null
      name?: string | null
      image?: string | null
    }
    roles?: Array<{
      id: string
      userId: string
      role: "ADMIN" | "NETWORK_LEADER" | "CELL_LEADER" | "MEMBER"
      networkId: string | null
      cellId: string | null
      createdAt: Date
    }>
  }

  interface User {
    id?: string
    email?: string | null
    name?: string | null
    image?: string | null
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string
    roles?: Array<{
      id: string
      userId: string
      role: "ADMIN" | "NETWORK_LEADER" | "CELL_LEADER" | "MEMBER"
      networkId: string | null
      cellId: string | null
      createdAt: Date
    }>
  }
}
