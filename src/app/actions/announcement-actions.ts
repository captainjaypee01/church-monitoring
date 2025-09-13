"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { 
  announcements, 
  auditLogs,
  type NewAnnouncement,
  type NewAuditLog
} from "@/lib/db/schema"
import { canManageAnnouncements } from "@/lib/rbac"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const announcementDataSchema = z.object({
  title: z.string().min(1, "Title is required"),
  body: z.string().min(1, "Body is required"),
  audience: z.enum(["ALL", "LEADERS", "MEMBERS"]),
  publishNow: z.boolean().default(false),
})

export async function createAnnouncementAction(data: z.infer<typeof announcementDataSchema>) {
  try {
    const session = await auth()
    
    if (!session?.user || !canManageAnnouncements(session)) {
      return { success: false, error: "Unauthorized" }
    }

    // Validate announcement data
    const validatedData = announcementDataSchema.parse(data)

    // Create the announcement
    const [announcement] = await db
      .insert(announcements)
      .values({
        title: validatedData.title,
        body: validatedData.body,
        audience: validatedData.audience,
        publishedAt: validatedData.publishNow ? new Date() : null,
        authorId: session.user.id!,
      } satisfies NewAnnouncement)
      .returning()

    // Create audit log
    await db.insert(auditLogs).values({
      actorUserId: session.user.id,
      action: validatedData.publishNow ? "ANNOUNCEMENT_PUBLISHED" : "CREATED",
      subjectTable: "announcements",
      subjectId: announcement.id,
      meta: {
        title: validatedData.title,
        audience: validatedData.audience,
        published: validatedData.publishNow,
      },
    } satisfies NewAuditLog)

    // Revalidate relevant pages
    revalidatePath("/admin/announcements")
    revalidatePath("/dashboard")

    return { 
      success: true, 
      announcementId: announcement.id,
      message: validatedData.publishNow 
        ? "Announcement published successfully"
        : "Announcement saved as draft"
    }

  } catch (error) {
    console.error("Failed to create announcement:", error)
    
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: "Invalid announcement data: " + error.errors.map(e => e.message).join(", ")
      }
    }

    return { 
      success: false, 
      error: "Failed to create announcement. Please try again."
    }
  }
}
