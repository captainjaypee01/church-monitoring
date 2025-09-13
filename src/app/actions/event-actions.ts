"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { 
  events, 
  eventRegistrations, 
  auditLogs,
  type NewEvent,
  type NewEventRegistration,
  type NewAuditLog
} from "@/lib/db/schema"
import { canManageEvents } from "@/lib/rbac"
import { revalidatePath } from "next/cache"
import { put } from "@vercel/blob"
import { z } from "zod"
import { eq, and, count } from "drizzle-orm"

const eventDataSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  startAt: z.string().min(1, "Start date and time is required"),
  endAt: z.string().min(1, "End date and time is required"),
  location: z.string().optional(),
  capacity: z.number().min(1).optional(),
  allowRegistration: z.boolean().default(true),
}).refine((data) => {
  const start = new Date(data.startAt)
  const end = new Date(data.endAt)
  return end > start
}, {
  message: "End time must be after start time",
  path: ["endAt"],
})

export async function createEventAction(formData: FormData) {
  try {
    const session = await auth()
    
    if (!session?.user || !canManageEvents(session.user)) {
      return { success: false, error: "Unauthorized" }
    }

    const dataJson = formData.get("data") as string
    const attachmentFile = formData.get("attachment") as File | null

    // Parse and validate event data
    const data = eventDataSchema.parse(JSON.parse(dataJson))

    // Upload attachment if provided
    let attachmentUrl: string | null = null
    if (attachmentFile && attachmentFile.size > 0) {
      try {
        const blob = await put(
          `events/${Date.now()}-${attachmentFile.name}`,
          attachmentFile,
          {
            access: "public",
          }
        )
        attachmentUrl = blob.url
      } catch (error) {
        console.error("Failed to upload attachment:", error)
        // Continue without the attachment rather than failing the entire operation
      }
    }

    // Create the event
    const [event] = await db
      .insert(events)
      .values({
        title: data.title,
        description: data.description || null,
        startAt: new Date(data.startAt),
        endAt: new Date(data.endAt),
        location: data.location || null,
        capacity: data.capacity || null,
        allowRegistration: data.allowRegistration,
        attachmentUrl,
        createdBy: session.user.id,
      } satisfies NewEvent)
      .returning()

    // Create audit log
    await db.insert(auditLogs).values({
      actorUserId: session.user.id,
      action: "EVENT_CREATED",
      subjectTable: "events",
      subjectId: event.id,
      meta: {
        title: data.title,
        startAt: data.startAt,
        location: data.location,
        capacity: data.capacity,
        allowRegistration: data.allowRegistration,
      },
    } satisfies NewAuditLog)

    // Revalidate relevant pages
    revalidatePath("/admin/events")
    revalidatePath("/events")

    return { 
      success: true, 
      eventId: event.id,
      message: "Event created successfully"
    }

  } catch (error) {
    console.error("Failed to create event:", error)
    
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: "Invalid event data: " + error.errors.map(e => e.message).join(", ")
      }
    }

    return { 
      success: false, 
      error: "Failed to create event. Please try again."
    }
  }
}

export async function registerForEventAction(eventId: string, profileId: string) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    // Check if event exists and allows registration
    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1)

    if (!event) {
      return { success: false, error: "Event not found" }
    }

    if (!event.allowRegistration) {
      return { success: false, error: "Registration is not allowed for this event" }
    }

    // Check if already registered
    const [existingRegistration] = await db
      .select()
      .from(eventRegistrations)
      .where(and(
        eq(eventRegistrations.eventId, eventId),
        eq(eventRegistrations.profileId, profileId)
      ))
      .limit(1)

    if (existingRegistration) {
      return { success: false, error: "Already registered for this event" }
    }

    // Check capacity
    if (event.capacity) {
      const [registrationCount] = await db
        .select({ count: count() })
        .from(eventRegistrations)
        .where(eq(eventRegistrations.eventId, eventId))

      if (Number(registrationCount?.count || 0) >= event.capacity) {
        return { success: false, error: "Event is at full capacity" }
      }
    }

    // Create registration
    await db.insert(eventRegistrations).values({
      eventId,
      profileId,
      status: "REGISTERED",
    } satisfies NewEventRegistration)

    // Create audit log
    await db.insert(auditLogs).values({
      actorUserId: session.user.id,
      action: "CREATED",
      subjectTable: "event_registrations",
      subjectId: eventId,
      meta: {
        eventId,
        profileId,
        action: "registered",
      },
    } satisfies NewAuditLog)

    // Revalidate relevant pages
    revalidatePath("/events")
    revalidatePath(`/events/${eventId}`)

    return { 
      success: true, 
      message: "Successfully registered for event"
    }

  } catch (error) {
    console.error("Failed to register for event:", error)
    return { 
      success: false, 
      error: "Failed to register for event. Please try again."
    }
  }
}

export async function cancelEventRegistrationAction(eventId: string, profileId: string) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    // Delete registration
    await db
      .delete(eventRegistrations)
      .where(and(
        eq(eventRegistrations.eventId, eventId),
        eq(eventRegistrations.profileId, profileId)
      ))

    // Create audit log
    await db.insert(auditLogs).values({
      actorUserId: session.user.id,
      action: "DELETED",
      subjectTable: "event_registrations",
      subjectId: eventId,
      meta: {
        eventId,
        profileId,
        action: "cancelled",
      },
    } satisfies NewAuditLog)

    // Revalidate relevant pages
    revalidatePath("/events")
    revalidatePath(`/events/${eventId}`)

    return { 
      success: true, 
      message: "Registration cancelled successfully"
    }

  } catch (error) {
    console.error("Failed to cancel registration:", error)
    return { 
      success: false, 
      error: "Failed to cancel registration. Please try again."
    }
  }
}
