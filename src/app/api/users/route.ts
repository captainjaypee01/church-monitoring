import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.userData) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, fullName, email, phone, role, networkId, cellId, hashedPassword } = body

    // Validate required fields
    if (!name || !fullName || !email || !networkId || !cellId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      )
    }

    // Hash password
    const saltRounds = 12
    const hashedPwd = await bcrypt.hash(hashedPassword, saltRounds)

    // Create new user
    const newUserResult = await db
      .insert(users)
      .values({
        name,
        fullName,
        email,
        phone: phone || null,
        role: role || "MEMBER",
        networkId,
        cellId,
        hashedPassword: hashedPwd,
        isActive: true,
        isCellLeader: role === "CELL_LEADER",
        isNetworkLeader: false,
        isAdmin: false,
        joinedAt: new Date(),
      })
      .returning()

    const newUser = Array.isArray(newUserResult) ? newUserResult[0] : newUserResult

    return NextResponse.json(
      { 
        message: "User created successfully", 
        user: newUser 
      },
      { status: 201 }
    )

  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
