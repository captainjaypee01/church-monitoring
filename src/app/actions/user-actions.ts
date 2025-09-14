"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { users, profiles, userRoles, cellMemberships, memberships } from "@/lib/db/schema"
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
      phone: formData.get("phone") as string,
      gender: formData.get("gender") as string,
      birthdate: formData.get("birthdate") as string,
      address: formData.get("address") as string,
      isActive: formData.has("isActive"),
      role: (formData.get("role") as string) === "none" ? undefined : (formData.get("role") as string || undefined),
      networkId: (formData.get("networkId") as string) === "none" ? undefined : (formData.get("networkId") as string || undefined),
      cellId: (formData.get("cellId") as string) === "none" ? undefined : (formData.get("cellId") as string || undefined),
    }

    console.log("Form data debug:", {
      isActiveValue: formData.get("isActive"),
      hasIsActive: formData.has("isActive"),
      allKeys: Array.from(formData.keys())
    })

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
    const [newProfile] = await db
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
      .returning()

    // Handle membership assignment (separate from role capabilities)
    const networkId = validatedData.networkId && validatedData.networkId !== "none" ? validatedData.networkId : null
    const cellId = validatedData.cellId && validatedData.cellId !== "none" ? validatedData.cellId : null
    
    if (networkId || cellId) {
      // Create membership record (just for membership, not leadership)
      await db.insert(memberships).values({
        profileId: newProfile.id,
        networkId: networkId,
        cellId: cellId,
        membershipType: "MEMBER", // Always member for user assignment
        leadershipScope: "NONE",  // Leadership is assigned separately
        status: "ACTIVE",
        joinedAt: new Date(),
      })

      // Also create legacy cellMemberships record for backward compatibility
      if (cellId) {
        await db.insert(cellMemberships).values({
          cellId: cellId,
          profileId: newProfile.id,
          roleInCell: "MEMBER", // Always member for user assignment
        })
      }
    }

    // Create role capability record (not leadership assignment)
    if (validatedData.role && validatedData.role !== "MEMBER") {
      await db.insert(userRoles).values({
        userId: newUser.id,
        role: validatedData.role as any,
        networkId: null,  // No specific assignment, just capability
        cellId: null,     // No specific assignment, just capability
      })
    }

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
      isActive: formData.has("isActive"),
      role: (formData.get("role") as string) === "none" ? undefined : (formData.get("role") as string || undefined),
      networkId: (formData.get("networkId") as string) === "none" ? undefined : (formData.get("networkId") as string || undefined),
      cellId: (formData.get("cellId") as string) === "none" ? undefined : (formData.get("cellId") as string || undefined),
    }

    console.log("Update form data debug:", {
      isActiveValue: formData.get("isActive"),
      hasIsActive: formData.has("isActive"),
      allKeys: Array.from(formData.keys())
    })

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
    
    if (validatedData.firstName !== undefined) profileUpdateData.firstName = validatedData.firstName
    if (validatedData.lastName !== undefined) profileUpdateData.lastName = validatedData.lastName
    
    // Update fullName if either firstName or lastName is provided
    if (validatedData.firstName !== undefined || validatedData.lastName !== undefined) {
      // Get current profile data to preserve existing values
      const currentProfile = await db
        .select()
        .from(profiles)
        .where(eq(profiles.userId, userId))
        .limit(1)
      
      const currentFirstName = currentProfile[0]?.firstName || ''
      const currentLastName = currentProfile[0]?.lastName || ''
      
      const newFirstName = validatedData.firstName !== undefined ? validatedData.firstName : currentFirstName
      const newLastName = validatedData.lastName !== undefined ? validatedData.lastName : currentLastName
      
      profileUpdateData.fullName = `${newFirstName} ${newLastName}`.trim()
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

    // Handle membership and role assignment/update
    if (validatedData.role !== undefined || validatedData.networkId !== undefined || validatedData.cellId !== undefined) {
      // Get user's profile for membership updates
      const [userProfile] = await db
        .select({ id: profiles.id })
        .from(profiles)
        .where(eq(profiles.userId, userId))
        .limit(1)

      if (userProfile) {
        // Remove existing memberships and roles
        await db.delete(memberships).where(eq(memberships.profileId, userProfile.id))
        await db.delete(cellMemberships).where(eq(cellMemberships.profileId, userProfile.id))
        await db.delete(userRoles).where(eq(userRoles.userId, userId))
        
        // Handle membership assignment (separate from role capabilities)
        const networkId = validatedData.networkId && validatedData.networkId !== "none" ? validatedData.networkId : null
        const cellId = validatedData.cellId && validatedData.cellId !== "none" ? validatedData.cellId : null
        
        if (networkId || cellId) {
          // Create membership record (just for membership, not leadership)
          await db.insert(memberships).values({
            profileId: userProfile.id,
            networkId: networkId,
            cellId: cellId,
            membershipType: "MEMBER", // Always member for user assignment
            leadershipScope: "NONE",  // Leadership is assigned separately
            status: "ACTIVE",
            joinedAt: new Date(),
          })

          // Create legacy cellMemberships record for backward compatibility
          if (cellId) {
            await db.insert(cellMemberships).values({
              cellId: cellId,
              profileId: userProfile.id,
              roleInCell: "MEMBER", // Always member for user assignment
            })
          }
        }

        // Create role capability record (not leadership assignment)
        if (validatedData.role && validatedData.role !== "MEMBER") {
          await db.insert(userRoles).values({
            userId,
            role: validatedData.role as any,
            networkId: null,  // No specific assignment, just capability
            cellId: null,     // No specific assignment, just capability
          })
        }
      }
    }

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
