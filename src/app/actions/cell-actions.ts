"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { cells, userRoles, roles, profiles, cellMemberships } from "@/lib/db/schema"
import { isAdmin } from "@/lib/rbac"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { eq, and, count } from "drizzle-orm"

const cellDataSchema = z.object({
  name: z.string().min(1, "Cell name is required"),
  description: z.string().optional(),
  networkId: z.string().min(1, "Network ID is required"),
  createdBy: z.string().min(1, "Creator ID is required"),
  cellLeader: z.string().optional(),
})

export async function createCellAction(formData: FormData) {
  try {
    const session = await auth()
    
    if (!session?.user || !isAdmin(session)) {
      return { success: false, error: "Unauthorized" }
    }

    // Parse form data
    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      networkId: formData.get("networkId") as string,
      createdBy: formData.get("createdBy") as string,
      cellLeader: formData.get("cellLeader") as string,
    }

    // Validate data
    const validatedData = cellDataSchema.parse(data)

    // Create cell
    const [newCell] = await db
      .insert(cells)
      .values({
        name: validatedData.name,
        description: validatedData.description || null,
        networkId: validatedData.networkId,
        leaderId: validatedData.cellLeader !== "none" ? validatedData.cellLeader : null,
        createdBy: validatedData.createdBy,
      })
      .returning()

    // Assign cell leader if specified
    if (validatedData.cellLeader && validatedData.cellLeader !== "none") {
      // Get the CELL_LEADER role
      const [cellLeaderRole] = await db
        .select()
        .from(roles)
        .where(eq(roles.name, "CELL_LEADER"))
        .limit(1)

      if (cellLeaderRole) {
        await db.insert(userRoles).values({
          userId: validatedData.cellLeader,
          role: "CELL_LEADER",
          networkId: validatedData.networkId,
          cellId: newCell.id,
        })
      }
    }

    revalidatePath(`/admin/networks/${validatedData.networkId}`)
    revalidatePath("/admin/networks")
    return { success: true, cellId: newCell.id }
  } catch (error) {
    console.error("Cell creation error:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to create cell" 
    }
  }
}

export async function updateCellAction(cellId: string, formData: FormData) {
  try {
    const session = await auth()
    
    if (!session?.user || !isAdmin(session)) {
      return { success: false, error: "Unauthorized" }
    }

    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      cellLeader: formData.get("cellLeader") as string,
    }

    const validatedData = cellDataSchema.parse({
      ...data,
      networkId: "dummy", // Not used in update
      createdBy: session.user.id!,
    })

    // Update cell
    await db
      .update(cells)
      .set({
        name: validatedData.name,
        description: validatedData.description || null,
        leaderId: validatedData.cellLeader !== "none" ? validatedData.cellLeader : null,
        updatedAt: new Date(),
      })
      .where(eq(cells.id, cellId))

    // Handle cell leader assignment
    if (validatedData.cellLeader && validatedData.cellLeader !== "none") {
      // Remove existing cell leader role for this cell
      await db
        .delete(userRoles)
        .where(and(
          eq(userRoles.role, "CELL_LEADER"),
          eq(userRoles.cellId, cellId)
        ))

      // Get the cell's network ID
      const [cell] = await db
        .select({ networkId: cells.networkId })
        .from(cells)
        .where(eq(cells.id, cellId))
        .limit(1)

      if (cell) {
        // Add new cell leader role
        await db.insert(userRoles).values({
          userId: validatedData.cellLeader,
          role: "CELL_LEADER",
          networkId: cell.networkId,
          cellId: cellId,
        })
      }
    }

    revalidatePath(`/admin/networks`)
    revalidatePath(`/admin/networks/${cellId}`)
    return { success: true }
  } catch (error) {
    console.error("Cell update error:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to update cell" 
    }
  }
}

export async function deleteCellAction(cellId: string) {
  try {
    const session = await auth()
    
    if (!session?.user || !isAdmin(session)) {
      return { success: false, error: "Unauthorized" }
    }

    // Check if cell has members
    const [cellMembers] = await db
      .select({ count: count() })
      .from(cellMemberships)
      .where(eq(cellMemberships.cellId, cellId))

    if (cellMembers.count > 0) {
      return { 
        success: false, 
        error: "Cannot delete cell group with existing members. Please remove all members first." 
      }
    }

    // Remove cell leader roles
    await db
      .delete(userRoles)
      .where(and(
        eq(userRoles.role, "CELL_LEADER"),
        eq(userRoles.cellId, cellId)
      ))

    // Delete cell
    await db
      .delete(cells)
      .where(eq(cells.id, cellId))

    revalidatePath("/admin/networks")
    return { success: true }
  } catch (error) {
    console.error("Cell deletion error:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to delete cell" 
    }
  }
}
