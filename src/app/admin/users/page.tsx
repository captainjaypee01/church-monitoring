import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { isAdmin } from "@/lib/rbac"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq, count } from "drizzle-orm"
import { Users, UserCheck, Settings, Mail } from "lucide-react"
import Link from "next/link"

export default async function AdminUsersPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/login")
  }

  if (!isAdmin(session)) {
    redirect("/dashboard")
  }

  // Fetch all users with simplified schema
  const usersWithRoles = await db
    .select({
      id: users.id,
      email: users.email,
      username: users.username,
      name: users.name,
      firstName: users.firstName,
      lastName: users.lastName,
      fullName: users.fullName,
      isActive: users.isActive,
      joinedAt: users.joinedAt,
      deletedAt: users.deletedAt,
      role: users.role,
      networkId: users.networkId,
      cellId: users.cellId,
      isNetworkLeader: users.isNetworkLeader,
      isCellLeader: users.isCellLeader,
    })
    .from(users)
    .orderBy(users.email)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage church members, assign roles, and oversee user accounts.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/users/new">
            <Users className="h-4 w-4 mr-2" />
            Add User
          </Link>
        </Button>
      </div>

      {/* User Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usersWithRoles.filter(user => !user.deletedAt).length}</div>
            <p className="text-xs text-muted-foreground">
              Active users
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usersWithRoles.filter(user => user.isActive && !user.deletedAt).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Active profiles
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Roles</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usersWithRoles.filter(user => user.roles.length > 0 && !user.deletedAt).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Users with assigned roles
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deleted Users</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usersWithRoles.filter(user => user.deletedAt).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Soft deleted accounts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            Manage user accounts and role assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {usersWithRoles.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {user.firstName && user.lastName 
                        ? `${user.firstName} ${user.lastName}` 
                        : user.fullName || user.name || "No name"}
                    </p>
                    <div className="text-sm text-muted-foreground">
                      {user.email && <span>{user.email}</span>}
                      {user.email && user.username && <span className="mx-1">•</span>}
                      {user.username && <span>@{user.username}</span>}
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant={user.deletedAt ? "destructive" : user.isActive ? "default" : "secondary"}>
                        {user.deletedAt ? "Deleted" : user.isActive ? "Active" : "Inactive"}
                      </Badge>
                      {user.role && !user.deletedAt && (
                        <div className="flex space-x-1">
                          <Badge variant="outline">
                            {user.role.replace(/_/g, ' ')}
                          </Badge>
                          {user.isNetworkLeader && (
                            <Badge variant="secondary">
                              Network Leader
                            </Badge>
                          )}
                          {user.isCellLeader && (
                            <Badge variant="secondary">
                              Cell Leader
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/admin/users/${user.id}`}>
                      <Settings className="h-4 w-4 mr-1" />
                      Manage
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
