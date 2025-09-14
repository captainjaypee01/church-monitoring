"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { networks, users, cells } from "@/lib/db/schema"
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
      createdBy: session.user.id,
      networkLeaders: formData.getAll("networkLeaders") as string[],
    }

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

    // Assign network leaders using simplified schema
    if (validatedData.networkLeaders && validatedData.networkLeaders.length > 0) {
      // Filter out empty values
      const leaderIds = validatedData.networkLeaders.filter(id => id && id.trim() !== "")
      
      for (const leaderId of leaderIds) {
        // Update user to be a network leader and assign to this network
        await db
          .update(users)
          .set({
            role: "NETWORK_LEADER",
            networkId: newNetwork.id,
            isNetworkLeader: true,
            updatedAt: new Date(),
          })
          .where(eq(users.id, leaderId))
      }
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

    // Parse form data
    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      location: formData.get("location") as string,
      createdBy: session.user.id,
      networkLeaders: formData.getAll("networkLeaders") as string[],
    }

    // Validate data (except createdBy since it's not changing)
    const validatedData = networkDataSchema.parse(data)

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

    // Update network leadership assignments
    // First, remove network leadership from all users for this network
    await db
      .update(users)
      .set({
        isNetworkLeader: false,
        networkId: null,
        updatedAt: new Date(),
      })
      .where(and(
        eq(users.networkId, networkId),
        eq(users.isNetworkLeader, true)
      ))

    // Then assign new network leaders
    if (validatedData.networkLeaders && validatedData.networkLeaders.length > 0) {
      const leaderIds = validatedData.networkLeaders.filter(id => id && id.trim() !== "")
      
      for (const leaderId of leaderIds) {
        await db
          .update(users)
          .set({
            role: "NETWORK_LEADER",
            networkId: networkId,
            isNetworkLeader: true,
            updatedAt: new Date(),
          })
          .where(eq(users.id, leaderId))
      }
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
    const [cellsCount] = await db
      .select({ count: count() })
      .from(cells)
      .where(eq(cells.networkId, networkId))

    if (cellsCount.count > 0) {
      return { 
        success: false, 
        error: "Cannot delete network with existing cell groups. Delete all cell groups first." 
      }
    }

    // Remove network leadership assignments
    await db
      .update(users)
      .set({
        isNetworkLeader: false,
        networkId: null,
        updatedAt: new Date(),
      })
      .where(and(
        eq(users.networkId, networkId),
        eq(users.isNetworkLeader, true)
      ))

    // Delete network
    await db.delete(networks).where(eq(networks.id, networkId))

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

export async function removeNetworkLeaderAction(networkId: string, userId: string) {
  try {
    const session = await auth()
    
    if (!session?.user || !isAdmin(session)) {
      return { success: false, error: "Unauthorized" }
    }

    // Remove network leadership from user
    await db
      .update(users)
      .set({
        isNetworkLeader: false,
        networkId: null,
        role: "MEMBER", // Reset to member role
        updatedAt: new Date(),
      })
      .where(and(
        eq(users.id, userId),
        eq(users.networkId, networkId)
      ))

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