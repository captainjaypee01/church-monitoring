"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { networks, userRoles, cells } from "@/lib/db/schema"
import { isAdmin } from "@/lib/rbac"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { eq, and, count } from "drizzle-orm"

const networkDataSchema = z.object({
  name: z.string().min(1, "Network name is required"),
  description: z.string().optional(),
  location: z.string().optional(),
  createdBy: z.string().min(1, "Creator ID is required"),
  networkLeader: z.string().optional(),
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
    if (validatedData.networkLeader && validatedData.networkLeader !== "none") {
      await db.insert(userRoles).values({
        userId: validatedData.networkLeader,
        role: "NETWORK_LEADER",
        networkId: newNetwork.id,
        cellId: null,
      })
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
    if (validatedData.networkLeader && validatedData.networkLeader !== "none") {
      // Remove existing network leader role for this network
      await db
        .delete(userRoles)
        .where(and(
          eq(userRoles.role, "NETWORK_LEADER"),
          eq(userRoles.networkId, networkId)
        ))

      // Add new network leader role
      await db.insert(userRoles).values({
        userId: validatedData.networkLeader,
        role: "NETWORK_LEADER",
        networkId: networkId,
        cellId: null,
      })
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
