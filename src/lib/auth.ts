import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
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
          console.log("🔐 Auth attempt with credentials:", { emailOrUsername: credentials?.emailOrUsername })
          
          const { emailOrUsername, password } = credentialsSchema.parse(credentials)
          console.log("✅ Credentials parsed successfully")

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

          console.log("🔍 Database query result:", { 
            found: !!user[0], 
            userId: user[0]?.id,
            email: user[0]?.email,
            username: user[0]?.username,
            hasPassword: !!user[0]?.hashedPassword,
            isActive: user[0]?.isActive
          })

          if (!user[0]) {
            console.log("❌ User not found")
            return null
          }

          if (!user[0].isActive) {
            console.log("❌ User is not active")
            return null
          }
          console.log("🔑 Password comparison details:", {
            plainPassword: password,
            plainPasswordLength: password.length,
            hashedPassword: user[0].hashedPassword.substring(0, 20) + "...",
            hashedPasswordLength: user[0].hashedPassword.length,
            hashedPasswordFull: user[0].hashedPassword
          })
          
          const isValidPassword = await bcrypt.compare(password, user[0].hashedPassword)
          console.log("🔑 Password validation result:", { isValid: isValidPassword })
          
          // Let's also test with a fresh hash of the same password
          const freshHash = await bcrypt.hash(password, 12)
          const freshTest = await bcrypt.compare(password, freshHash)
          console.log("🧪 Fresh hash test:", { 
            freshHashWorks: freshTest,
            freshHash: freshHash.substring(0, 20) + "..."
          })
          
          if (!isValidPassword) {
            console.log("❌ Invalid password")
            return null
          }

          console.log("✅ Authentication successful")
          return {
            id: user[0].id,
            email: user[0].email,
            name: user[0].name,
            image: user[0].avatarUrl,
          }
        } catch (error) {
          console.error("💥 Auth error:", error)
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
      
      // Always fetch fresh user data in JWT callback
      if (token.id) {
        const [userData] = await db
          .select({
            role: users.role,
            networkId: users.networkId,
            cellId: users.cellId,
            isNetworkLeader: users.isNetworkLeader,
            isCellLeader: users.isCellLeader,
          })
          .from(users)
          .where(eq(users.id, token.id as string))
          .limit(1)

        token.userData = userData
      }
      
      return token
    },
    async session({ session, token }) {
      if (token.id) {
        session.user.id = token.id as string
        session.userData = token.userData as any || null
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
    userData?: {
      role: "ADMIN" | "NETWORK_LEADER" | "CELL_LEADER" | "MEMBER"
      networkId: string | null
      cellId: string | null
      isNetworkLeader: boolean
      isCellLeader: boolean
    }
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
