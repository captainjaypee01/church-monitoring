import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { isNetworkLeader, isAdmin, isCellLeader } from "@/lib/rbac"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Calendar, TrendingUp, DollarSign, ArrowLeft, Plus, Settings } from "lucide-react"
import Link from "next/link"
import { db } from "@/lib/db"
import { networks, cells, users, meetings, meetingAttendance } from "@/lib/db/schema"
import { eq, and, count, gte, sum } from "drizzle-orm"

interface CellDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function CellDetailPage({ params }: CellDetailPageProps) {
  const session = await auth()
  const { id: cellId } = await params
  
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

  // Fetch cell details
  const [cell] = await db
    .select()
    .from(cells)
    .where(eq(cells.id, cellId))
    .limit(1)

  if (!cell) {
    notFound()
  }

  // Check if user has access to this cell
  if (isCellLeaderRole && !isNetworkLeaderRole && !isAdminRole && session.userData?.cellId !== cellId) {
    redirect("/network")
  }

  // Fetch network details
  const [network] = await db
    .select()
    .from(networks)
    .where(eq(networks.id, cell.networkId))
    .limit(1)

  if (!network) {
    notFound()
  }

  // Get cell leader
  const [cellLeader] = await db
    .select({
      id: users.id,
      name: users.name,
      fullName: users.fullName,
      email: users.email,
    })
    .from(users)
    .where(and(
      eq(users.cellId, cellId),
      eq(users.isCellLeader, true)
    ))
    .limit(1)

  // Get cell members
  const cellMembers = await db
    .select({
      id: users.id,
      name: users.name,
      fullName: users.fullName,
      email: users.email,
      role: users.role,
      joinedAt: users.joinedAt,
    })
    .from(users)
    .where(and(
      eq(users.cellId, cellId),
      eq(users.isActive, true)
    ))
    .orderBy(users.fullName)

  // Get member count
  const memberCount = cellMembers.length

  // Get current month data
  const currentMonthStart = new Date()
  currentMonthStart.setDate(1)
  currentMonthStart.setHours(0, 0, 0, 0)

  // Get monthly meeting data
  const monthlyMeetings = await db
    .select({ 
      count: count(meetings.id),
    })
    .from(meetings)
    .where(and(
      eq(meetings.cellId, cellId),
      gte(meetings.occurredAt, currentMonthStart)
    ))

  // Get monthly VIP data
  const monthlyVips = await db
    .select({ 
      count: count(meetingAttendance.id),
    })
    .from(meetingAttendance)
    .innerJoin(meetings, eq(meetingAttendance.meetingId, meetings.id))
    .where(and(
      eq(meetings.cellId, cellId),
      gte(meetings.occurredAt, currentMonthStart),
      eq(meetingAttendance.isVip, true)
    ))

  const meetingCount = Number(monthlyMeetings[0]?.count || 0)
  const vipCount = Number(monthlyVips[0]?.count || 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{cell.name}</h1>
          <p className="text-muted-foreground">
            {isCellLeaderRole && !isNetworkLeaderRole && !isAdminRole 
              ? `Manage your cell group in ${network.name}`
              : `Cell group management for ${network.name}`
            }
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/network/cells">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Cells
            </Link>
          </Button>
          {(isNetworkLeaderRole || isAdminRole) && (
            <Button asChild>
              <Link href={`/admin/networks/${network.id}/cells/${cellId}`}>
                <Settings className="h-4 w-4 mr-2" />
                Admin Settings
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
            <CardTitle className="text-sm font-medium">Monthly Meetings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{meetingCount}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">VIP Members</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vipCount}</div>
            <p className="text-xs text-muted-foreground">
              This month
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
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Cell Information */}
        <Card>
          <CardHeader>
            <CardTitle>Cell Information</CardTitle>
            <CardDescription>
              Basic information about this cell group
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium">Name</p>
              <p className="text-sm text-muted-foreground">{cell.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Description</p>
              <p className="text-sm text-muted-foreground">{cell.description || "No description"}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Meeting Day</p>
              <p className="text-sm text-muted-foreground">{cell.meetingDay || "Not set"}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Meeting Time</p>
              <p className="text-sm text-muted-foreground">
                {cell.meetingTime ? new Date(`2000-01-01T${cell.meetingTime}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Not set"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Network</p>
              <p className="text-sm text-muted-foreground">{network.name}</p>
            </div>
          </CardContent>
        </Card>

        {/* Cell Members */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Cell Members</CardTitle>
                <CardDescription>
                  Members of this cell group
                </CardDescription>
              </div>
              <Button size="sm" asChild>
                <Link href={`/cell/members`}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Member
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {cellMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{member.fullName || member.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {member.email || "No email"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Joined: {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : "Unknown date"}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={member.role === "CELL_LEADER" ? "default" : "secondary"}>
                      {member.role}
                    </Badge>
                  </div>
                </div>
              ))}
              
              {cellMembers.length === 0 && (
                <div className="text-center py-6">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground mb-4">No members yet</p>
                  <Button asChild>
                    <Link href={`/cell/members`}>
                      Add First Member
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Meetings
            </CardTitle>
            <CardDescription>
              Manage cell group meetings
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Members
            </CardTitle>
            <CardDescription>
              Manage cell group members
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/cell/members">
                Manage Members
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/cell/members/new">
                Add New Member
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Reports
            </CardTitle>
            <CardDescription>
              View cell group reports
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
      </div>
    </div>
  )
}
