import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { isAdmin } from "@/lib/rbac"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Building, Settings, Plus } from "lucide-react"
import Link from "next/link"
import { db } from "@/lib/db"
import { networks, cells, cellMemberships, profiles, userRoles, users } from "@/lib/db/schema"
import { count, eq, and } from "drizzle-orm"

export default async function AdminNetworksPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/login")
  }

  if (!isAdmin(session)) {
    redirect("/dashboard")
  }

  // Fetch all networks with their cells, member counts, and network leaders
  const networksData = await db
    .select({
      id: networks.id,
      name: networks.name,
      description: networks.description,
      createdAt: networks.createdAt,
      cellCount: count(cells.id),
      memberCount: count(cellMemberships.id),
      networkLeaderCount: count(userRoles.id),
      networkLeaderId: userRoles.userId,
      networkLeaderName: profiles.fullName,
    })
    .from(networks)
    .leftJoin(cells, eq(networks.id, cells.networkId))
    .leftJoin(cellMemberships, eq(cells.id, cellMemberships.cellId))
    .leftJoin(userRoles, and(
      eq(userRoles.role, "NETWORK_LEADER"),
      eq(userRoles.networkId, networks.id)
    ))
    .leftJoin(users, eq(userRoles.userId, users.id))
    .leftJoin(profiles, eq(users.id, profiles.userId))
    .groupBy(networks.id, userRoles.userId, profiles.fullName)
    .orderBy(networks.name)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Network Management</h1>
          <p className="text-muted-foreground">
            Manage church networks, cell groups, and organizational structure.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/networks/new">
            <Plus className="h-4 w-4 mr-2" />
            Create Network
          </Link>
        </Button>
      </div>

      {/* Network Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Networks</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{networksData.length}</div>
            <p className="text-xs text-muted-foreground">
              Active networks
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cell Groups</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {networksData.reduce((sum, network) => sum + Number(network.cellCount), 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all networks
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {networksData.reduce((sum, network) => sum + Number(network.memberCount) + Number(network.networkLeaderCount), 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Active members
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Members/Network</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {networksData.length > 0 
                ? Math.round(networksData.reduce((sum, network) => sum + Number(network.memberCount) + Number(network.networkLeaderCount), 0) / networksData.length)
                : 0
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Average per network
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Networks List */}
      <div className="grid gap-4">
        {networksData.map((network) => (
          <Card key={network.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <Building className="h-5 w-5 mr-2" />
                    {network.name}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {network.description || "No description available"}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">
                    {network.cellCount} cell groups
                  </Badge>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/admin/networks/${network.id}`}>
                      <Settings className="h-4 w-4 mr-1" />
                      Manage
                    </Link>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{Number(network.memberCount) + Number(network.networkLeaderCount)} members</p>
                    <p className="text-xs text-muted-foreground">Total members</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{network.cellCount} cells</p>
                    <p className="text-xs text-muted-foreground">Cell groups</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      {network.cellCount > 0 
                        ? Math.round((Number(network.memberCount) + Number(network.networkLeaderCount)) / Number(network.cellCount))
                        : 0
                      } avg/group
                    </p>
                    <p className="text-xs text-muted-foreground">Members per cell</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      {network.networkLeaderName || "No leader"}
                    </p>
                    <p className="text-xs text-muted-foreground">Network leader</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {networksData.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Networks Found</h3>
            <p className="text-muted-foreground text-center mb-4">
              Get started by creating your first network to organize cell groups.
            </p>
            <Button asChild>
              <Link href="/admin/networks/new">
                <Plus className="h-4 w-4 mr-2" />
                Create First Network
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
