import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Users, Calendar, BookOpen, DollarSign, Camera, FileBarChart } from "lucide-react"
import Link from "next/link"

interface CellLeaderDashboardProps {
  user: any
  permissions: any
}

export function CellLeaderDashboard({ user, permissions }: CellLeaderDashboardProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cell Leader Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your cell group and track member progress.
          </p>
        </div>
        <Button asChild>
          <Link href="/cell/meetings/new">
            <Plus className="mr-2 h-4 w-4" />
            Log New Meeting
          </Link>
        </Button>
      </div>

      {/* Cell Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              +2 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month's VIPs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              67% of active members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meetings This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              1 more scheduled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Giving</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$1,250</div>
            <p className="text-xs text-muted-foreground">
              +15% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Meetings & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Cell Meetings</CardTitle>
            <CardDescription>Your recent meeting logs and attendance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <p className="font-medium">Friday Night Cell</p>
                <p className="text-sm text-muted-foreground">December 8, 2023 • 7:00 PM</p>
                <p className="text-xs text-muted-foreground">9/12 present • 6 VIPs • $240 giving</p>
              </div>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline" asChild>
                  <Link href="/cell/meetings/1">View</Link>
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <p className="font-medium">Friday Night Cell</p>
                <p className="text-sm text-muted-foreground">December 1, 2023 • 7:00 PM</p>
                <p className="text-xs text-muted-foreground">11/12 present • 8 VIPs • $280 giving</p>
              </div>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline" asChild>
                  <Link href="/cell/meetings/2">View</Link>
                </Button>
              </div>
            </div>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/cell/meetings">View All Meetings</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Training Progress</CardTitle>
            <CardDescription>Member training completions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Foundation Level 1</span>
                <span className="text-sm font-medium">12/12</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full w-full"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Foundation Level 2</span>
                <span className="text-sm font-medium">8/12</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full w-2/3"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Foundation Level 3</span>
                <span className="text-sm font-medium">4/12</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full w-1/3"></div>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link href="/cell/training">Manage Training</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Member Status & Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Cell Members</CardTitle>
            <CardDescription>Current member status and engagement</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-2 border rounded">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-sm font-bold">JS</span>
                </div>
                <div>
                  <p className="font-medium text-sm">John Smith</p>
                  <p className="text-xs text-muted-foreground">VIP this month</p>
                </div>
              </div>
              <div className="text-green-600 text-sm font-medium">Active</div>
            </div>
            <div className="flex items-center justify-between p-2 border rounded">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm font-bold">JD</span>
                </div>
                <div>
                  <p className="font-medium text-sm">Jane Doe</p>
                  <p className="text-xs text-muted-foreground">Regular attender</p>
                </div>
              </div>
              <div className="text-blue-600 text-sm font-medium">Active</div>
            </div>
            <div className="flex items-center justify-between p-2 border rounded">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-yellow-600 text-sm font-bold">BW</span>
                </div>
                <div>
                  <p className="font-medium text-sm">Bob Wilson</p>
                  <p className="text-xs text-muted-foreground">Missed 2 meetings</p>
                </div>
              </div>
              <div className="text-yellow-600 text-sm font-medium">Follow Up</div>
            </div>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/cell/members">View All Members</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Latest Announcements</CardTitle>
            <CardDescription>Important updates for leaders</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="font-medium text-sm">Leadership Meeting Next Week</p>
              <p className="text-xs text-muted-foreground mt-1">
                All cell leaders are invited to attend the monthly leadership meeting next Tuesday at 7 PM.
              </p>
              <p className="text-xs text-blue-600 mt-2">Today • For Leaders</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="font-medium text-sm">Welcome New Members!</p>
              <p className="text-xs text-muted-foreground mt-1">
                We are excited to welcome our new members to the church family.
              </p>
              <p className="text-xs text-green-600 mt-2">2 days ago • For All</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common cell leader tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button asChild className="h-auto p-4 flex flex-col items-center space-y-2">
              <Link href="/cell/meetings/new">
                <Plus className="h-6 w-6" />
                <span className="text-sm">Log Meeting</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Link href="/cell/attendance">
                <Users className="h-6 w-6" />
                <span className="text-sm">Mark Attendance</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Link href="/cell/training">
                <BookOpen className="h-6 w-6" />
                <span className="text-sm">Update Training</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Link href="/cell/reports">
                <FileBarChart className="h-6 w-6" />
                <span className="text-sm">Generate Report</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
