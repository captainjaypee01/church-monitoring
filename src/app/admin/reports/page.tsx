import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { canViewReports } from "@/lib/rbac"
import { db } from "@/lib/db"
import { 
  meetings, 
  meetingAttendance, 
  giving, 
  eventRegistrations,
  events,
  users,
  networks,
  cells,
  trainingProgress,
  trainingLevels
} from "@/lib/db/schema"
import { count, sum, eq, gte, lt, and } from "drizzle-orm"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  BarChart3, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  Download,
  BookOpen,
  UserCheck
} from "lucide-react"
import Link from "next/link"

export default async function AdminReportsPage() {
  const session = await auth()
  
  if (!session?.user || !canViewReports(session)) {
    redirect("/dashboard")
  }

  // Get current month start date
  const currentMonthStart = new Date()
  currentMonthStart.setDate(1)
  currentMonthStart.setHours(0, 0, 0, 0)

  // Get last month start date
  const lastMonthStart = new Date()
  lastMonthStart.setMonth(lastMonthStart.getMonth() - 1)
  lastMonthStart.setDate(1)
  lastMonthStart.setHours(0, 0, 0, 0)

  // Fetch key metrics
  const [totalMembers] = await db
    .select({ count: count() })
    .from(users)
    .where(eq(users.isActive, true))

  const [totalMeetings] = await db
    .select({ count: count() })
    .from(meetings)

  const [totalGiving] = await db
    .select({ 
      totalTithes: sum(giving.tithesAmount),
      totalOfferings: sum(giving.offeringsAmount) 
    })
    .from(giving)

  const [currentMonthVips] = await db
    .select({ count: count() })
    .from(meetingAttendance)
    .innerJoin(meetings, eq(meetingAttendance.meetingId, meetings.id))
    .where(and(
      eq(meetingAttendance.isVip, true),
      eq(meetingAttendance.present, true),
      gte(meetings.occurredAt, currentMonthStart)
    ))

  const [lastMonthVips] = await db
    .select({ count: count() })
    .from(meetingAttendance)
    .innerJoin(meetings, eq(meetingAttendance.meetingId, meetings.id))
    .where(and(
      eq(meetingAttendance.isVip, true),
      eq(meetingAttendance.present, true),
      gte(meetings.occurredAt, lastMonthStart),
      lt(meetings.occurredAt, currentMonthStart)
    ))

  // Calculate VIP growth
  const vipGrowth = Number(lastMonthVips?.count || 0) > 0 
    ? Math.round(((Number(currentMonthVips?.count || 0) - Number(lastMonthVips?.count || 0)) / Number(lastMonthVips?.count || 0)) * 100)
    : 0

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Church-wide insights and data exports
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Number(totalMembers?.count || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Active church members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Meetings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Number(totalMeetings?.count || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Cell meetings logged
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">VIPs This Month</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Number(currentMonthVips?.count || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {vipGrowth > 0 ? '+' : ''}{vipGrowth}% from last month
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
              ${(parseFloat(totalGiving?.totalTithes || "0") + parseFloat(totalGiving?.totalOfferings || "0")).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Tithes and offerings
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Reports</CardTitle>
          <CardDescription>Generate and download common reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Users className="h-6 w-6" />
              <span className="font-medium">Attendance Report</span>
              <span className="text-sm text-muted-foreground text-center">
                Member attendance across all meetings
              </span>
            </Button>

            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <DollarSign className="h-6 w-6" />
              <span className="font-medium">Giving Report</span>
              <span className="text-sm text-muted-foreground text-center">
                Tithes and offerings breakdown
              </span>
            </Button>

            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <UserCheck className="h-6 w-6" />
              <span className="font-medium">VIP Report</span>
              <span className="text-sm text-muted-foreground text-center">
                Visitor tracking and follow-up
              </span>
            </Button>

            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <BookOpen className="h-6 w-6" />
              <span className="font-medium">Training Report</span>
              <span className="text-sm text-muted-foreground text-center">
                Member training progress
              </span>
            </Button>

            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Calendar className="h-6 w-6" />
              <span className="font-medium">Events Report</span>
              <span className="text-sm text-muted-foreground text-center">
                Event registrations and attendance
              </span>
            </Button>

            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <BarChart3 className="h-6 w-6" />
              <span className="font-medium">Growth Analytics</span>
              <span className="text-sm text-muted-foreground text-center">
                Church growth metrics and trends
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* VIP Insights */}
      <Card>
        <CardHeader>
          <CardTitle>VIP Insights</CardTitle>
          <CardDescription>Visitor engagement and conversion tracking</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {Number(currentMonthVips?.count || 0)}
                </div>
                <p className="text-sm text-muted-foreground">VIPs This Month</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {Number(lastMonthVips?.count || 0)}
                </div>
                <p className="text-sm text-muted-foreground">VIPs Last Month</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className={`text-2xl font-bold ${vipGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {vipGrowth > 0 ? '+' : ''}{vipGrowth}%
                </div>
                <p className="text-sm text-muted-foreground">Month-over-Month Growth</p>
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-muted-foreground text-sm mb-4">
                VIP trends help track visitor engagement and conversion rates across services and cell groups.
              </p>
              <Button>
                <TrendingUp className="mr-2 h-4 w-4" />
                View Detailed VIP Analytics
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Summary</CardTitle>
          <CardDescription>Key metrics for the current month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <div>
                <p className="font-medium">Cell Meetings Logged</p>
                <p className="text-sm text-muted-foreground">This month</p>
              </div>
              <Badge variant="outline">Loading...</Badge>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <div>
                <p className="font-medium">Training Completions</p>
                <p className="text-sm text-muted-foreground">This month</p>
              </div>
              <Badge variant="outline">Loading...</Badge>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
              <div>
                <p className="font-medium">Event Registrations</p>
                <p className="text-sm text-muted-foreground">This month</p>
              </div>
              <Badge variant="outline">Loading...</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
