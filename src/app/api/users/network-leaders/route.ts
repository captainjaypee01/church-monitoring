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

    // Get users who have NETWORK_LEADER role (eligible for network leader assignment)
    const networkLeadersRaw = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        fullName: profiles.fullName,
        currentRole: userRoles.role,
        networkId: userRoles.networkId,
      })
      .from(users)
      .innerJoin(profiles, eq(users.id, profiles.userId))
      .innerJoin(userRoles, and(
        eq(users.id, userRoles.userId),
        eq(userRoles.role, "NETWORK_LEADER")
      ))
      .where(and(
        isNull(users.deletedAt),
        eq(profiles.isActive, true)
      ))
      .orderBy(users.email)

    // Deduplicate users by ID (in case they have multiple NETWORK_LEADER roles)
    const uniqueNetworkLeaders = networkLeadersRaw.reduce((acc, current) => {
      const existingUser = acc.find(user => user.id === current.id)
      if (!existingUser) {
        acc.push(current)
      }
      return acc
    }, [] as typeof networkLeadersRaw)

    return NextResponse.json({ users: uniqueNetworkLeaders })
  } catch (error) {
    console.error("Error fetching network leaders:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
