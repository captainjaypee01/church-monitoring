import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { isCellLeader, isAdmin } from "@/lib/rbac"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { db } from "@/lib/db"
import { users, cells, networks } from "@/lib/db/schema"
import { eq, and, ne } from "drizzle-orm"
import { AddMemberForm } from "@/components/users/add-member-form"

export default async function AddCellMemberPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/login")
  }

  // Check if user is Cell Leader or Admin
  const userRole = session.userData?.role
  const isCellLeaderRole = userRole === "CELL_LEADER" || session.userData?.isCellLeader
  const isAdminRole = userRole === "ADMIN"
  
  if (!isCellLeaderRole && !isAdminRole) {
    redirect("/dashboard")
  }

  // Get user's cell
  if (!session.userData?.cellId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add Member</h1>
          <p className="text-muted-foreground">
            You are not assigned to any cell group.
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>No Cell Assignment</CardTitle>
            <CardDescription>
              Please contact your administrator to be assigned to a cell group.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Fetch cell details
  const [cell] = await db
    .select()
    .from(cells)
    .where(eq(cells.id, session.userData.cellId))
    .limit(1)

  if (!cell) {
    redirect("/dashboard")
  }

  // Fetch network details
  const [network] = await db
    .select()
    .from(networks)
    .where(eq(networks.id, cell.networkId))
    .limit(1)

  if (!network) {
    redirect("/dashboard")
  }

  // Get available users (not already assigned to a cell or network)
  const availableUsers = await db
    .select({
      id: users.id,
      name: users.name,
      fullName: users.fullName,
      email: users.email,
      role: users.role,
    })
    .from(users)
    .where(and(
      eq(users.isActive, true),
      ne(users.role, "ADMIN"), // Don't show admins
      // Users who are not assigned to any cell or network
      eq(users.cellId, null),
      eq(users.networkId, null)
    ))
    .orderBy(users.fullName)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add Member to {cell.name}</h1>
          <p className="text-muted-foreground">
            Add a new member to {cell.name} cell group in {network.name} network
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/cell">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cell
          </Link>
        </Button>
      </div>

      {/* Add Member Form */}
      <AddMemberForm 
        cellId={cell.id}
        networkId={network.id}
        cellName={cell.name}
        networkName={network.name}
        availableUsers={availableUsers}
      />
    </div>
  )
}
