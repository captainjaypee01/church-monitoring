import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq, or } from "drizzle-orm"
import bcrypt from "bcryptjs"

export async function GET() {
  try {
    console.log("🔄 Resetting admin password (GET version)...")
    
    // Find admin user
    const [adminUser] = await db
      .select()
      .from(users)
      .where(
        or(
          eq(users.email, "admin@church.com"),
          eq(users.username, "admin")
        )
      )
      .limit(1)
    
    if (!adminUser) {
      console.log("❌ Admin user not found, creating new one...")
      
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
      
      console.log("✅ New admin user created")
      return NextResponse.json({
        message: "New admin user created",
        credentials: { username: "admin", email: "admin@church.com", password: "password" }
      })
    }
    
    console.log("🔍 Found admin user:", {
      id: adminUser.id,
      email: adminUser.email,
      username: adminUser.username,
      role: adminUser.role
    })
    
    // Reset password to "password"
    const newHashedPassword = await bcrypt.hash("password", 12)
    
    await db
      .update(users)
      .set({
        hashedPassword: newHashedPassword,
        isActive: true,
        updatedAt: new Date()
      })
      .where(eq(users.id, adminUser.id))
    
    // Test the new password
    const isValidPassword = await bcrypt.compare("password", newHashedPassword)
    console.log("🔑 Password test:", { isValid: isValidPassword })
    
    console.log("✅ Admin password reset successfully")
    
    return NextResponse.json({
      message: "Admin password reset successfully",
      credentials: { 
        username: "admin", 
        email: "admin@church.com", 
        password: "password" 
      },
      passwordTest: isValidPassword
    })
    
  } catch (error) {
    console.error("💥 Password reset error:", error)
    return NextResponse.json(
      { error: "Password reset failed", details: error.message },
      { status: 500 }
    )
  }
}
