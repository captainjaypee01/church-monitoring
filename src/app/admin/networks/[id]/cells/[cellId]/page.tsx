import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { isAdmin } from "@/lib/rbac"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EditCellForm } from "@/components/cells/edit-cell-form"
import { db } from "@/lib/db"
import { networks, cells, cellMemberships, profiles, userRoles, users } from "@/lib/db/schema"
import { eq, count, and } from "drizzle-orm"
import { Building, Users, Settings, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface CellDetailPageProps {
  params: Promise<{ id: string; cellId: string }>
}

export default async function CellDetailPage({ params }: CellDetailPageProps) {
  const session = await auth()
  const { id: networkId, cellId } = await params
  
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

  // Get cell leader
  const cellLeaderResult = await db
    .select({
      id: users.id,
      fullName: profiles.fullName,
      email: users.email,
    })
    .from(userRoles)
    .innerJoin(users, eq(userRoles.userId, users.id))
    .innerJoin(profiles, eq(users.id, profiles.userId))
    .where(and(
      eq(userRoles.role, "CELL_LEADER"),
      eq(userRoles.cellId, cellId)
    ))
    .limit(1)

  const cellLeader = cellLeaderResult[0] || null

  // Get cell members
  const cellMembers = await db
    .select({
      id: profiles.id,
      fullName: profiles.fullName,
      email: users.email,
      roleInCell: cellMemberships.roleInCell,
      joinedAt: cellMemberships.createdAt,
    })
    .from(cellMemberships)
    .innerJoin(profiles, eq(cellMemberships.profileId, profiles.id))
    .innerJoin(users, eq(profiles.userId, users.id))
    .where(eq(cellMemberships.cellId, cellId))
    .orderBy(profiles.fullName)

  // Get member count
  const memberCountResult = await db
    .select({ count: count() })
    .from(cellMemberships)
    .where(eq(cellMemberships.cellId, cellId))

  const memberCount = (memberCountResult && memberCountResult[0]?.count) || 0

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/admin/networks/${networkId}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to {network.name}
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{cell.name}</h1>
          <p className="text-muted-foreground">
            Cell group management for {network.name}
          </p>
        </div>
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
              {cellMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{member.fullName}</p>
                    <p className="text-sm text-muted-foreground">
                      {member.email}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Joined: {new Date(member.joinedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={member.roleInCell === "LEADER" ? "default" : "secondary"}>
                      {member.roleInCell}
                    </Badge>
                  </div>
                </div>
              ))}
              
              {cellMembers.length === 0 && (
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
