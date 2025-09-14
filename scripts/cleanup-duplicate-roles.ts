import { config } from "dotenv"
import { resolve } from "path"

// Load environment variables from .env.local
config({ path: resolve(__dirname, "../.env.local") })

import { db } from "../src/lib/db"
import { userRoles } from "../src/lib/db/schema"
import { sql, eq, and } from "drizzle-orm"

async function cleanupDuplicateRoles() {
  console.log("🔍 Searching for duplicate user roles...")

  // Find users with duplicate roles of the same type
  const duplicates = await db.execute(sql`
    SELECT 
      user_id,
      role,
      COUNT(*) as count,
      ARRAY_AGG(id ORDER BY created_at) as role_ids,
      ARRAY_AGG(network_id) as network_ids,
      ARRAY_AGG(cell_id) as cell_ids
    FROM user_roles 
    GROUP BY user_id, role 
    HAVING COUNT(*) > 1
    ORDER BY user_id, role
  `)

  console.log(`Found ${duplicates.length} users with duplicate roles:`)
  
  for (const duplicate of duplicates) {
    const { user_id, role, count, role_ids, network_ids, cell_ids } = duplicate
    console.log(`\n👤 User ${user_id} - Role: ${role} (${count} duplicates)`)
    console.log(`   Role IDs: ${role_ids}`)
    console.log(`   Network IDs: ${network_ids}`)
    console.log(`   Cell IDs: ${cell_ids}`)

    // Keep the most recent assignment (last in array) and delete the rest
    const idsToDelete = role_ids.slice(0, -1) // All except the last one
    const keepId = role_ids[role_ids.length - 1] // Keep the last one
    
    console.log(`   🗑️  Deleting role IDs: ${idsToDelete}`)
    console.log(`   ✅ Keeping role ID: ${keepId}`)

    // Delete the duplicate roles
    for (const idToDelete of idsToDelete) {
      await db.delete(userRoles).where(eq(userRoles.id, idToDelete))
      console.log(`   ❌ Deleted role ID: ${idToDelete}`)
    }
  }

  console.log("\n✅ Cleanup completed!")
  
  // Verify cleanup
  const remainingDuplicates = await db.execute(sql`
    SELECT 
      user_id,
      role,
      COUNT(*) as count
    FROM user_roles 
    GROUP BY user_id, role 
    HAVING COUNT(*) > 1
  `)

  if (remainingDuplicates.length === 0) {
    console.log("🎉 No duplicate roles found - cleanup successful!")
  } else {
    console.log(`⚠️  ${remainingDuplicates.length} duplicate roles still exist`)
  }
}

// Run the cleanup
cleanupDuplicateRoles()
  .then(() => {
    console.log("Script completed")
    process.exit(0)
  })
  .catch((error) => {
    console.error("Error running cleanup:", error)
    process.exit(1)
  })
