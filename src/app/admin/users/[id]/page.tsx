import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { isAdmin } from "@/lib/rbac"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EditUserForm } from "@/components/users/edit-user-form"
import { db } from "@/lib/db"
import { users, networks, cells } from "@/lib/db/schema"
import { eq, and, isNull } from "drizzle-orm"
import { Users, Mail, Phone, Calendar, MapPin, Shield, Trash2, RotateCcw } from "lucide-react"
import Link from "next/link"
import { softDeleteUserAction, restoreUserAction } from "@/app/actions/user-actions"

interface UserDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const session = await auth()
  const { id } = await params
  
  if (!session?.user) {
    redirect("/login")
  }

  if (!isAdmin(session)) {
    redirect("/dashboard")
  }

  // Fetch user details with simplified schema
  const [userData] = await db
    .select({
      id: users.id,
      email: users.email,
      username: users.username,
      name: users.name,
      phone: users.phone,
      avatarUrl: users.avatarUrl,
      deletedAt: users.deletedAt,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      firstName: users.firstName,
      lastName: users.lastName,
      fullName: users.fullName,
      birthdate: users.birthdate,
      gender: users.gender,
      address: users.address,
      joinedAt: users.joinedAt,
      isActive: users.isActive,
      role: users.role,
      networkId: users.networkId,
      cellId: users.cellId,
      isNetworkLeader: users.isNetworkLeader,
      isCellLeader: users.isCellLeader,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1)

  if (!userData) {
    notFound()
  }

  // Get network and cell names if assigned
  let networkName = null
  let cellName = null

  if (userData.networkId) {
    const [network] = await db
      .select({ name: networks.name })
      .from(networks)
      .where(eq(networks.id, userData.networkId))
      .limit(1)
    networkName = network?.name || null
  }

  if (userData.cellId) {
    const [cell] = await db
      .select({ name: cells.name })
      .from(cells)
      .where(eq(cells.id, userData.cellId))
      .limit(1)
    cellName = cell?.name || null
  }

  const isDeleted = userData.deletedAt !== null
  const isCurrentUser = session.user.id === id

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {userData.firstName && userData.lastName 
              ? `${userData.firstName} ${userData.lastName}` 
              : userData.fullName || userData.name}
          </h1>
          <p className="text-muted-foreground">
            User management and profile details
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" asChild>
            <Link href="/admin/users">
              Back to Users
            </Link>
          </Button>
          {!isCurrentUser && (
            <>
              {isDeleted ? (
                <form action={async () => {
                  "use server"
                  await restoreUserAction(id)
                }}>
                  <Button variant="outline" type="submit">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Restore User
                  </Button>
                </form>
              ) : (
                <form action={async () => {
                  "use server"
                  await softDeleteUserAction(id)
                }}>
                  <Button variant="destructive" type="submit">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete User
                  </Button>
                </form>
              )}
            </>
          )}
        </div>
      </div>

      {/* User Status */}
      {isDeleted && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              <p className="text-red-800 font-medium">
                This user has been deleted on {new Date(userData.deletedAt!).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Information */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contact Information</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {userData.email && (
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{userData.email}</span>
                </div>
              )}
              {userData.username && (
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">@{userData.username}</span>
                </div>
              )}
              {userData.phone && (
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{userData.phone}</span>
                </div>
              )}
              {userData.address && (
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{userData.address}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profile Details</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Badge variant={userData.isActive ? "default" : "secondary"}>
                  {userData.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              {userData.gender && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Gender:</span>
                  <span className="text-sm">{userData.gender}</span>
                </div>
              )}
              {userData.birthdate && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Birth Date:</span>
                  <span className="text-sm">{new Date(userData.birthdate).toLocaleDateString()}</span>
                </div>
              )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Joined:</span>
                  <span className="text-sm">{userData.joinedAt ? new Date(userData.joinedAt).toLocaleDateString() : 'N/A'}</span>
                </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Roles & Assignments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>User Role & Assignments</span>
          </CardTitle>
          <CardDescription>
            Current role and leadership assignments for this user
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Primary Role */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Badge variant="outline">{userData.role}</Badge>
                <span className="text-sm text-muted-foreground ml-2">
                  Primary Role
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(userData.createdAt).toLocaleDateString()}
              </span>
            </div>

            {/* Network Assignment */}
            {userData.networkId && (
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Badge variant="secondary">Network Member</Badge>
                  {userData.isNetworkLeader && (
                    <Badge variant="default" className="ml-2">Network Leader</Badge>
                  )}
                  {networkName && (
                    <span className="text-sm text-muted-foreground ml-2">
                      Network: {networkName}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Cell Assignment */}
            {userData.cellId && (
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Badge variant="secondary">Cell Member</Badge>
                  {userData.isCellLeader && (
                    <Badge variant="default" className="ml-2">Cell Leader</Badge>
                  )}
                  {cellName && (
                    <span className="text-sm text-muted-foreground ml-2">
                      Cell: {cellName}
                    </span>
                  )}
                </div>
              </div>
            )}

            {!userData.networkId && !userData.cellId && (
              <p className="text-muted-foreground">No network or cell assignments</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Form */}
      {!isDeleted && (
        <EditUserForm user={{
          id: userData.id,
          email: userData.email,
          username: userData.username,
          name: userData.name,
          phone: userData.phone,
          firstName: userData.firstName,
          lastName: userData.lastName,
          fullName: userData.fullName,
          gender: userData.gender,
          birthdate: userData.birthdate as string | null,
          address: userData.address,
          isActive: userData.isActive,
          role: userData.role,
          networkId: userData.networkId,
          cellId: userData.cellId,
          isNetworkLeader: userData.isNetworkLeader,
          isCellLeader: userData.isCellLeader,
        }} />
      )}
    </div>
  )
}
