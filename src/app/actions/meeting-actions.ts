"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { 
  meetings, 
  meetingAttendance, 
  giving, 
  trainingProgress,
  auditLogs,
  type NewMeeting,
  type NewMeetingAttendance,
  type NewGiving,
  type NewTrainingProgress,
  type NewAuditLog
} from "@/lib/db/schema"
import { canLogCellMeeting } from "@/lib/rbac"
import { revalidatePath } from "next/cache"
import { put } from "@vercel/blob"
import { z } from "zod"

const meetingDataSchema = z.object({
  occurredAt: z.string(),
  notes: z.string().optional(),
  tithesAmount: z.number().min(0).default(0),
  offeringsAmount: z.number().min(0).default(0),
  currency: z.string().default("USD"),
  attendance: z.array(z.object({
    profileId: z.string(),
    present: z.boolean(),
    isVip: z.boolean(),
    remarks: z.string().optional(),
  })),
  trainingUpdates: z.array(z.object({
    profileId: z.string(),
    levelId: z.string(),
    notes: z.string().optional(),
  })),
})

export async function logMeetingAction(formData: FormData) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    const cellId = formData.get("cellId") as string
    const dataJson = formData.get("data") as string
    const groupPictureFile = formData.get("groupPicture") as File | null

    if (!cellId || !canLogCellMeeting(session, cellId)) {
      return { success: false, error: "Not authorized to log meetings for this cell" }
    }

    // Parse and validate meeting data
    const data = meetingDataSchema.parse(JSON.parse(dataJson))

    // Upload group picture if provided
    let groupPictureUrl: string | null = null
    if (groupPictureFile && groupPictureFile.size > 0) {
      try {
        const blob = await put(
          `meetings/${cellId}/${Date.now()}-${groupPictureFile.name}`,
          groupPictureFile,
          {
            access: "public",
          }
        )
        groupPictureUrl = blob.url
      } catch (error) {
        console.error("Failed to upload group picture:", error)
        // Continue without the picture rather than failing the entire operation
      }
    }

    // Start transaction-like operations
    // 1. Create the meeting
    const [meeting] = await db
      .insert(meetings)
      .values({
        cellId,
        leaderUserId: session.user.id!,
        occurredAt: new Date(data.occurredAt),
        notes: data.notes || null,
        groupPictureUrl,
      } satisfies NewMeeting)
      .returning()

    // 2. Record attendance
    const attendanceData: NewMeetingAttendance[] = data.attendance.map(item => ({
      meetingId: meeting.id,
      userId: item.profileId, // Changed from profileId to userId
      isVip: item.isVip,
      present: item.present,
      remarks: item.remarks || null,
    }))

    if (attendanceData.length > 0) {
      await db.insert(meetingAttendance).values(attendanceData)
    }

    // 3. Record giving if any amount was collected
    if (data.tithesAmount > 0 || data.offeringsAmount > 0) {
      await db.insert(giving).values({
        meetingId: meeting.id,
        tithesAmount: data.tithesAmount.toString(),
        offeringsAmount: data.offeringsAmount.toString(),
        currency: data.currency,
      } satisfies NewGiving)
    }

    // 4. Record training progress updates
    if (data.trainingUpdates.length > 0) {
      const trainingData: NewTrainingProgress[] = data.trainingUpdates.map(update => ({
        userId: update.profileId, // Changed from profileId to userId
        levelId: update.levelId,
        completedAt: new Date(),
        notes: update.notes || null,
      }))

      await db.insert(trainingProgress).values(trainingData)
    }

    // 5. Create audit log
    await db.insert(auditLogs).values({
      actorUserId: session.user.id,
      action: "MEETING_LOGGED",
      subjectTable: "meetings",
      subjectId: meeting.id,
      meta: {
        cellId,
        attendanceCount: data.attendance.filter(a => a.present).length,
        vipCount: data.attendance.filter(a => a.present && a.isVip).length,
        totalGiving: data.tithesAmount + data.offeringsAmount,
        trainingUpdates: data.trainingUpdates.length,
      },
    } satisfies NewAuditLog)

    // Revalidate relevant pages
    revalidatePath("/cell")
    revalidatePath("/dashboard")
    revalidatePath(`/cell/meetings`)

    return { 
      success: true, 
      meetingId: meeting.id,
      message: "Meeting logged successfully"
    }

  } catch (error) {
    console.error("Failed to log meeting:", error)
    
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: "Invalid meeting data: " + error.errors.map(e => e.message).join(", ")
      }
    }

    return { 
      success: false, 
      error: "Failed to log meeting. Please try again."
    }
  }
}
