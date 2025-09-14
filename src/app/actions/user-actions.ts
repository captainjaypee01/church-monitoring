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
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Name is required"),
  fullName: z.string().min(1, "Full name is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  birthdate: z.string().optional(),
  address: z.string().optional(),
  isActive: z.boolean().default(true),
})

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
      email: formData.get("email") as string,
      name: formData.get("name") as string,
      fullName: formData.get("fullName") as string,
      password: formData.get("password") as string,
      phone: formData.get("phone") as string,
      gender: formData.get("gender") as string,
      birthdate: formData.get("birthdate") as string,
      address: formData.get("address") as string,
      isActive: formData.get("isActive") === "true",
    }

    // Validate data
    const validatedData = userDataSchema.parse(data)

    // Check if email already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(and(
        eq(users.email, validatedData.email),
        isNull(users.deletedAt)
      ))
      .limit(1)

    if (existingUser) {
      return { success: false, error: "Email already exists" }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12)

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        email: validatedData.email,
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
        fullName: validatedData.fullName,
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
      email: formData.get("email") as string,
      name: formData.get("name") as string,
      fullName: formData.get("fullName") as string,
      password: formData.get("password") as string,
      phone: formData.get("phone") as string,
      gender: formData.get("gender") as string,
      birthdate: formData.get("birthdate") as string,
      address: formData.get("address") as string,
      isActive: formData.get("isActive") === "true",
    }

    // Validate data
    const validatedData = userUpdateSchema.parse(data)

    // Check if email already exists (excluding current user)
    if (validatedData.email) {
      const [existingUser] = await db
        .select()
        .from(users)
        .where(and(
          eq(users.email, validatedData.email),
          isNull(users.deletedAt)
        ))
        .limit(1)

      if (existingUser && existingUser.id !== userId) {
        return { success: false, error: "Email already exists" }
      }
    }

    // Prepare update data
    const userUpdateData: any = {
      updatedAt: new Date(),
    }
    
    if (validatedData.email) userUpdateData.email = validatedData.email
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
    
    if (validatedData.fullName) profileUpdateData.fullName = validatedData.fullName
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
