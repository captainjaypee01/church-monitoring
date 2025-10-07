"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { isAdmin } from "@/lib/rbac"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { eq, and, isNull, or } from "drizzle-orm"
import bcrypt from "bcryptjs"

const baseUserSchema = z.object({
  email: z.string().email("Invalid email address").optional(),
  username: z.string().min(1, "Username is required").optional(),
  name: z.string().min(1, "Display name is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  birthdate: z.string().optional(),
  address: z.string().optional(),
  isActive: z.boolean().default(true),
  role: z.enum(["ADMIN", "NETWORK_LEADER", "CELL_LEADER", "MEMBER"]).optional(),
  networkId: z.string().optional(),
  cellId: z.string().optional(),
})

const userDataSchema = baseUserSchema.refine(
  (data) => data.email || data.username,
  {
    message: "Either email or username is required",
    path: ["emailOrUsername"],
  }
)

const userUpdateSchema = baseUserSchema.partial().omit({ password: true }).extend({
  password: z.string().optional(),
})

export async function createUserAction(formData: FormData) {
  try {
    const session = await auth()
    
    if (!session?.user || !isAdmin(session)) {
      return { success: false, error: "Unauthorized" }
    }

    // Parse form data
    const data = {
      email: formData.get("email") as string || undefined,
      username: formData.get("username") as string || undefined,
      name: formData.get("name") as string,
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      password: formData.get("password") as string,
      phone: (formData.get("phone") as string) || undefined,
      gender: (formData.get("gender") as string) || undefined,
      birthdate: (formData.get("birthdate") as string) || undefined,
      address: (formData.get("address") as string) || undefined,
      isActive: formData.has("isActive"),
      role: (formData.get("role") as string) === "none" ? undefined : (formData.get("role") as string || undefined),
      networkId: (formData.get("networkId") as string) === "none" ? undefined : (formData.get("networkId") as string || undefined),
      cellId: (formData.get("cellId") as string) === "none" ? undefined : (formData.get("cellId") as string || undefined),
    }

    // Validate data
    const validatedData = userDataSchema.parse(data)

    // Check if email or username already exists
    const existingUserConditions = []
    if (validatedData.email) {
      existingUserConditions.push(eq(users.email, validatedData.email))
    }
    if (validatedData.username) {
      existingUserConditions.push(eq(users.username, validatedData.username))
    }
    
    if (existingUserConditions.length > 0) {
      const [existingUser] = await db
        .select()
        .from(users)
        .where(and(
          or(...existingUserConditions),
          isNull(users.deletedAt)
        ))
        .limit(1)

      if (existingUser) {
        if (existingUser.email === validatedData.email) {
          return { success: false, error: "Email already exists" }
        }
        if (existingUser.username === validatedData.username) {
          return { success: false, error: "Username already exists" }
        }
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12)

    // Create user with all fields in simplified schema
    const fullName = `${validatedData.firstName} ${validatedData.lastName}`.trim()
    const [newUser] = await db
      .insert(users)
      .values({
        email: validatedData.email || null,
        username: validatedData.username || null,
        hashedPassword,
        name: validatedData.name,
        phone: validatedData.phone || null,
        
        // Profile fields (merged into users table)
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        fullName,
        birthdate: validatedData.birthdate ? new Date(validatedData.birthdate) : null,
        gender: validatedData.gender as any || null,
        address: validatedData.address || null,
        
        // Role & Assignment fields
        role: validatedData.role as any || "MEMBER",
        networkId: validatedData.networkId || null,
        cellId: validatedData.cellId || null,
        
        // Leadership flags (default to false, set via Network/Cell management)
        isNetworkLeader: false,
        isCellLeader: false,
        
        // Status fields
        isActive: validatedData.isActive,
      })
      .returning()

    console.log("User created successfully:", newUser.id)

    revalidatePath("/admin/users")
    return { success: true, userId: newUser.id }
  } catch (error) {
    console.error("User creation error:", error)
    
    // Handle Zod validation errors with user-friendly messages
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]
      if (firstError.path[0] === "gender") {
        return { 
          success: false, 
          error: "Please select a valid gender option or leave it empty" 
        }
      }
      return { 
        success: false, 
        error: `Validation error: ${firstError.message}` 
      }
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to create user" 
    }
  }
}

