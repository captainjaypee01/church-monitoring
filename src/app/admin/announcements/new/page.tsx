import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { canManageAnnouncements } from "@/lib/rbac"
import { NewAnnouncementForm } from "@/components/announcements/new-announcement-form"

export default async function NewAnnouncementPage() {
  const session = await auth()
  
  if (!session?.user || !canManageAnnouncements(session)) {
    redirect("/dashboard")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Announcement</h1>
        <p className="text-muted-foreground">
          Create a new announcement to share important information with church members.
        </p>
      </div>

      <NewAnnouncementForm currentUserId={session.user.id!} />
    </div>
  )
}
