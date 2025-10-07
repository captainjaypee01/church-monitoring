import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { isNetworkLeader, isAdmin } from "@/lib/rbac"
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

  // Check if user is Network Leader or Admin
  const userRole = session.userData?.role
  const isNetworkLeaderRole = userRole === "NETWORK_LEADER" || session.userData?.isNetworkLeader
  const isAdminRole = userRole === "ADMIN"
  
  if (!isNetworkLeaderRole && !isAdminRole) {
    redirect("/dashboard")
  }

  // Get user's network(s)
  const userNetworks = []
  if (session.userData?.networkId && (isNetworkLeaderRole || isAdminRole)) {
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

  // Get cells in this network
  const cellsData = await db
    .select({
      id: cells.id,
      name: cells.name,
      leaderName: profiles.fullName,
      memberCount: count(cellMemberships.id),
    })
    .from(cells)
    .leftJoin(profiles, eq(cells.leaderId, profiles.id))
    .leftJoin(cellMemberships, eq(cells.id, cellMemberships.cellId))
    .where(eq(cells.networkId, network.id))
    .groupBy(cells.id, profiles.fullName)

  // Get monthly VIP data
  const monthlyVips = await db
    .select({ 
      count: count(),
      serviceVips: sum(meetingAttendance.isVip ? 1 : 0),
    })
    .from(meetingAttendance)
    .innerJoin(meetings, eq(meetingAttendance.meetingId, meetings.id))
    .innerJoin(cells, eq(meetings.cellId, cells.id))
    .where(and(
      eq(cells.networkId, network.id),
      gte(meetings.occurredAt, currentMonthStart)
    ))

  // Get total members in network
  const totalMembers = await db
    .select({ count: count() })
    .from(cellMemberships)
    .innerJoin(cells, eq(cellMemberships.cellId, cells.id))
    .where(eq(cells.networkId, network.id))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Network Management</h1>
        <p className="text-muted-foreground">
          Overseeing {network.name} - Monitor cell groups, attendance, and member progress.
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
            <div className="text-2xl font-bold">{cellsData.length}</div>
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
            <div className="text-2xl font-bold">{monthlyVips[0]?.serviceVips || 0}</div>
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
            <div className="text-2xl font-bold">{monthlyVips[0]?.count || 0}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Cell Groups Overview</CardTitle>
            <CardDescription>
              Monitor the performance of cell groups in your network
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {cellsData.map((cell) => (
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
                        View Details
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Cell Management
            </CardTitle>
            <CardDescription>
              Monitor and support cell leaders
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
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
          </CardContent>
        </Card>

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
      </div>
    </div>
  )
}
