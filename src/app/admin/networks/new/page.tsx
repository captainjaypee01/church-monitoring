import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { isAdmin } from "@/lib/rbac"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { NewNetworkForm } from "@/components/networks/new-network-form"

export default async function NewNetworkPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/login")
  }

  if (!isAdmin(session)) {
    redirect("/dashboard")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create New Network</h1>
        <p className="text-muted-foreground">
          Set up a new church network to organize cell groups and assign network leaders.
        </p>
      </div>

      <NewNetworkForm currentUserId={session.user.id!} />
    </div>
  )
}
