import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { isAdmin } from "@/lib/rbac"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { NewCellForm } from "@/components/cells/new-cell-form"
import { db } from "@/lib/db"
import { networks } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

interface NewCellPageProps {
  params: Promise<{ id: string }>
}

export default async function NewCellPage({ params }: NewCellPageProps) {
  const session = await auth()
  const { id: networkId } = await params
  
  if (!session?.user) {
    redirect("/login")
  }

  if (!isAdmin(session)) {
    redirect("/dashboard")
  }

  // Verify network exists
  const [network] = await db
    .select()
    .from(networks)
    .where(eq(networks.id, networkId))
    .limit(1)

  if (!network) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Cell Group</h1>
          <p className="text-muted-foreground">
            Add a new cell group to {network.name} network.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/admin/networks/${networkId}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Network
          </Link>
        </Button>
      </div>

      <NewCellForm networkId={networkId} currentUserId={session.user.id!} />
    </div>
  )
}
