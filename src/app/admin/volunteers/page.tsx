import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { isAdmin } from "@/lib/rbac"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { db } from "@/lib/db"
import { volunteerRoles, volunteerAssignments, users, services, events } from "@/lib/db/schema"
import { eq, count } from "drizzle-orm"
import { HandHeart, Users, Calendar, Clock } from "lucide-react"
import Link from "next/link"

export default async function AdminVolunteersPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/login")
  }

  if (!isAdmin(session)) {
    redirect("/dashboard")
  }

  // Fetch volunteer roles and assignments
  const volunteerRolesData = await db
    .select({
      id: volunteerRoles.id,
      name: volunteerRoles.name,
      description: volunteerRoles.description,
      assignmentCount: count(volunteerAssignments.id),
    })
    .from(volunteerRoles)
    .leftJoin(volunteerAssignments, eq(volunteerRoles.id, volunteerAssignments.roleId))
    .groupBy(volunteerRoles.id)
    .orderBy(volunteerRoles.name)

  // Fetch recent volunteer assignments
  const recentAssignments = await db
    .select({
      id: volunteerAssignments.id,
      volunteerName: profiles.fullName,
      roleName: volunteerRoles.name,
      serviceName: services.name,
      eventName: events.title,
      assignedAt: volunteerAssignments.assignedAt,
    })
    .from(volunteerAssignments)
    .innerJoin(profiles, eq(volunteerAssignments.profileId, profiles.id))
    .innerJoin(volunteerRoles, eq(volunteerAssignments.roleId, volunteerRoles.id))
    .leftJoin(services, eq(volunteerAssignments.serviceId, services.id))
    .leftJoin(events, eq(volunteerAssignments.eventId, events.id))
    .orderBy(volunteerAssignments.assignedAt)
    .limit(10)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Volunteer Management</h1>
          <p className="text-muted-foreground">
            Manage volunteer roles, assignments, and service scheduling.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/volunteers/roles/new">
            <HandHeart className="h-4 w-4 mr-2" />
            Create Role
          </Link>
        </Button>
      </div>

      {/* Volunteer Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Volunteer Roles</CardTitle>
            <HandHeart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{volunteerRolesData.length}</div>
            <p className="text-xs text-muted-foreground">
              Available roles
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Assignments</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {volunteerRolesData.reduce((sum, role) => sum + Number(role.assignmentCount), 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Current assignments
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              New assignments
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              Pending assignments
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Volunteer Roles */}
        <Card>
          <CardHeader>
            <CardTitle>Volunteer Roles</CardTitle>
            <CardDescription>
              Manage available volunteer positions and responsibilities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {volunteerRolesData.map((role) => (
                <div key={role.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{role.name}</p>
                    <p className="text-sm text-muted-foreground">{role.description}</p>
                    <Badge variant="outline" className="mt-1">
                      {role.assignmentCount} assignments
                    </Badge>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/admin/volunteers/roles/${role.id}`}>
                        Manage
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
              
              {volunteerRolesData.length === 0 && (
                <div className="text-center py-6">
                  <HandHeart className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground mb-4">No volunteer roles created yet</p>
                  <Button asChild>
                    <Link href="/admin/volunteers/roles/new">
                      Create First Role
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Assignments */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Assignments</CardTitle>
            <CardDescription>
              Latest volunteer assignments and scheduling
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAssignments.map((assignment) => (
                <div key={assignment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{assignment.volunteerName}</p>
                    <p className="text-sm text-muted-foreground">
                      {assignment.roleName}
                      {assignment.serviceName && ` • ${assignment.serviceName}`}
                      {assignment.eventName && ` • ${assignment.eventName}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(assignment.assignedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>
              ))}
              
              {recentAssignments.length === 0 && (
                <div className="text-center py-6">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No recent assignments</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
