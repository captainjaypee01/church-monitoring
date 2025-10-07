import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Calendar, TrendingUp, DollarSign, Plus, UserPlus, ArrowRight } from "lucide-react"
import Link from "next/link"
import { db } from "@/lib/db"
import { users, cells, networks, meetings, meetingAttendance } from "@/lib/db/schema"
import { eq, and, gte, count } from "drizzle-orm"

export default async function CellPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/login")
  }

  // Get user's cell
  const userCellId = session.userData?.cellId
  
  if (!userCellId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cell Management</h1>
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
    .where(eq(cells.id, userCellId))
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

  // Get current month start for statistics
  const currentMonthStart = new Date()
  currentMonthStart.setDate(1)
  currentMonthStart.setHours(0, 0, 0, 0)

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
      eq(users.cellId, userCellId),
      eq(users.isActive, true)
    ))
    .orderBy(users.fullName)

  // Get member count
  const memberCount = cellMembers.length

  // Get monthly meeting data
  const monthlyMeetings = await db
    .select({ 
      count: count(meetings.id),
    })
    .from(meetings)
    .where(and(
      eq(meetings.cellId, userCellId),
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
      eq(meetings.cellId, userCellId),
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
          <h1 className="text-3xl font-bold tracking-tight">Cell Management</h1>
          <p className="text-muted-foreground">
            Manage {cell.name} in {network.name} network
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button asChild>
            <Link href="/cell/members/new">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Member
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Cell Meetings
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{meetingCount}</div>
            <p className="text-xs text-muted-foreground">
              Meetings this month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Members
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{memberCount}</div>
            <p className="text-xs text-muted-foreground">
              Total members
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              VIP Members
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vipCount}</div>
            <p className="text-xs text-muted-foreground">
              VIPs this month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Cell Group
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cell.name}</div>
            <p className="text-xs text-muted-foreground">
              Your cell group
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks for cell group management
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/cell/meetings/new">
                <Plus className="h-4 w-4 mr-2" />
                Log New Meeting
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/cell/meetings">
                <Calendar className="h-4 w-4 mr-2" />
                View All Meetings
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/cell/members/new">
                <UserPlus className="h-4 w-4 mr-2" />
                Add New Member
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Cell Information */}
        <Card>
          <CardHeader>
            <CardTitle>Cell Information</CardTitle>
            <CardDescription>
              Details about your cell group
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Cell Name</p>
              <p className="text-lg font-semibold">{cell.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Network</p>
              <p className="text-lg font-semibold">{network.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Description</p>
              <p className="text-sm">{cell.description || "No description available"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Created</p>
              <p className="text-sm">{new Date(cell.createdAt).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest updates from your cell group
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <div>
                  <p className="text-sm font-medium">Meeting logged</p>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                <div>
                  <p className="text-sm font-medium">New member joined</p>
                  <p className="text-xs text-muted-foreground">1 day ago</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                <div>
                  <p className="text-sm font-medium">Training completed</p>
                  <p className="text-xs text-muted-foreground">3 days ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Members Management Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Cell Members</CardTitle>
              <CardDescription>
                Manage members of {cell.name} cell group ({memberCount} members)
              </CardDescription>
            </div>
            <Button asChild>
              <Link href="/cell/members/new">
                <UserPlus className="h-4 w-4 mr-2" />
                Add New Member
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {cellMembers.length > 0 ? (
            <div className="space-y-4">
              {/* Members List - First 5 members shown, with "View All" option */}
              {cellMembers.slice(0, 5).map((member) => (
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
              
              {/* Show note if there are more than 5 members */}
              {cellMembers.length > 5 && (
                <div className="text-center pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Showing first 5 of {memberCount} members
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground mb-4">No members yet</p>
              <Button asChild>
                <Link href="/cell/members/new">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add First Member
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
