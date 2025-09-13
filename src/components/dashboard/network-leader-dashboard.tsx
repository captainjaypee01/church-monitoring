import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, TrendingUp, Church, Calendar, BarChart3, FileBarChart, DollarSign, UserCheck } from "lucide-react"
import Link from "next/link"

interface NetworkLeaderDashboardProps {
  user: any
  permissions: any
}

export function NetworkLeaderDashboard({ user, permissions }: NetworkLeaderDashboardProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Network Leader Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor your network's performance and support cell leaders.
          </p>
        </div>
        <Button asChild>
          <Link href="/network/reports">
            <BarChart3 className="mr-2 h-4 w-4" />
            Network Reports
          </Link>
        </Button>
      </div>

      {/* Network KPI Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">84</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Cells</CardTitle>
            <Church className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7</div>
            <p className="text-xs text-muted-foreground">
              Across Central Network
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">VIPs This Month</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">52</div>
            <p className="text-xs text-muted-foreground">
              62% of total members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network Giving</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$8,750</div>
            <p className="text-xs text-muted-foreground">
              +8% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* VIP Trends Chart & Cell Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>VIP Growth Trends</CardTitle>
            <CardDescription>Monthly VIP counts across Sunday Service and Cell Groups</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <p className="text-muted-foreground">VIP Trends Chart (Recharts integration pending)</p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-blue-600">45</p>
                <p className="text-xs text-muted-foreground">Sunday Service VIPs</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">52</p>
                <p className="text-xs text-muted-foreground">Cell Group VIPs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cell Performance</CardTitle>
            <CardDescription>Overview of cell group metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Victory Cell Group</p>
                <p className="text-sm text-muted-foreground">Leader: Sarah Johnson</p>
                <p className="text-xs text-muted-foreground">12 members • 8 VIPs this month</p>
              </div>
              <div className="text-green-600 font-bold">98%</div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Grace Cell Group</p>
                <p className="text-sm text-muted-foreground">Leader: Michael Chen</p>
                <p className="text-xs text-muted-foreground">15 members • 9 VIPs this month</p>
              </div>
              <div className="text-green-600 font-bold">95%</div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Hope Cell Group</p>
                <p className="text-sm text-muted-foreground">Leader: Emily Rodriguez</p>
                <p className="text-xs text-muted-foreground">10 members • 5 VIPs this month</p>
              </div>
              <div className="text-yellow-600 font-bold">78%</div>
            </div>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/network/cells">View All Cells</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Cell Leader Support */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Cell Meetings</CardTitle>
            <CardDescription>Latest meetings logged across your network</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <p className="font-medium">Victory Cell - Friday Meeting</p>
                <p className="text-sm text-muted-foreground">December 8, 2023 • Sarah Johnson</p>
                <p className="text-xs text-muted-foreground">9/12 present • 6 VIPs • $240 giving</p>
              </div>
              <div className="text-green-600 font-medium">Logged</div>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <p className="font-medium">Grace Cell - Wednesday Meeting</p>
                <p className="text-sm text-muted-foreground">December 6, 2023 • Michael Chen</p>
                <p className="text-xs text-muted-foreground">13/15 present • 8 VIPs • $320 giving</p>
              </div>
              <div className="text-green-600 font-medium">Logged</div>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div>
                <p className="font-medium">Hope Cell - Thursday Meeting</p>
                <p className="text-sm text-muted-foreground">December 7, 2023 • Emily Rodriguez</p>
                <p className="text-xs text-muted-foreground">Meeting pending log</p>
              </div>
              <div className="text-yellow-600 font-medium">Pending</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Training Progress Network-wide</CardTitle>
            <CardDescription>Foundation level completions across all cells</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Foundation Level 1</span>
                <span className="text-sm font-medium">84/84 (100%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full w-full"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Foundation Level 2</span>
                <span className="text-sm font-medium">67/84 (80%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full w-4/5"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Foundation Level 3</span>
                <span className="text-sm font-medium">42/84 (50%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full w-1/2"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Foundation Level 4</span>
                <span className="text-sm font-medium">25/84 (30%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-yellow-600 h-2 rounded-full w-1/3"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Items & Monthly Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Action Items</CardTitle>
            <CardDescription>Cell leaders needing support or follow-up</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div>
                <p className="font-medium text-sm">Hope Cell - Low VIP Rate</p>
                <p className="text-xs text-muted-foreground">
                  Emily Rodriguez • 50% VIP rate this month
                </p>
              </div>
              <Button size="sm" variant="outline">Follow Up</Button>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <p className="font-medium text-sm">Faith Cell - Missing Meeting Log</p>
                <p className="text-xs text-muted-foreground">
                  David Kim • Meeting from Dec 5 not logged
                </p>
              </div>
              <Button size="sm" variant="outline">Contact</Button>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <p className="font-medium text-sm">Love Cell - Excellent Performance</p>
                <p className="text-xs text-muted-foreground">
                  Maria Santos • 95% VIP rate, consistent giving
                </p>
              </div>
              <Button size="sm" variant="outline">Recognize</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Network Insights</CardTitle>
            <CardDescription>Key metrics and observations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 border-l-4 border-green-500 bg-green-50">
              <p className="font-medium text-sm text-green-800">Strong VIP Growth</p>
              <p className="text-xs text-green-600 mt-1">
                VIP participation increased by 15% compared to last month across all cells.
              </p>
            </div>
            <div className="p-3 border-l-4 border-blue-500 bg-blue-50">
              <p className="font-medium text-sm text-blue-800">Training Progress</p>
              <p className="text-xs text-blue-600 mt-1">
                Foundation Level 2 completion rate reached 80% network-wide.
              </p>
            </div>
            <div className="p-3 border-l-4 border-yellow-500 bg-yellow-50">
              <p className="font-medium text-sm text-yellow-800">Attention Needed</p>
              <p className="text-xs text-yellow-600 mt-1">
                2 cells have attendance rates below 75% - consider additional support.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions for Network Leaders */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common network leader tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button asChild className="h-auto p-4 flex flex-col items-center space-y-2">
              <Link href="/network/reports">
                <BarChart3 className="h-6 w-6" />
                <span className="text-sm">Generate Reports</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Link href="/network/cells">
                <Church className="h-6 w-6" />
                <span className="text-sm">Manage Cells</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Link href="/network/leaders">
                <Users className="h-6 w-6" />
                <span className="text-sm">Support Leaders</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Link href="/network/insights">
                <TrendingUp className="h-6 w-6" />
                <span className="text-sm">View Insights</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
