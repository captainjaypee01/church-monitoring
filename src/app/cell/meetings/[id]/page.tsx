import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { 
  meetings, 
  meetingAttendance, 
  giving, 
  trainingProgress,
  profiles,
  trainingLevels,
  cells,
  users 
} from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Users, BookOpen, DollarSign, Camera, ArrowLeft } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface MeetingDetailPageProps {
  params: {
    id: string
  }
}

export default async function MeetingDetailPage({ params }: MeetingDetailPageProps) {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/login")
  }

  // Fetch meeting with related data
  const [meeting] = await db
    .select({
      id: meetings.id,
      cellId: meetings.cellId,
      leaderUserId: meetings.leaderUserId,
      occurredAt: meetings.occurredAt,
      notes: meetings.notes,
      groupPictureUrl: meetings.groupPictureUrl,
      createdAt: meetings.createdAt,
      cellName: cells.name,
      leaderName: users.name,
    })
    .from(meetings)
    .innerJoin(cells, eq(meetings.cellId, cells.id))
    .innerJoin(users, eq(meetings.leaderUserId, users.id))
    .where(eq(meetings.id, params.id))
    .limit(1)

  if (!meeting) {
    redirect("/cell")
  }

  // Check permissions
  const userCellId = session.userData?.cellId
  const isAdmin = session.userData?.role === "ADMIN" || false
  
  if (!isAdmin && userCellId !== meeting.cellId) {
    redirect("/dashboard")
  }

  // Fetch attendance data
  const attendance = await db
    .select({
      profileId: meetingAttendance.profileId,
      isVip: meetingAttendance.isVip,
      present: meetingAttendance.present,
      remarks: meetingAttendance.remarks,
      memberName: profiles.fullName,
    })
    .from(meetingAttendance)
    .innerJoin(profiles, eq(meetingAttendance.profileId, profiles.id))
    .where(eq(meetingAttendance.meetingId, params.id))

  // Fetch giving data
  const [givingData] = await db
    .select()
    .from(giving)
    .where(eq(giving.meetingId, params.id))
    .limit(1)

  // Fetch training updates
  const trainingUpdates = await db
    .select({
      profileId: trainingProgress.profileId,
      completedAt: trainingProgress.completedAt,
      notes: trainingProgress.notes,
      memberName: profiles.fullName,
      levelCode: trainingLevels.code,
      levelTitle: trainingLevels.title,
    })
    .from(trainingProgress)
    .innerJoin(profiles, eq(trainingProgress.profileId, profiles.id))
    .innerJoin(trainingLevels, eq(trainingProgress.levelId, trainingLevels.id))
    .where(eq(trainingProgress.completedAt, meeting.occurredAt))

  const presentCount = attendance.filter(a => a.present).length
  const vipCount = attendance.filter(a => a.present && a.isVip).length
  const totalMembers = attendance.length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/cell/meetings">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Meetings
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Meeting Details</h1>
            <p className="text-muted-foreground">
              {meeting.cellName} • {new Date(meeting.occurredAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Meeting Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{presentCount}/{totalMembers}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((presentCount / totalMembers) * 100)}% attendance rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">VIPs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vipCount}</div>
            <p className="text-xs text-muted-foreground">
              {presentCount > 0 ? Math.round((vipCount / presentCount) * 100) : 0}% of attendees
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Training Updates</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trainingUpdates.length}</div>
            <p className="text-xs text-muted-foreground">
              Completions recorded
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
              {givingData ? 
                `${givingData.currency} ${(parseFloat(givingData.tithesAmount) + parseFloat(givingData.offeringsAmount)).toFixed(2)}` 
                : "$0.00"
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Tithes and offerings
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Meeting Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Meeting Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium">Date & Time</p>
              <p className="text-muted-foreground">
                {new Date(meeting.occurredAt).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="font-medium">Cell Group</p>
              <p className="text-muted-foreground">{meeting.cellName}</p>
            </div>
            <div>
              <p className="font-medium">Led by</p>
              <p className="text-muted-foreground">{meeting.leaderName}</p>
            </div>
            {meeting.notes && (
              <div>
                <p className="font-medium">Notes</p>
                <p className="text-muted-foreground">{meeting.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {meeting.groupPictureUrl && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Camera className="mr-2 h-5 w-5" />
                Group Photo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-video rounded-lg overflow-hidden">
                <Image
                  src={meeting.groupPictureUrl}
                  alt="Group photo"
                  fill
                  className="object-cover"
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Attendance Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5" />
            Attendance Details
          </CardTitle>
          <CardDescription>Member attendance and VIP status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {attendance.map((member) => (
              <div key={member.profileId} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${member.present ? 'bg-green-500' : 'bg-red-500'}`} />
                  <div>
                    <p className="font-medium">{member.memberName}</p>
                    {member.remarks && (
                      <p className="text-sm text-muted-foreground">{member.remarks}</p>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Badge variant={member.present ? "default" : "secondary"}>
                    {member.present ? "Present" : "Absent"}
                  </Badge>
                  {member.present && member.isVip && (
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                      VIP
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Giving Breakdown */}
      {givingData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="mr-2 h-5 w-5" />
              Giving Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {givingData.currency} {parseFloat(givingData.tithesAmount).toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground">Tithes</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {givingData.currency} {parseFloat(givingData.offeringsAmount).toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground">Offerings</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">
                  {givingData.currency} {(parseFloat(givingData.tithesAmount) + parseFloat(givingData.offeringsAmount)).toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Training Updates */}
      {trainingUpdates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="mr-2 h-5 w-5" />
              Training Progress Updates
            </CardTitle>
            <CardDescription>Members who completed training levels</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {trainingUpdates.map((update, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium">{update.memberName}</p>
                    <p className="text-sm text-muted-foreground">
                      Completed {update.levelCode} - {update.levelTitle}
                    </p>
                    {update.notes && (
                      <p className="text-xs text-muted-foreground mt-1">{update.notes}</p>
                    )}
                  </div>
                  <Badge className="bg-green-100 text-green-700 border-green-200">
                    Completed
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
