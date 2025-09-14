"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { users, profiles, userRoles } from "@/lib/db/schema"
import { isAdmin } from "@/lib/rbac"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { eq, and, isNull, or } from "drizzle-orm"
import bcrypt from "bcryptjs"

const userDataSchema = z.object({
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
}).refine(
  (data) => data.email || data.username,
  {
    message: "Either email or username is required",
    path: ["emailOrUsername"],
  }
)

const userUpdateSchema = userDataSchema.partial().omit({ password: true }).extend({
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
      phone: formData.get("phone") as string,
      gender: formData.get("gender") as string,
      birthdate: formData.get("birthdate") as string,
      address: formData.get("address") as string,
      isActive: formData.get("isActive") === "true",
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

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        email: validatedData.email || null,
        username: validatedData.username || null,
        name: validatedData.name,
        hashedPassword,
        phone: validatedData.phone || null,
      })
      .returning()

    // Create profile
    await db
      .insert(profiles)
      .values({
        userId: newUser.id,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        fullName: `${validatedData.firstName} ${validatedData.lastName}`,
        gender: validatedData.gender || null,
        birthdate: validatedData.birthdate ? new Date(validatedData.birthdate) : null,
        address: validatedData.address || null,
        isActive: validatedData.isActive,
      })

    revalidatePath("/admin/users")
    return { success: true, userId: newUser.id }
  } catch (error) {
    console.error("User creation error:", error)
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

    const data = {
      email: formData.get("email") as string || undefined,
      username: formData.get("username") as string || undefined,
      name: formData.get("name") as string,
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      password: formData.get("password") as string,
      phone: formData.get("phone") as string,
      gender: formData.get("gender") as string,
      birthdate: formData.get("birthdate") as string,
      address: formData.get("address") as string,
      isActive: formData.get("isActive") === "true",
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

    // Prepare update data
    const userUpdateData: any = {
      updatedAt: new Date(),
    }
    
    if (validatedData.email !== undefined) userUpdateData.email = validatedData.email || null
    if (validatedData.username !== undefined) userUpdateData.username = validatedData.username || null
    if (validatedData.name) userUpdateData.name = validatedData.name
    if (validatedData.phone !== undefined) userUpdateData.phone = validatedData.phone || null
    if (validatedData.password) {
      userUpdateData.hashedPassword = await bcrypt.hash(validatedData.password, 12)
    }

    // Update user
    await db
      .update(users)
      .set(userUpdateData)
      .where(eq(users.id, userId))

    // Update profile
    const profileUpdateData: any = {
      updatedAt: new Date(),
    }
    
    if (validatedData.firstName) profileUpdateData.firstName = validatedData.firstName
    if (validatedData.lastName) profileUpdateData.lastName = validatedData.lastName
    if (validatedData.firstName || validatedData.lastName) {
      profileUpdateData.fullName = `${validatedData.firstName || ''} ${validatedData.lastName || ''}`.trim()
    }
    if (validatedData.gender !== undefined) profileUpdateData.gender = validatedData.gender || null
    if (validatedData.birthdate !== undefined) {
      profileUpdateData.birthdate = validatedData.birthdate ? new Date(validatedData.birthdate) : null
    }
    if (validatedData.address !== undefined) profileUpdateData.address = validatedData.address || null
    if (validatedData.isActive !== undefined) profileUpdateData.isActive = validatedData.isActive

    await db
      .update(profiles)
      .set(profileUpdateData)
      .where(eq(profiles.userId, userId))

    revalidatePath("/admin/users")
    revalidatePath(`/admin/users/${userId}`)
    return { success: true }
  } catch (error) {
    console.error("User update error:", error)
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

    // Prevent deleting yourself
    if (session.user.id === userId) {
      return { success: false, error: "Cannot delete your own account" }
    }

    const now = new Date()

    // Soft delete user
    await db
      .update(users)
      .set({
        deletedAt: now,
        updatedAt: now,
      })
      .where(eq(users.id, userId))

    // Soft delete profile
    await db
      .update(profiles)
      .set({
        deletedAt: now,
        updatedAt: now,
      })
      .where(eq(profiles.userId, userId))

    // Remove all user roles
    await db
      .delete(userRoles)
      .where(eq(userRoles.userId, userId))

    revalidatePath("/admin/users")
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
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))

    // Restore profile
    await db
      .update(profiles)
      .set({
        deletedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(profiles.userId, userId))

    revalidatePath("/admin/users")
    return { success: true }
  } catch (error) {
    console.error("User restoration error:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to restore user" 
    }
  }
}
