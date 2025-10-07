import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { canAssignMembersToNetwork, canAssignMembersToCell } from "@/lib/rbac"

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: userId } = await params
    const { networkId, cellId } = await request.json()

    if (!networkId || !cellId) {
      return NextResponse.json(
        { error: "Both networkId and cellId are required" },
        { status: 400 }
      )
    }

    // Check if user has permission to assign members
    const canAssignToNetwork = canAssignMembersToNetwork(session)
    const canAssignToCell = canAssignMembersToCell(session, cellId)

    if (!canAssignToNetwork || !canAssignToCell) {
      return NextResponse.json(
        { error: "Insufficient permissions to assign user" },
        { status: 403 }
      )
    }

    // Verify the target user exists
    const [targetUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Update user assignment
    await db
      .update(users)
      .set({
        networkId,
        cellId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))

    return NextResponse.json({ 
      success: true,
      message: "User assigned successfully" 
    })

  } catch (error) {
    console.error("Error assigning user:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
