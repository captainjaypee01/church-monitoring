import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { isNetworkLeader, isAdmin, isCellLeader } from "@/lib/rbac"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Calendar, TrendingUp, DollarSign, BarChart3, Target } from "lucide-react"
import Link from "next/link"
import { db } from "@/lib/db"
import { networks, cells, users, meetings, meetingAttendance } from "@/lib/db/schema"
import { eq, and, gte, count, sum } from "drizzle-orm"

export default async function NetworkPage() {
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

  // Get user's network(s)
  const userNetworks = []
  if (session.userData?.networkId && (isNetworkLeaderRole || isCellLeaderRole || isAdminRole)) {
    userNetworks.push(session.userData.networkId)
  }

  if (userNetworks.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Network Management</h1>
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

  // Get current month data
  const currentMonthStart = new Date()
  currentMonthStart.setDate(1)
  currentMonthStart.setHours(0, 0, 0, 0)

  // Fetch network data
  const networksData = await db
    .select({
      id: networks.id,
      name: networks.name,
      description: networks.description,
    })
    .from(networks)
    .where(eq(networks.id, userNetworks[0]))

  const network = networksData[0]
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
      leaderName: users.fullName,
    })
    .from(cells)
    .leftJoin(users, and(
      eq(users.cellId, cells.id),
      eq(users.isCellLeader, true)
    ))
    .where(cellsWhereCondition)
    .groupBy(cells.id, users.fullName)

  // Get member count for each cell separately
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

  // Get monthly meeting data (filtered by user role)
  let meetingsWhereCondition = and(
    eq(cells.networkId, network.id),
    gte(meetings.occurredAt, currentMonthStart)
  )
  
  // If user is Cell Leader, only count meetings for their cell
  if (isCellLeaderRole && !isNetworkLeaderRole && !isAdminRole && session.userData?.cellId) {
    meetingsWhereCondition = and(
      eq(cells.networkId, network.id),
      eq(meetings.cellId, session.userData.cellId),
      gte(meetings.occurredAt, currentMonthStart)
    )!
  }

  const monthlyMeetings = await db
    .select({ 
      count: count(meetingAttendance.id),
    })
    .from(meetingAttendance)
    .innerJoin(meetings, eq(meetingAttendance.meetingId, meetings.id))
    .innerJoin(cells, eq(meetings.cellId, cells.id))
    .where(meetingsWhereCondition)

  // Get monthly VIP data (filtered by user role)
  let vipWhereCondition = and(
    eq(cells.networkId, network.id),
    gte(meetings.occurredAt, currentMonthStart),
    eq(meetingAttendance.isVip, true)
  )
  
  // If user is Cell Leader, only count VIPs for their cell
  if (isCellLeaderRole && !isNetworkLeaderRole && !isAdminRole && session.userData?.cellId) {
    vipWhereCondition = and(
      eq(cells.networkId, network.id),
      eq(meetings.cellId, session.userData.cellId),
      gte(meetings.occurredAt, currentMonthStart),
      eq(meetingAttendance.isVip, true)
    )!
  }

  const monthlyVips = await db
    .select({ 
      count: count(meetingAttendance.id),
    })
    .from(meetingAttendance)
    .innerJoin(meetings, eq(meetingAttendance.meetingId, meetings.id))
    .innerJoin(cells, eq(meetings.cellId, cells.id))
    .where(vipWhereCondition)

  // Get total members in network (filtered by user role)
  let membersWhereCondition = and(
    eq(cells.networkId, network.id),
    eq(users.isActive, true)
  )!
  
  // If user is Cell Leader, only count members in their cell
  if (isCellLeaderRole && !isNetworkLeaderRole && !isAdminRole && session.userData?.cellId) {
    membersWhereCondition = and(
      eq(cells.networkId, network.id),
      eq(users.cellId, session.userData.cellId),
      eq(users.isActive, true)
    )!
  }

  const totalMembers = await db
    .select({ count: count(users.id) })
    .from(users)
    .innerJoin(cells, eq(users.cellId, cells.id))
    .where(membersWhereCondition)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {isCellLeaderRole && !isNetworkLeaderRole && !isAdminRole ? "Network Overview" : "Network Management"}
        </h1>
        <p className="text-muted-foreground">
          {isCellLeaderRole && !isNetworkLeaderRole && !isAdminRole 
            ? `Viewing ${network.name} - Monitor your cell group and network details.`
            : `Overseeing ${network.name} - Monitor cell groups, attendance, and member progress.`
          }
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Members
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMembers[0]?.count || 0}</div>
            <p className="text-xs text-muted-foreground">
              Across all cells
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Cell Groups
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cellsWithMemberCount.length}</div>
            <p className="text-xs text-muted-foreground">
              Active cell groups
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Monthly VIPs
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthlyVips[0]?.count || 0}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Cell Meetings
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthlyMeetings[0]?.count || 0}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              {isCellLeaderRole && !isNetworkLeaderRole && !isAdminRole ? "Your Cell Group" : "Cell Groups Overview"}
            </CardTitle>
            <CardDescription>
              {isCellLeaderRole && !isNetworkLeaderRole && !isAdminRole 
                ? "Monitor the performance of your cell group"
                : "Monitor the performance of cell groups in your network"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {cellsWithMemberCount.map((cell) => (
                <div key={cell.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{cell.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Leader: {cell.leaderName || "Unassigned"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{cell.memberCount} members</p>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/network/cells/${cell.id}`}>
                        {isCellLeaderRole && !isNetworkLeaderRole && !isAdminRole ? "Manage Cell" : "View Details"}
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Insights</CardTitle>
            <CardDescription>
              Key metrics and trends for {network.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Network Growth</span>
                <span className="text-sm text-green-600">+12%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">VIP Engagement</span>
                <span className="text-sm text-blue-600">85%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Cell Attendance</span>
                <span className="text-sm text-green-600">+8%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Training Progress</span>
                <span className="text-sm text-muted-foreground">67%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {!isCellLeaderRole || isNetworkLeaderRole || isAdminRole ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Network Reports
              </CardTitle>
              <CardDescription>
                Generate comprehensive network analytics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href="/network/reports">
                  View Network Reports
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/network/reports/vip-trends">
                  VIP Trends
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Cell Meetings
              </CardTitle>
              <CardDescription>
                Manage your cell group meetings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href="/cell/meetings/new">
                  Log New Meeting
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/cell/meetings">
                  View All Meetings
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              {isCellLeaderRole && !isNetworkLeaderRole && !isAdminRole ? "Cell Management" : "Cell Management"}
            </CardTitle>
            <CardDescription>
              {isCellLeaderRole && !isNetworkLeaderRole && !isAdminRole 
                ? "Manage your cell group members"
                : "Monitor and support cell leaders"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {isCellLeaderRole && !isNetworkLeaderRole && !isAdminRole ? (
              <>
                <Button asChild className="w-full">
                  <Link href={`/cell`}>
                    Manage My Cell
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/cell/members/new`}>
                    Add Members
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/cell/members`}>
                    View Members
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild className="w-full">
                  <Link href="/network/cells">
                    View All Cells
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/network/leaders">
                    Cell Leaders
                  </Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {!isCellLeaderRole || isNetworkLeaderRole || isAdminRole ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Performance
              </CardTitle>
              <CardDescription>
                Track network performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href="/network/performance">
                  Performance Dashboard
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/network/analytics">
                  Advanced Analytics
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2" />
                Cell Reports
              </CardTitle>
              <CardDescription>
                View your cell group performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href="/cell/reports">
                  Cell Reports
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/cell/attendance">
                  Attendance History
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
