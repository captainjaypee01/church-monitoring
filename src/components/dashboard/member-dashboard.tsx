import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Users, BookOpen, DollarSign, TrendingUp } from "lucide-react"
import Link from "next/link"

interface MemberDashboardProps {
  user: any
  permissions: any
}

export function MemberDashboard({ user, permissions }: MemberDashboardProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user.name}!</h1>
        <p className="text-muted-foreground">
          Here's an overview of your church activities and progress.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance This Month</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4/4</div>
            <p className="text-xs text-muted-foreground">
              Perfect attendance!
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Training Progress</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">L2</div>
            <p className="text-xs text-muted-foreground">
              Foundation Level 2 completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Event</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">
              Days until Church Retreat 2024
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Giving YTD</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$2,400</div>
            <p className="text-xs text-muted-foreground">
              Tithes and offerings combined
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Upcoming Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Cell Meetings</CardTitle>
            <CardDescription>Your recent attendance and participation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <p className="font-medium">Friday Cell Meeting</p>
                <p className="text-sm text-muted-foreground">December 8, 2023</p>
              </div>
              <div className="text-green-600 font-medium">Present</div>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <p className="font-medium">Friday Cell Meeting</p>
                <p className="text-sm text-muted-foreground">December 1, 2023</p>
              </div>
              <div className="text-green-600 font-medium">Present (VIP)</div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Friday Cell Meeting</p>
                <p className="text-sm text-muted-foreground">November 24, 2023</p>
              </div>
              <div className="text-red-600 font-medium">Absent</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>Events you can register for</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Church Retreat 2024</p>
                <p className="text-sm text-muted-foreground">January 15-17, 2024</p>
                <p className="text-xs text-muted-foreground">Mountain View Resort</p>
              </div>
              <Button size="sm" asChild>
                <Link href="/events">Register</Link>
              </Button>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Youth Night</p>
                <p className="text-sm text-muted-foreground">December 20, 2023</p>
                <p className="text-xs text-muted-foreground">Church Main Hall</p>
              </div>
              <Button size="sm" variant="outline" asChild>
                <Link href="/events">View Details</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Training Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Training Journey</CardTitle>
          <CardDescription>Your progress through the foundation levels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                ✓
              </div>
              <div className="flex-1">
                <p className="font-medium">Foundation Level 1</p>
                <p className="text-sm text-muted-foreground">Completed on October 15, 2023</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                ✓
              </div>
              <div className="flex-1">
                <p className="font-medium">Foundation Level 2</p>
                <p className="text-sm text-muted-foreground">Completed on November 20, 2023</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                3
              </div>
              <div className="flex-1">
                <p className="font-medium">Foundation Level 3</p>
                <p className="text-sm text-muted-foreground">Currently in progress</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-white text-sm font-bold">
                4
              </div>
              <div className="flex-1">
                <p className="font-medium">Foundation Level 4</p>
                <p className="text-sm text-muted-foreground">Not started</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and links</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button asChild className="h-auto p-4 flex flex-col items-center space-y-2">
              <Link href="/events">
                <Calendar className="h-6 w-6" />
                <span>View Events</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Link href="/profile">
                <Users className="h-6 w-6" />
                <span>My Profile</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Link href="/cell">
                <TrendingUp className="h-6 w-6" />
                <span>Cell Group</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
