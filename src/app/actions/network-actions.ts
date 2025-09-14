"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { networks, userRoles, cells, memberships, profiles } from "@/lib/db/schema"
import { isAdmin } from "@/lib/rbac"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { eq, and, count } from "drizzle-orm"

const networkDataSchema = z.object({
  name: z.string().min(1, "Network name is required"),
  description: z.string().optional(),
  location: z.string().optional(),
  createdBy: z.string().min(1, "Creator ID is required"),
  networkLeaders: z.array(z.string()).optional(),
})

export async function createNetworkAction(formData: FormData) {
  try {
    const session = await auth()
    
    if (!session?.user || !isAdmin(session)) {
      return { success: false, error: "Unauthorized" }
    }

    // Parse form data
    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      location: formData.get("location") as string,
      createdBy: formData.get("createdBy") as string,
      networkLeaders: formData.getAll("networkLeaders") as string[],
    }

    console.log("Network creation data:", data)

    // Validate data
    const validatedData = networkDataSchema.parse(data)

    // Create network
    const [newNetwork] = await db
      .insert(networks)
      .values({
        name: validatedData.name,
        description: validatedData.description || null,
        location: validatedData.location || null,
        createdBy: validatedData.createdBy,
      })
      .returning()

    // Assign network leaders if specified
    if (validatedData.networkLeaders && validatedData.networkLeaders.length > 0) {
      console.log("Assigning network leaders:", validatedData.networkLeaders, "to network:", newNetwork.id)
      
      for (const leaderId of validatedData.networkLeaders) {
        if (!leaderId || leaderId === "none" || leaderId === "") continue
        
        console.log("Processing leader:", leaderId)
        
        // Handle existing NETWORK_LEADER roles for this user
        const existingRoles = await db
          .select()
          .from(userRoles)
          .where(and(
            eq(userRoles.userId, leaderId),
            eq(userRoles.role, "NETWORK_LEADER")
          ))

        if (existingRoles.length > 0) {
          // Delete all existing NETWORK_LEADER roles for this user
          await db.delete(userRoles)
            .where(and(
              eq(userRoles.userId, leaderId),
              eq(userRoles.role, "NETWORK_LEADER")
            ))
          
          console.log(`Cleaned up ${existingRoles.length} existing NETWORK_LEADER roles for user ${leaderId}`)
        }

        // Create a single new role with network assignment
        await db.insert(userRoles).values({
          userId: leaderId,
          role: "NETWORK_LEADER",
          networkId: newNetwork.id,
          cellId: null,
        })

        // Also create/update membership record with leadership flag
        const [userProfile] = await db
          .select({ id: profiles.id })
          .from(profiles)
          .where(eq(profiles.userId, leaderId))
          .limit(1)

        if (userProfile) {
          // Remove existing membership for this network
          await db.delete(memberships).where(and(
            eq(memberships.profileId, userProfile.id),
            eq(memberships.networkId, newNetwork.id)
          ))

          // Create new membership with leadership
          await db.insert(memberships).values({
            profileId: userProfile.id,
            networkId: newNetwork.id,
            cellId: null,
            membershipType: "LEADER",
            leadershipScope: "NETWORK",
            status: "ACTIVE",
            joinedAt: new Date(),
          })
        }
        
        console.log("Network leader assigned successfully:", leaderId)
      }
    } else {
      console.log("No network leaders assigned")
    }

    revalidatePath("/admin/networks")
    return { success: true, networkId: newNetwork.id }
  } catch (error) {
    console.error("Network creation error:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to create network" 
    }
  }
}

