import { db } from "../src/lib/db"
import { users } from "../src/lib/db/schema"

async function checkUsers() {
  console.log("🔍 Checking users in database...")
  
  try {
    const allUsers = await db.select().from(users)
    console.log(`📊 Found ${allUsers.length} users`)
    
    allUsers.forEach(user => {
      console.log("👤 User:", {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.role,
        hasPassword: !!user.hashedPassword,
        isActive: user.isActive
      })
    })
    
    if (allUsers.length === 0) {
      console.log("❌ No users found! Creating admin user...")
      
      const bcrypt = await import("bcryptjs")
      const hashedPassword = await bcrypt.hash("password", 12)
      
      await db.insert(users).values({
        email: "admin@church.com",
        username: "admin",
        hashedPassword,
        name: "Administrator",
        firstName: "System",
        lastName: "Administrator",
        fullName: "System Administrator",
        role: "ADMIN",
        isActive: true,
      })
      
      console.log("✅ Admin user created!")
    }
  } catch (error) {
    console.error("❌ Error:", error)
  }
  
  process.exit(0)
}

checkUsers()
