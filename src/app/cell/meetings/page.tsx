import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { meetings, cells, users, giving, meetingAttendance } from "@/lib/db/schema"
import { eq, desc, and, count, sum } from "drizzle-orm"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Calendar, Users, DollarSign, Eye } from "lucide-react"
import Link from "next/link"

export default async function CellMeetingsPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/login")
  }

  // Get user's cell (assuming first cell for now)
  const userCellId = session.userData?.cellId
  
  if (!userCellId) {
    redirect("/dashboard")
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

  // Fetch meetings with summary data
  const meetingsData = await db
    .select({
      id: meetings.id,
      occurredAt: meetings.occurredAt,
      notes: meetings.notes,
      groupPictureUrl: meetings.groupPictureUrl,
      createdAt: meetings.createdAt,
      leaderName: users.name,
    })
    .from(meetings)
    .innerJoin(users, eq(meetings.leaderUserId, users.id))
    .where(eq(meetings.cellId, userCellId))
    .orderBy(desc(meetings.occurredAt))
    .limit(20)

  // Get attendance summary for each meeting
  const meetingsWithStats = await Promise.all(
    meetingsData.map(async (meeting) => {
      // Get attendance stats
      const [attendanceStats] = await db
        .select({
          totalMembers: count(),
          presentCount: sum(meetingAttendance.present),
          vipCount: count(and(meetingAttendance.present, meetingAttendance.isVip)),
        })
        .from(meetingAttendance)
        .where(eq(meetingAttendance.meetingId, meeting.id))

      // Get giving data
      const [givingData] = await db
        .select()
        .from(giving)
        .where(eq(giving.meetingId, meeting.id))
        .limit(1)

      return {
        ...meeting,
        attendanceStats: {
          totalMembers: Number(attendanceStats?.totalMembers || 0),
          presentCount: Number(attendanceStats?.presentCount || 0),
          vipCount: Number(attendanceStats?.vipCount || 0),
        },
        giving: givingData,
      }
    })
  )

  const totalMeetings = meetingsWithStats.length
  const avgAttendance = totalMeetings > 0 
    ? Math.round(meetingsWithStats.reduce((sum, m) => sum + (m.attendanceStats.presentCount / m.attendanceStats.totalMembers), 0) / totalMeetings * 100)
    : 0

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cell Meetings</h1>
          <p className="text-muted-foreground">
            Meeting history and logs for {cell.name}
          </p>
        </div>
        <Button asChild>
          <Link href="/cell/meetings/new">
            <Plus className="mr-2 h-4 w-4" />
            Log New Meeting
          </Link>
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Meetings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMeetings}</div>
            <p className="text-xs text-muted-foreground">
              Logged meetings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Attendance</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgAttendance}%</div>
            <p className="text-xs text-muted-foreground">
              Across all meetings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Giving</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${meetingsWithStats.reduce((sum, m) => 
                sum + (m.giving ? parseFloat(m.giving.tithesAmount) + parseFloat(m.giving.offeringsAmount) : 0), 0
              ).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Combined tithes & offerings
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Meetings List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Meetings</CardTitle>
          <CardDescription>Click on a meeting to view detailed information</CardDescription>
        </CardHeader>
        <CardContent>
          {meetingsWithStats.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No meetings logged</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by logging your first meeting.</p>
              <div className="mt-6">
                <Button asChild>
                  <Link href="/cell/meetings/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Log New Meeting
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {meetingsWithStats.map((meeting) => (
                <div key={meeting.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="font-medium">
                          {new Date(meeting.occurredAt).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(meeting.occurredAt).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })} • Led by {meeting.leaderName}
                        </p>
                      </div>
                    </div>
                    {meeting.notes && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {meeting.notes}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="flex space-x-2 mb-1">
                        <Badge variant="outline">
                          {meeting.attendanceStats.presentCount}/{meeting.attendanceStats.totalMembers} present
                        </Badge>
                        {meeting.attendanceStats.vipCount > 0 && (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            {meeting.attendanceStats.vipCount} VIPs
                          </Badge>
                        )}
                      </div>
                      {meeting.giving && (
                        <p className="text-sm text-muted-foreground">
                          {meeting.giving.currency} {(parseFloat(meeting.giving.tithesAmount) + parseFloat(meeting.giving.offeringsAmount)).toFixed(2)} giving
                        </p>
                      )}
                      {meeting.groupPictureUrl && (
                        <p className="text-xs text-muted-foreground">📷 Photo attached</p>
                      )}
                    </div>
                    
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/cell/meetings/${meeting.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