export async function updateNetworkAction(networkId: string, formData: FormData) {
  try {
    const session = await auth()
    
    if (!session?.user || !isAdmin(session)) {
      return { success: false, error: "Unauthorized" }
    }

    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      location: formData.get("location") as string,
      networkLeaders: formData.getAll("networkLeaders") as string[],
    }

    console.log("Network update data:", data)

    const validatedData = networkDataSchema.parse({
      ...data,
      createdBy: session.user.id!,
    })

    // Update network
    await db
      .update(networks)
      .set({
        name: validatedData.name,
        description: validatedData.description || null,
        location: validatedData.location || null,
        updatedAt: new Date(),
      })
      .where(eq(networks.id, networkId))

    // Handle network leader assignment (support multiple leaders)
    console.log("Processing network leaders assignment:", validatedData.networkLeaders)
    
    // First, remove ALL current network leaders for this network
    await db.delete(userRoles).where(and(
      eq(userRoles.role, "NETWORK_LEADER"),
      eq(userRoles.networkId, networkId)
    ))
    
    // Also remove leadership memberships for this network
    await db.delete(memberships).where(and(
      eq(memberships.networkId, networkId),
      eq(memberships.membershipType, "LEADER"),
      eq(memberships.leadershipScope, "NETWORK")
    ))
    
    console.log("Cleared existing network leadership assignments")
    
    // Assign new network leaders if specified
    if (validatedData.networkLeaders && validatedData.networkLeaders.length > 0) {
      console.log("Assigning new network leaders:", validatedData.networkLeaders)
      
      for (const leaderId of validatedData.networkLeaders) {
        if (!leaderId || leaderId === "none" || leaderId === "") continue
        
        console.log("Processing leader:", leaderId)
        
        // Handle existing NETWORK_LEADER roles for this user (from other networks)
        const existingRoles = await db
          .select()
          .from(userRoles)
          .where(and(
            eq(userRoles.userId, leaderId),
            eq(userRoles.role, "NETWORK_LEADER")
          ))

        if (existingRoles.length > 0) {
          // Delete all existing NETWORK_LEADER roles for this user
          await db.delete(userRoles)
            .where(and(
              eq(userRoles.userId, leaderId),
              eq(userRoles.role, "NETWORK_LEADER")
            ))
          
          console.log(`Cleaned up ${existingRoles.length} existing NETWORK_LEADER roles for user ${leaderId}`)
        }

        // Create a single new role with network assignment
        await db.insert(userRoles).values({
          userId: leaderId,
          role: "NETWORK_LEADER",
          networkId: networkId,
          cellId: null,
        })

        // Also create/update membership record with leadership flag
        const [userProfile] = await db
          .select({ id: profiles.id })
          .from(profiles)
          .where(eq(profiles.userId, leaderId))
          .limit(1)

        if (userProfile) {
          // Remove existing membership for this network
          await db.delete(memberships).where(and(
            eq(memberships.profileId, userProfile.id),
            eq(memberships.networkId, networkId)
          ))

          // Create new membership with leadership
          await db.insert(memberships).values({
            profileId: userProfile.id,
            networkId: networkId,
            cellId: null,
            membershipType: "LEADER",
            leadershipScope: "NETWORK",
            status: "ACTIVE",
            joinedAt: new Date(),
          })
        }
        
        console.log("Network leader assigned successfully:", leaderId)
      }
    } else {
      console.log("No network leaders assigned")
    }

    revalidatePath("/admin/networks")
    revalidatePath(`/admin/networks/${networkId}`)
    return { success: true }
  } catch (error) {
    console.error("Network update error:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to update network" 
    }
  }
}

export async function removeNetworkLeaderAction(networkId: string, userId: string) {
  try {
    const session = await auth()
    
    if (!session?.user || !isAdmin(session)) {
      return { success: false, error: "Unauthorized" }
    }

    // Remove network leader role
    await db.delete(userRoles).where(and(
      eq(userRoles.userId, userId),
      eq(userRoles.role, "NETWORK_LEADER"),
      eq(userRoles.networkId, networkId)
    ))

    // Remove leadership membership
    const [userProfile] = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1)

    if (userProfile) {
      await db.delete(memberships).where(and(
        eq(memberships.profileId, userProfile.id),
        eq(memberships.networkId, networkId),
        eq(memberships.leadershipScope, "NETWORK")
      ))
    }

    revalidatePath("/admin/networks")
    revalidatePath(`/admin/networks/${networkId}`)
    return { success: true }
  } catch (error) {
    console.error("Remove network leader error:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to remove network leader" 
    }
  }
}

export async function deleteNetworkAction(networkId: string) {
  try {
    const session = await auth()
    
    if (!session?.user || !isAdmin(session)) {
      return { success: false, error: "Unauthorized" }
    }

    // Check if network has cells
    const [networkCells] = await db
      .select({ count: count() })
      .from(cells)
      .where(eq(cells.networkId, networkId))

    if (networkCells.count > 0) {
      return { 
        success: false, 
        error: "Cannot delete network with existing cell groups. Please remove all cells first." 
      }
    }

    // Remove network leader roles
    await db
      .delete(userRoles)
      .where(and(
        eq(userRoles.role, "NETWORK_LEADER"),
        eq(userRoles.networkId, networkId)
      ))

    // Delete network
    await db
      .delete(networks)
      .where(eq(networks.id, networkId))

    revalidatePath("/admin/networks")
    return { success: true }
  } catch (error) {
    console.error("Network deletion error:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to delete network" 
    }
  }
}
