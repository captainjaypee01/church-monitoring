import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { users, profiles, userRoles } from "@/lib/db/schema"
import { isAdmin } from "@/lib/rbac"
import { eq, and, isNull, or } from "drizzle-orm"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.user || !isAdmin(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const excludeAssigned = searchParams.get('excludeAssigned') === 'true'
    const currentNetworkId = searchParams.get('currentNetworkId')

    // Build where conditions based on request parameters
    const whereConditions = [
      isNull(users.deletedAt),
      eq(profiles.isActive, true)
    ]

    if (excludeAssigned) {
      if (currentNetworkId) {
        // For edit mode: Show unassigned users OR users assigned to current network
        const networkCondition = or(
          isNull(userRoles.networkId),
          eq(userRoles.networkId, currentNetworkId)
        )
        if (networkCondition) {
          whereConditions.push(networkCondition)
        }
      } else {
        // For new mode: Only show unassigned users
        whereConditions.push(isNull(userRoles.networkId))
      }
    }

    // Get users who have NETWORK_LEADER role
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
      .where(and(...whereConditions))
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
