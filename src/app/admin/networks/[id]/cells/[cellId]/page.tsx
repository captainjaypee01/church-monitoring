import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { isAdmin } from "@/lib/rbac"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EditCellForm } from "@/components/cells/edit-cell-form"
import { db } from "@/lib/db"
import { networks, cells, users } from "@/lib/db/schema"
import { eq, count, and } from "drizzle-orm"
import { Building, Users, Settings, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface CellDetailPageProps {
  params: Promise<{ id: string; cellId: string }>
}

export default async function CellDetailPage({ params }: CellDetailPageProps) {
  const session = await auth()
  const { id: networkId, cellId } = await params
  console.log('networkId', networkId, 'cellId', cellId)
  if (!session?.user) {
    redirect("/login")
  }

  if (!isAdmin(session)) {
    redirect("/dashboard")
  }

  // Fetch network details
  const [network] = await db
    .select()
    .from(networks)
    .where(eq(networks.id, networkId))
    .limit(1)

  if (!network) {
    notFound()
  }

  // Fetch cell details
  const [cell] = await db
    .select()
    .from(cells)
    .where(and(eq(cells.id, cellId), eq(cells.networkId, networkId)))
    .limit(1)

  if (!cell) {
    notFound()
  }

  // Get cell leader(s) - can be multiple now
  let cellLeader = null
  
  try {
    const cellLeaderResult = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
      })
      .from(users)
      .where(and(
        eq(users.cellId, cellId),
        eq(users.isCellLeader, true)
      ))
      .limit(1) // For now, just get the first leader for display

    cellLeader = (cellLeaderResult && cellLeaderResult[0]) || null
  } catch (error) {
    console.error("Error fetching cell leader:", error)
    cellLeader = null
  }

  // Get cell members from users table
  let cellMembers: Array<{
    id: string
    fullName: string | null
    email: string | null
    roleInCell: string
    joinedAt: Date | null
  }> = []
  let memberCount = 0

  try {
    const cellMembersResult = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        roleInCell: users.role,
        joinedAt: users.joinedAt,
      })
      .from(users)
      .where(and(
        eq(users.cellId, cellId),
        eq(users.isActive, true)
      ))
      .orderBy(users.fullName)

    // Get member count
    const memberCountResult = await db
      .select({ count: count(users.id) })
      .from(users)
      .where(and(
        eq(users.cellId, cellId),
        eq(users.isActive, true)
      ))

    cellMembers = cellMembersResult || []
    memberCount = Number(memberCountResult[0]?.count || 0)
  } catch (error) {
    console.error("Error fetching cell members:", error)
    cellMembers = []
    memberCount = 0
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{cell.name}</h1>
          <p className="text-muted-foreground">
            Cell group management for {network.name}
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/admin/networks/${networkId}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to {network.name}
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{memberCount}</div>
            <p className="text-xs text-muted-foreground">
              Active members
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cell Leader</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {cellLeader ? "Assigned" : "None"}
            </div>
            <p className="text-xs text-muted-foreground">
              {cellLeader?.fullName || "No leader assigned"}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{network.name}</div>
            <p className="text-xs text-muted-foreground">
              Parent network
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Cell Details & Edit Form */}
        <Card>
          <CardHeader>
            <CardTitle>Cell Information</CardTitle>
            <CardDescription>
              Update cell details and assign cell leaders
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EditCellForm cell={cell} cellLeader={cellLeader} networkId={networkId} />
          </CardContent>
        </Card>

        {/* Cell Members */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Cell Members</CardTitle>
                <CardDescription>
                  Manage members of this cell group
                </CardDescription>
              </div>
              <Button size="sm" asChild>
                <Link href={`/admin/networks/${networkId}/cells/${cellId}/members`}>
                  <Users className="h-4 w-4 mr-2" />
                  Manage Members
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(cellMembers || []).map((member) => (
                <div key={member?.id || Math.random()} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{member?.fullName || "Unknown Member"}</p>
                    <p className="text-sm text-muted-foreground">
                      {member?.email || "No email"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Joined: {member?.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : "Unknown date"}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={member?.roleInCell === "LEADER" ? "default" : "secondary"}>
                      {member?.roleInCell || "MEMBER"}
                    </Badge>
                  </div>
                </div>
              ))}
              
              {(!cellMembers || cellMembers.length === 0) && (
                <div className="text-center py-6">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground mb-4">No members yet</p>
                  <Button asChild>
                    <Link href={`/admin/networks/${networkId}/cells/${cellId}/members`}>
                      Add First Member
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
