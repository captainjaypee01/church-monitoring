import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { isNetworkLeader, isAdmin, isCellLeader } from "@/lib/rbac"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Plus, Settings, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { db } from "@/lib/db"
import { networks, cells, users } from "@/lib/db/schema"
import { eq, and, count } from "drizzle-orm"

export default async function NetworkCellsPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/login")
  }

  // Check if user is Network Leader, Cell Leader, or Admin
  const userRole = session.userData?.role
  const isNetworkLeaderRole = userRole === "NETWORK_LEADER" || session.userData?.isNetworkLeader
  const isCellLeaderRole = userRole === "CELL_LEADER" || session.userData?.isCellLeader
  const isAdminRole = userRole === "ADMIN"
  
  if (!isNetworkLeaderRole && !isCellLeaderRole && !isAdminRole) {
    redirect("/dashboard")
  }

  // Get user's network
  if (!session.userData?.networkId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cell Management</h1>
          <p className="text-muted-foreground">
            You are not assigned to any network.
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>No Network Assignment</CardTitle>
            <CardDescription>
              Please contact your administrator to be assigned to a network.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Fetch network details
  const [network] = await db
    .select()
    .from(networks)
    .where(eq(networks.id, session.userData.networkId))
    .limit(1)

  if (!network) {
    redirect("/dashboard")
  }

  // Get cells in this network (filtered by user role)
  let cellsWhereCondition = eq(cells.networkId, network.id)
  
  // If user is Cell Leader, only show their assigned cell
  if (isCellLeaderRole && !isNetworkLeaderRole && !isAdminRole && session.userData?.cellId) {
    cellsWhereCondition = and(
      eq(cells.networkId, network.id),
      eq(cells.id, session.userData.cellId)
    )!
  }

  const cellsData = await db
    .select({
      id: cells.id,
      name: cells.name,
      description: cells.description,
      meetingDay: cells.meetingDay,
      meetingTime: cells.meetingTime,
    })
    .from(cells)
    .where(cellsWhereCondition)
    .orderBy(cells.name)

  // Get member count for each cell
  const cellsWithMemberCount = await Promise.all(
    cellsData.map(async (cell) => {
      const memberCountResult = await db
        .select({ count: count(users.id) })
        .from(users)
        .where(and(
          eq(users.cellId, cell.id),
          eq(users.isActive, true)
        ))
      
      return {
        ...cell,
        memberCount: Number(memberCountResult[0]?.count || 0)
      }
    })
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isCellLeaderRole && !isNetworkLeaderRole && !isAdminRole ? "My Cell Group" : "Cell Management"}
          </h1>
          <p className="text-muted-foreground">
            {isCellLeaderRole && !isNetworkLeaderRole && !isAdminRole 
              ? `Manage your cell group in ${network.name}`
              : `Manage cell groups in ${network.name}`
            }
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/network">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Network
            </Link>
          </Button>
          {(isNetworkLeaderRole || isAdminRole) && (
            <Button asChild>
              <Link href={`/admin/networks/${network.id}/cells/new`}>
                <Plus className="h-4 w-4 mr-2" />
                Create Cell
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cells</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cellsWithMemberCount.length}</div>
            <p className="text-xs text-muted-foreground">
              {isCellLeaderRole && !isNetworkLeaderRole && !isAdminRole ? "Your cell group" : "Active cell groups"}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {cellsWithMemberCount.reduce((sum, cell) => sum + cell.memberCount, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {isCellLeaderRole && !isNetworkLeaderRole && !isAdminRole ? "In your cell" : "Across all cells"}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Members/Cell</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {cellsWithMemberCount.length > 0 
                ? Math.round(cellsWithMemberCount.reduce((sum, cell) => sum + cell.memberCount, 0) / cellsWithMemberCount.length)
                : 0
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Average per cell
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cells List */}
      <div className="grid gap-4">
        {cellsWithMemberCount.map((cell) => (
          <Card key={cell.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    {cell.name}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {cell.description || "No description available"}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">
                    {cell.memberCount} members
                  </Badge>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/network/cells/${cell.id}`}>
                      <Settings className="h-4 w-4 mr-1" />
                      {isCellLeaderRole && !isNetworkLeaderRole && !isAdminRole ? "Manage" : "View Details"}
                    </Link>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{cell.memberCount} members</p>
                    <p className="text-xs text-muted-foreground">Total members</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{cell.meetingDay || "Not set"}</p>
                    <p className="text-xs text-muted-foreground">Meeting day</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      {cell.meetingTime ? new Date(`2000-01-01T${cell.meetingTime}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Not set"}
                    </p>
                    <p className="text-xs text-muted-foreground">Meeting time</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {cellsWithMemberCount.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Cell Groups Found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {isCellLeaderRole && !isNetworkLeaderRole && !isAdminRole 
                ? "You are not assigned to any cell group yet."
                : "Get started by creating your first cell group."
              }
            </p>
            {(isNetworkLeaderRole || isAdminRole) && (
              <Button asChild>
                <Link href={`/admin/networks/${network.id}/cells/new`}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Cell Group
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
