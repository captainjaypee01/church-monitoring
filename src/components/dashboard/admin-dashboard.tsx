import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Users, 
  Network, 
  Calendar, 
  Megaphone, 
  BarChart3, 
  UserCheck, 
  DollarSign, 
  Church,
  TrendingUp,
  FileBarChart,
  Settings,
  Shield
} from "lucide-react"
import Link from "next/link"

interface AdminDashboardProps {
  user: any
  permissions: any
}

export function AdminDashboard({ user, permissions }: AdminDashboardProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Complete system overview and management controls.
          </p>
        </div>
        <div className="flex space-x-2">
          <Button asChild>
            <Link href="/admin/reports">
              <BarChart3 className="mr-2 h-4 w-4" />
              Generate Reports
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/users">
              <Shield className="mr-2 h-4 w-4" />
              Manage Users
            </Link>
          </Button>
        </div>
      </div>

      {/* Global System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">247</div>
            <p className="text-xs text-muted-foreground">
              +18 new this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Networks</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              21 total cells
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">VIPs This Month</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">185</div>
            <p className="text-xs text-muted-foreground">
              75% of total members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Giving</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$24,750</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Global VIP Trends & Network Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Church-wide VIP Trends</CardTitle>
            <CardDescription>Monthly VIP participation across all networks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <p className="text-muted-foreground">Global VIP Trends Chart (Recharts integration pending)</p>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-blue-600">142</p>
                <p className="text-xs text-muted-foreground">Sunday Service</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">185</p>
                <p className="text-xs text-muted-foreground">Cell Groups</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">75%</p>
                <p className="text-xs text-muted-foreground">VIP Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Network Performance</CardTitle>
            <CardDescription>VIP counts and performance by network</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Central Network</p>
                <p className="text-sm text-muted-foreground">7 cells • 84 members</p>
                <p className="text-xs text-muted-foreground">Leader: John Anderson</p>
              </div>
              <div className="text-right">
                <div className="text-green-600 font-bold text-lg">78%</div>
                <div className="text-xs text-muted-foreground">VIP Rate</div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">North Network</p>
                <p className="text-sm text-muted-foreground">8 cells • 96 members</p>
                <p className="text-xs text-muted-foreground">Leader: Lisa Chang</p>
              </div>
              <div className="text-right">
                <div className="text-green-600 font-bold text-lg">82%</div>
                <div className="text-xs text-muted-foreground">VIP Rate</div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">South Network</p>
                <p className="text-sm text-muted-foreground">6 cells • 67 members</p>
                <p className="text-xs text-muted-foreground">Leader: Mark Thompson</p>
              </div>
              <div className="text-right">
                <div className="text-yellow-600 font-bold text-lg">65%</div>
                <div className="text-xs text-muted-foreground">VIP Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent System Activity</CardTitle>
            <CardDescription>Latest actions across the system</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">New event created</p>
                <p className="text-xs text-muted-foreground">Church Retreat 2024 • Created by Admin</p>
                <p className="text-xs text-muted-foreground">2 minutes ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Cell meeting logged</p>
                <p className="text-xs text-muted-foreground">Victory Cell • 9/12 present • Sarah Johnson</p>
                <p className="text-xs text-muted-foreground">1 hour ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">New user registered</p>
                <p className="text-xs text-muted-foreground">Jessica Brown • Assigned to Grace Cell</p>
                <p className="text-xs text-muted-foreground">3 hours ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-orange-50 rounded-lg">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Announcement published</p>
                <p className="text-xs text-muted-foreground">Leadership Meeting Next Week • For Leaders</p>
                <p className="text-xs text-muted-foreground">1 day ago</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Health & Alerts</CardTitle>
            <CardDescription>Important system notifications and health checks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 border-l-4 border-green-500 bg-green-50">
              <p className="font-medium text-sm text-green-800">All Systems Operational</p>
              <p className="text-xs text-green-600 mt-1">
                Database connections healthy, no performance issues detected.
              </p>
            </div>
            <div className="p-3 border-l-4 border-blue-500 bg-blue-50">
              <p className="font-medium text-sm text-blue-800">Backup Completed</p>
              <p className="text-xs text-blue-600 mt-1">
                Daily backup completed successfully at 2:00 AM.
              </p>
            </div>
            <div className="p-3 border-l-4 border-yellow-500 bg-yellow-50">
              <p className="font-medium text-sm text-yellow-800">Pending Reviews</p>
              <p className="text-xs text-yellow-600 mt-1">
                3 event registrations awaiting approval.
              </p>
            </div>
            <div className="p-3 border-l-4 border-red-500 bg-red-50">
              <p className="font-medium text-sm text-red-800">Missing Data</p>
              <p className="text-xs text-red-600 mt-1">
                2 cells haven't logged meetings in over a week.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>Manage users, roles, and permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button asChild className="h-auto p-4 flex flex-col items-center space-y-2">
                <Link href="/admin/users">
                  <Users className="h-6 w-6" />
                  <span className="text-sm">Manage Users</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                <Link href="/admin/networks">
                  <Network className="h-6 w-6" />
                  <span className="text-sm">Networks & Cells</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Content Management</CardTitle>
            <CardDescription>Manage events, announcements, and content</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button asChild className="h-auto p-4 flex flex-col items-center space-y-2">
                <Link href="/admin/events">
                  <Calendar className="h-6 w-6" />
                  <span className="text-sm">Events</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                <Link href="/admin/announcements">
                  <Megaphone className="h-6 w-6" />
                  <span className="text-sm">Announcements</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports & Analytics */}
      <Card>
        <CardHeader>
          <CardTitle>Reports & Analytics</CardTitle>
          <CardDescription>Generate comprehensive reports and view analytics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button asChild className="h-auto p-4 flex flex-col items-center space-y-2">
              <Link href="/admin/reports">
                <BarChart3 className="h-6 w-6" />
                <span className="text-sm">All Reports</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Link href="/admin/reports/attendance">
                <UserCheck className="h-6 w-6" />
                <span className="text-sm">Attendance</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Link href="/admin/reports/giving">
                <DollarSign className="h-6 w-6" />
                <span className="text-sm">Giving</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Link href="/admin/reports/training">
                <FileBarChart className="h-6 w-6" />
                <span className="text-sm">Training</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