export async function updateUserAction(userId: string, formData: FormData) {
  try {
    const session = await auth()
    
    if (!session?.user || !isAdmin(session)) {
      return { success: false, error: "Unauthorized" }
    }

    // Parse form data
    const data = {
      email: formData.get("email") as string || undefined,
      username: formData.get("username") as string || undefined,
      name: formData.get("name") as string,
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      password: formData.get("password") as string || undefined,
      phone: (formData.get("phone") as string) || undefined,
      gender: (formData.get("gender") as string) || undefined,
      birthdate: (formData.get("birthdate") as string) || undefined,
      address: (formData.get("address") as string) || undefined,
      isActive: formData.has("isActive"),
      role: (formData.get("role") as string) === "none" ? undefined : (formData.get("role") as string || undefined),
      networkId: (formData.get("networkId") as string) === "none" ? undefined : (formData.get("networkId") as string || undefined),
      cellId: (formData.get("cellId") as string) === "none" ? undefined : (formData.get("cellId") as string || undefined),
    }

    // Validate data
    const validatedData = userUpdateSchema.parse(data)

    // Check if email or username already exists (excluding current user)
    const existingUserConditions = []
    if (validatedData.email) {
      existingUserConditions.push(eq(users.email, validatedData.email))
    }
    if (validatedData.username) {
      existingUserConditions.push(eq(users.username, validatedData.username))
    }
    
    if (existingUserConditions.length > 0) {
      const [existingUser] = await db
        .select()
        .from(users)
        .where(and(
          or(...existingUserConditions),
          isNull(users.deletedAt)
        ))
        .limit(1)

      if (existingUser && existingUser.id !== userId) {
        if (existingUser.email === validatedData.email) {
          return { success: false, error: "Email already exists" }
        }
        if (existingUser.username === validatedData.username) {
          return { success: false, error: "Username already exists" }
        }
      }
    }

    // Prepare update values
    const fullName = `${validatedData.firstName} ${validatedData.lastName}`.trim()
    const updateValues: any = {
      email: validatedData.email || null,
      username: validatedData.username || null,
      name: validatedData.name,
      phone: validatedData.phone || null,
      
      // Profile fields
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      fullName,
      birthdate: validatedData.birthdate ? new Date(validatedData.birthdate) : null,
      gender: validatedData.gender as any || null,
      address: validatedData.address || null,
      
      // Role & Assignment fields
      role: validatedData.role as any || "MEMBER",
      networkId: validatedData.networkId || null,
      cellId: validatedData.cellId || null,
      
      // Status fields
      isActive: validatedData.isActive,
      updatedAt: new Date(),
    }

    // Hash password if provided
    if (validatedData.password && validatedData.password.length > 0) {
      updateValues.hashedPassword = await bcrypt.hash(validatedData.password, 12)
    }

    // Update user
    await db
      .update(users)
      .set(updateValues)
      .where(eq(users.id, userId))

    console.log("User updated successfully:", userId)

    revalidatePath("/admin/users")
    revalidatePath(`/admin/users/${userId}`)
    return { success: true }
  } catch (error) {
    console.error("User update error:", error)
    
    // Handle Zod validation errors with user-friendly messages
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]
      if (firstError.path[0] === "gender") {
        return { 
          success: false, 
          error: "Please select a valid gender option or leave it empty" 
        }
      }
      return { 
        success: false, 
        error: `Validation error: ${firstError.message}` 
      }
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to update user" 
    }
  }
}

export async function softDeleteUserAction(userId: string) {
  try {
    const session = await auth()
    
    if (!session?.user || !isAdmin(session)) {
      return { success: false, error: "Unauthorized" }
    }

    // Soft delete user
    await db
      .update(users)
      .set({ 
        deletedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))

    revalidatePath("/admin/users")
    revalidatePath(`/admin/users/${userId}`)
    return { success: true }
  } catch (error) {
    console.error("User deletion error:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to delete user" 
    }
  }
}

export async function restoreUserAction(userId: string) {
  try {
    const session = await auth()
    
    if (!session?.user || !isAdmin(session)) {
      return { success: false, error: "Unauthorized" }
    }

    // Restore user
    await db
      .update(users)
      .set({ 
        deletedAt: null,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))

    revalidatePath("/admin/users")
    revalidatePath(`/admin/users/${userId}`)
    return { success: true }
  } catch (error) {
    console.error("User restoration error:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to restore user" 
    }
  }
}