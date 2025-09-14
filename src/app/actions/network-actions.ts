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
  networkLeader: z.string().optional().refine((val) => {
    if (!val || val === "none" || val === "") return true
    // Check if it's a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    return uuidRegex.test(val)
  }, "Invalid user ID format"),
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
      networkLeader: formData.get("networkLeader") as string,
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

    // Assign network leader if specified
    if (validatedData.networkLeader && validatedData.networkLeader !== "none" && validatedData.networkLeader !== "") {
      console.log("Assigning network leader:", validatedData.networkLeader, "to network:", newNetwork.id)
      
      // Remove any existing network leadership role for this user
      await db.delete(userRoles).where(and(
        eq(userRoles.userId, validatedData.networkLeader),
        eq(userRoles.role, "NETWORK_LEADER")
      ))

      // Create leadership role assignment
      await db.insert(userRoles).values({
        userId: validatedData.networkLeader,
        role: "NETWORK_LEADER",
        networkId: newNetwork.id,
        cellId: null,
      })

      // Also create/update membership record with leadership flag
      const [userProfile] = await db
        .select({ id: profiles.id })
        .from(profiles)
        .where(eq(profiles.userId, validatedData.networkLeader))
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
      
      console.log("Network leader assigned successfully")
    } else {
      console.log("No network leader assigned (value:", validatedData.networkLeader, ")")
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
      networkLeader: formData.get("networkLeader") as string,
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

    // Handle network leader assignment
    console.log("Processing network leader assignment:", validatedData.networkLeader)
    
    // First, remove any existing leadership memberships for this network
    await db.delete(memberships).where(and(
      eq(memberships.networkId, networkId),
      eq(memberships.leadershipScope, "NETWORK")
    ))
    
    // Remove existing network leader roles for this network
    await db.delete(userRoles).where(and(
      eq(userRoles.role, "NETWORK_LEADER"),
      eq(userRoles.networkId, networkId)
    ))
    
    if (validatedData.networkLeader && validatedData.networkLeader !== "none" && validatedData.networkLeader !== "") {
      console.log("Assigning new network leader:", validatedData.networkLeader, "to network:", networkId)
      
      // Add new network leader role
      await db.insert(userRoles).values({
        userId: validatedData.networkLeader,
        role: "NETWORK_LEADER",
        networkId: networkId,
        cellId: null,
      })

      // Also create/update membership record with leadership flag
      const [userProfile] = await db
        .select({ id: profiles.id })
        .from(profiles)
        .where(eq(profiles.userId, validatedData.networkLeader))
        .limit(1)

      if (userProfile) {
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
      
      console.log("Network leader updated successfully")
    } else {
      console.log("Removing network leader from network:", networkId)
      console.log("Network leader removed successfully")
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
