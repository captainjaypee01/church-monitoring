"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { cells, userRoles } from "@/lib/db/schema"
import { isAdmin } from "@/lib/rbac"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { eq, and } from "drizzle-orm"

const cellDataSchema = z.object({
  name: z.string().min(1, "Cell name is required"),
  description: z.string().optional(),
  location: z.string().optional(),
  networkId: z.string().min(1, "Network ID is required"),
  cellLeader: z.string().optional().refine((val) => {
    if (!val || val === "none" || val === "") return true
    // Check if it's a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    return uuidRegex.test(val)
  }, "Invalid user ID format"),
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
      location: formData.get("location") as string,
      networkId: formData.get("networkId") as string,
      cellLeader: formData.get("cellLeader") as string,
    }

    console.log("Cell creation data:", data)

    // Validate data
    const validatedData = cellDataSchema.parse(data)

    // Create cell
    const [newCell] = await db
      .insert(cells)
      .values({
        name: validatedData.name,
        description: validatedData.description || null,
        location: validatedData.location || null,
        networkId: validatedData.networkId,
        createdBy: session.user.id!,
      })
      .returning()

    // Assign cell leader if specified
    if (validatedData.cellLeader && validatedData.cellLeader !== "none" && validatedData.cellLeader !== "") {
      console.log("Assigning cell leader:", validatedData.cellLeader, "to cell:", newCell.id)
      
      // Remove any existing cell leader role for this user
      await db
        .delete(userRoles)
        .where(and(
          eq(userRoles.userId, validatedData.cellLeader),
          eq(userRoles.role, "CELL_LEADER")
        ))

      // Add new cell leader role
      await db.insert(userRoles).values({
        userId: validatedData.cellLeader,
        role: "CELL_LEADER",
        networkId: validatedData.networkId,
        cellId: newCell.id,
      })
      console.log("Cell leader assigned successfully")
    } else {
      console.log("No cell leader assigned (value:", validatedData.cellLeader, ")")
    }

    revalidatePath("/admin/networks")
    revalidatePath(`/admin/networks/${validatedData.networkId}`)
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
      location: formData.get("location") as string,
      networkId: formData.get("networkId") as string,
      cellLeader: formData.get("cellLeader") as string,
    }

    console.log("Cell update data:", data)

    const validatedData = cellDataSchema.parse(data)

    // Update cell
    await db
      .update(cells)
      .set({
        name: validatedData.name,
        description: validatedData.description || null,
        location: validatedData.location || null,
        updatedAt: new Date(),
      })
      .where(eq(cells.id, cellId))

    // Handle cell leader assignment
    console.log("Processing cell leader assignment:", validatedData.cellLeader)
    if (validatedData.cellLeader && validatedData.cellLeader !== "none" && validatedData.cellLeader !== "") {
      console.log("Assigning new cell leader:", validatedData.cellLeader, "to cell:", cellId)
      
      // Remove existing cell leader role for this cell
      await db
        .delete(userRoles)
        .where(and(
          eq(userRoles.role, "CELL_LEADER"),
          eq(userRoles.cellId, cellId)
        ))

      // Add new cell leader role
      await db.insert(userRoles).values({
        userId: validatedData.cellLeader,
        role: "CELL_LEADER",
        networkId: validatedData.networkId,
        cellId: cellId,
      })
      console.log("Cell leader updated successfully")
    } else if (validatedData.cellLeader === "none" || validatedData.cellLeader === "") {
      console.log("Removing cell leader from cell:", cellId)
      // Remove existing cell leader role for this cell if "none" is selected
      await db
        .delete(userRoles)
        .where(and(
          eq(userRoles.role, "CELL_LEADER"),
          eq(userRoles.cellId, cellId)
        ))
      console.log("Cell leader removed successfully")
    }

    revalidatePath("/admin/networks")
    revalidatePath(`/admin/networks/${validatedData.networkId}`)
    revalidatePath(`/admin/networks/${validatedData.networkId}/cells/${cellId}`)
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

    // Get cell info for revalidation
    const [cell] = await db
      .select({ networkId: cells.networkId })
      .from(cells)
      .where(eq(cells.id, cellId))
      .limit(1)

    if (!cell) {
      return { success: false, error: "Cell not found" }
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
    revalidatePath(`/admin/networks/${cell.networkId}`)
    return { success: true }
  } catch (error) {
    console.error("Cell deletion error:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to delete cell" 
    }
  }
}