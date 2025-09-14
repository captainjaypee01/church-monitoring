"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { cells, users } from "@/lib/db/schema"
import { isAdmin } from "@/lib/rbac"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { eq, and } from "drizzle-orm"

const cellDataSchema = z.object({
  name: z.string().min(1, "Cell name is required"),
  description: z.string().optional(),
  networkId: z.string().min(1, "Network ID is required"),
  createdBy: z.string().min(1, "Creator ID is required"),
  meetingDay: z.string().optional(),
  meetingTime: z.string().optional(),
  cellLeaders: z.array(z.string()).optional(),
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
      createdBy: session.user.id,
      meetingDay: formData.get("meetingDay") as string,
      meetingTime: formData.get("meetingTime") as string,
      cellLeaders: formData.getAll("cellLeaders") as string[],
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
        createdBy: validatedData.createdBy,
        meetingDay: validatedData.meetingDay || null,
        meetingTime: validatedData.meetingTime || null,
      })
      .returning()

    // Assign cell leaders using simplified schema
    if (validatedData.cellLeaders && validatedData.cellLeaders.length > 0) {
      const leaderIds = validatedData.cellLeaders.filter(id => id && id.trim() !== "")
      
      for (const leaderId of leaderIds) {
        // Update user to be a cell leader and assign to this cell
        await db
          .update(users)
          .set({
            role: "CELL_LEADER",
            cellId: newCell.id,
            isCellLeader: true,
            updatedAt: new Date(),
          })
          .where(eq(users.id, leaderId))
      }
    }

    revalidatePath("/admin/networks")
    revalidatePath(`/admin/networks/${validatedData.networkId}`)
    return { success: true, cellId: newCell.id }
  } catch (error) {
    console.error("Cell creation error:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to create cell group" 
    }
  }
}

export async function updateCellAction(cellId: string, formData: FormData) {
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
      createdBy: session.user.id,
      meetingDay: formData.get("meetingDay") as string,
      meetingTime: formData.get("meetingTime") as string,
      cellLeaders: formData.getAll("cellLeaders") as string[],
    }

    // Validate data
    const validatedData = cellDataSchema.parse(data)

    // Update cell
    await db
      .update(cells)
      .set({
        name: validatedData.name,
        description: validatedData.description || null,
        meetingDay: validatedData.meetingDay || null,
        meetingTime: validatedData.meetingTime || null,
        updatedAt: new Date(),
      })
      .where(eq(cells.id, cellId))

    // Update cell leadership assignments
    // First, remove cell leadership from all users for this cell
    await db
      .update(users)
      .set({
        isCellLeader: false,
        cellId: null,
        updatedAt: new Date(),
      })
      .where(and(
        eq(users.cellId, cellId),
        eq(users.isCellLeader, true)
      ))

    // Then assign new cell leaders
    if (validatedData.cellLeaders && validatedData.cellLeaders.length > 0) {
      const leaderIds = validatedData.cellLeaders.filter(id => id && id.trim() !== "")
      
      for (const leaderId of leaderIds) {
        await db
          .update(users)
          .set({
            role: "CELL_LEADER",
            cellId: cellId,
            isCellLeader: true,
            updatedAt: new Date(),
          })
          .where(eq(users.id, leaderId))
      }
    }

    revalidatePath("/admin/networks")
    revalidatePath(`/admin/networks/${validatedData.networkId}`)
    revalidatePath(`/admin/networks/${validatedData.networkId}/cells/${cellId}`)
    return { success: true }
  } catch (error) {
    console.error("Cell update error:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to update cell group" 
    }
  }
}

export async function deleteCellAction(cellId: string) {
  try {
    const session = await auth()
    
    if (!session?.user || !isAdmin(session)) {
      return { success: false, error: "Unauthorized" }
    }

    // Get cell info for revalidation
    const [cell] = await db
      .select({ networkId: cells.networkId })
      .from(cells)
      .where(eq(cells.id, cellId))
      .limit(1)

    if (!cell) {
      return { success: false, error: "Cell group not found" }
    }

    // Remove cell leadership assignments
    await db
      .update(users)
      .set({
        isCellLeader: false,
        cellId: null,
        updatedAt: new Date(),
      })
      .where(and(
        eq(users.cellId, cellId),
        eq(users.isCellLeader, true)
      ))

    // Delete cell
    await db.delete(cells).where(eq(cells.id, cellId))

    revalidatePath("/admin/networks")
    revalidatePath(`/admin/networks/${cell.networkId}`)
    return { success: true }
  } catch (error) {
    console.error("Cell deletion error:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to delete cell group" 
    }
  }
}

export async function removeCellLeaderAction(cellId: string, userId: string) {
  try {
    const session = await auth()
    
    if (!session?.user || !isAdmin(session)) {
      return { success: false, error: "Unauthorized" }
    }

    // Remove cell leadership from user
    await db
      .update(users)
      .set({
        isCellLeader: false,
        cellId: null,
        role: "MEMBER", // Reset to member role
        updatedAt: new Date(),
      })
      .where(and(
        eq(users.id, userId),
        eq(users.cellId, cellId)
      ))

    // Get cell network ID for revalidation
    const [cell] = await db
      .select({ networkId: cells.networkId })
      .from(cells)
      .where(eq(cells.id, cellId))
      .limit(1)

    if (cell) {
      revalidatePath("/admin/networks")
      revalidatePath(`/admin/networks/${cell.networkId}`)
      revalidatePath(`/admin/networks/${cell.networkId}/cells/${cellId}`)
    }

    return { success: true }
  } catch (error) {
    console.error("Remove cell leader error:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to remove cell leader" 
    }
  }
}