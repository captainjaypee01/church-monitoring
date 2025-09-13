import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { canLogMeeting } from "@/lib/rbac"
import { NewMeetingForm } from "@/components/meetings/new-meeting-form"
import { db } from "@/lib/db"
import { cells, cellMemberships, profiles, trainingLevels } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export default async function NewMeetingPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/login")
  }

  // Get user's cell (assuming first cell for now)
  const userCellId = session.user.roles.find(role => role.cellId)?.cellId
  
  if (!userCellId || !canLogMeeting(session.user, userCellId)) {
    redirect("/dashboard")
  }

  // Fetch cell details and members
  const [cell] = await db
    .select()
    .from(cells)
    .where(eq(cells.id, userCellId))
    .limit(1)

  if (!cell) {
    redirect("/dashboard")
  }

  // Fetch cell members
  const cellMembers = await db
    .select({
      id: profiles.id,
      fullName: profiles.fullName,
      userId: profiles.userId,
    })
    .from(cellMemberships)
    .innerJoin(profiles, eq(cellMemberships.profileId, profiles.id))
    .where(eq(cellMemberships.cellId, userCellId))

  // Fetch training levels
  const levels = await db
    .select()
    .from(trainingLevels)
    .orderBy(trainingLevels.order)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Log New Meeting</h1>
        <p className="text-muted-foreground">
          Record attendance, training updates, giving, and upload group photo for {cell.name}.
        </p>
      </div>

      <NewMeetingForm 
        cell={cell}
        members={cellMembers}
        trainingLevels={levels}
        currentUserId={session.user.id}
      />
    </div>
  )
}
