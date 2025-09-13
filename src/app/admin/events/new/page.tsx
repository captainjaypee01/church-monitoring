import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { canManageEvents } from "@/lib/rbac"
import { NewEventForm } from "@/components/events/new-event-form"

export default async function NewEventPage() {
  const session = await auth()
  
  if (!session?.user || !canManageEvents(session)) {
    redirect("/dashboard")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create New Event</h1>
        <p className="text-muted-foreground">
          Set up a new church event or activity for members to participate in.
        </p>
      </div>

      <NewEventForm currentUserId={session.user.id!} />
    </div>
  )
}
