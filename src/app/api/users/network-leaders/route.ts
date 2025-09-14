import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { users, profiles, userRoles } from "@/lib/db/schema"
import { isAdmin } from "@/lib/rbac"
import { eq, and, isNull } from "drizzle-orm"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user || !isAdmin(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all active users (eligible for network leader assignment)
    const networkLeaders = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        fullName: profiles.fullName,
        currentRole: userRoles.role,
        networkId: userRoles.networkId,
      })
      .from(users)
      .leftJoin(profiles, eq(users.id, profiles.userId))
      .leftJoin(userRoles, eq(users.id, userRoles.userId))
      .where(and(
        isNull(users.deletedAt),
        eq(profiles.isActive, true)
      ))
      .orderBy(users.email)

    return NextResponse.json({ users: networkLeaders })
  } catch (error) {
    console.error("Error fetching network leaders:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
