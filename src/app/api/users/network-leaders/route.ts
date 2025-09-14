import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { NextResponse } from "next/server"
import { eq, or, isNull, and } from "drizzle-orm"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const excludeAssigned = searchParams.get("excludeAssigned") === "true"
    const currentNetworkId = searchParams.get("currentNetworkId")

    let whereCondition

    if (excludeAssigned) {
      if (currentNetworkId) {
        // Edit mode: show unassigned users OR users assigned to current network
        whereCondition = and(
          or(
            eq(users.role, "NETWORK_LEADER"),
            eq(users.role, "ADMIN")
          ),
          or(
            isNull(users.networkId), // Unassigned users
            eq(users.networkId, currentNetworkId) // Users assigned to current network
          ),
          eq(users.isActive, true),
          isNull(users.deletedAt)
        )
      } else {
        // New mode: only show unassigned users
        whereCondition = and(
          or(
            eq(users.role, "NETWORK_LEADER"),
            eq(users.role, "ADMIN")
          ),
          isNull(users.networkId), // Only unassigned users
          eq(users.isActive, true),
          isNull(users.deletedAt)
        )
      }
    } else {
      // Show all potential network leaders
      whereCondition = and(
        or(
          eq(users.role, "NETWORK_LEADER"),
          eq(users.role, "ADMIN")
        ),
        eq(users.isActive, true),
        isNull(users.deletedAt)
      )
    }

    const potentialLeaders = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        role: users.role,
        networkId: users.networkId,
        isNetworkLeader: users.isNetworkLeader,
      })
      .from(users)
      .where(whereCondition)
      .orderBy(users.fullName)

    // Deduplicate by user ID to prevent React key issues
    const uniqueLeaders = potentialLeaders.reduce((acc: any[], leader) => {
      if (!acc.find(existing => existing.id === leader.id)) {
        acc.push(leader)
      }
      return acc
    }, [])

    return NextResponse.json(uniqueLeaders)
  } catch (error) {
    console.error("Error fetching network leaders:", error)
    return NextResponse.json(
      { error: "Failed to fetch network leaders" },
      { status: 500 }
    )
  }
}