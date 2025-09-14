import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import bcrypt from "bcryptjs"

export async function GET() {
  try {
    console.log("🔍 Testing database connection...")
    
    // Check if users table exists and get all users
    const allUsers = await db.select().from(users)
    console.log("📊 Found users:", allUsers.length)
    
    // If no users, create admin user
    if (allUsers.length === 0) {
      console.log("❌ No users found, creating admin user...")
      
      const hashedPassword = await bcrypt.hash("password", 12)
      
      const [newUser] = await db.insert(users).values({
        email: "admin@church.com",
        username: "admin",
        hashedPassword,
        name: "Administrator",
        firstName: "System",
        lastName: "Administrator",
        fullName: "System Administrator",
        role: "ADMIN",
        isActive: true,
        isNetworkLeader: false,
        isCellLeader: false,
      }).returning()
      
      console.log("✅ Admin user created:", newUser.id)
      
      return NextResponse.json({
        message: "Admin user created",
        user: {
          id: newUser.id,
          email: newUser.email,
          username: newUser.username,
          role: newUser.role
        }
      })
    }
    
    // Return existing users (without passwords)
    const safeUsers = allUsers.map(user => ({
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      hasPassword: !!user.hashedPassword
    }))
    
    return NextResponse.json({
      message: "Users found",
      users: safeUsers
    })
    
  } catch (error) {
    console.error("💥 Database test error:", error)
    return NextResponse.json(
      { error: "Database test failed", details: error.message },
      { status: 500 }
    )
  }
}
