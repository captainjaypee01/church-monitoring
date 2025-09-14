import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { users, profiles, userRoles } from "@/lib/db/schema"
import { isAdmin } from "@/lib/rbac"
import { eq, and } from "drizzle-orm"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user || !isAdmin(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get users who have CELL_LEADER role or no specific role (eligible for assignment)
    const cellLeaders = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        fullName: profiles.fullName,
        currentRole: userRoles.role,
        cellId: userRoles.cellId,
      })
      .from(users)
      .leftJoin(profiles, eq(users.id, profiles.userId))
      .leftJoin(userRoles, and(
        eq(users.id, userRoles.userId),
        eq(userRoles.role, "CELL_LEADER")
      ))
      .orderBy(users.email)

    return NextResponse.json({ users: cellLeaders })
  } catch (error) {
    console.error("Error fetching cell leaders:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
