import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import { getUserPermissions } from "@/lib/rbac"

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const permissions = getUserPermissions(session)

    return NextResponse.json({
      user: session.user,
      permissions,
    })
  } catch (error) {
    console.error("Error fetching current user:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
