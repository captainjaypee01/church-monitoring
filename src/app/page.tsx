import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Church, Users, Calendar, BarChart3 } from "lucide-react"

export default async function HomePage() {
  const session = await auth()
  
  if (session?.user) {
    redirect("/dashboard")
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-blue-600 rounded-full">
              <Church className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Church Monitoring System
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Comprehensive church management and monitoring system for cell groups, attendance, training, giving, and events.
          </p>
          <Button asChild size="lg">
            <Link href="/login">Get Started</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card>
            <CardHeader className="text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <CardTitle>Member Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Track member profiles, attendance, and engagement across cell groups and services.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <CardTitle>Event Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Organize events, manage registrations, and coordinate volunteer schedules.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <BarChart3 className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <CardTitle>Analytics & Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Generate insights with VIP trends, attendance analytics, and comprehensive reports.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Church className="h-8 w-8 mx-auto mb-2 text-orange-600" />
              <CardTitle>Cell Groups</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Manage cell meetings, log attendance, track training progress, and record giving.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle>Ready to get started?</CardTitle>
            <CardDescription>
              Sign in to access your personalized dashboard and start managing your church activities.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild size="lg">
              <Link href="/login">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
