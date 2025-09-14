import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { isAdmin } from "@/lib/rbac"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EditNetworkForm } from "@/components/networks/edit-network-form"
import { db } from "@/lib/db"
import { networks, cells, users } from "@/lib/db/schema"
import { eq, count, and } from "drizzle-orm"
import { Building, Users, Settings, Trash2, Plus } from "lucide-react"
import Link from "next/link"

interface NetworkDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function NetworkDetailPage({ params }: NetworkDetailPageProps) {
  const session = await auth()
  const { id } = await params
  
  if (!session?.user) {
    redirect("/login")
  }

  if (!isAdmin(session)) {
    redirect("/dashboard")
  }

  // Fetch network details
  const [network] = await db
    .select()
    .from(networks)
    .where(eq(networks.id, id))
    .limit(1)

  if (!network) {
    notFound()
  }

  // Get network leaders (can be multiple)
  const networkLeadersResult = await db
    .select({
      id: users.id,
      fullName: users.fullName,
      email: users.email,
    })
    .from(users)
    .where(and(
      eq(users.networkId, id),
      eq(users.isNetworkLeader, true),
      eq(users.isActive, true)
    ))

  const networkLeaders = (networkLeadersResult || []).map(leader => ({
    ...leader,
    email: leader.email || ""
  }))

  // Get cells in this network with their leaders and member counts
  const networkCells = await db
    .select({
      id: cells.id,
      name: cells.name,
      description: cells.description,
      leaderName: users.fullName,
      memberCount: count(users.id),
    })
    .from(cells)
    .leftJoin(users, and(
      eq(users.cellId, cells.id),
      eq(users.isCellLeader, true),
      eq(users.isActive, true)
    ))
    .where(eq(cells.networkId, id))
    .groupBy(cells.id, users.fullName)

  // Get total members in network
  const totalMembersResult = await db
    .select({ count: count() })
    .from(users)
    .where(and(
      eq(users.networkId, id),
      eq(users.isActive, true)
    ))

  const totalMembers = totalMembersResult[0] || { count: 0 }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{network.name}</h1>
          <p className="text-muted-foreground">
            Network management and cell group oversight
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" asChild>
            <Link href="/admin/networks">
              Back to Networks
            </Link>
          </Button>
        </div>
      </div>

      {/* Network Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cell Groups</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{networkCells.length}</div>
            <p className="text-xs text-muted-foreground">
              Active cell groups
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMembers.count}</div>
            <p className="text-xs text-muted-foreground">
              Across all cells
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network Leaders</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {networkLeaders.length > 0 ? networkLeaders.length : "None"}
            </div>
            <p className="text-xs text-muted-foreground">
              {networkLeaders.length > 0 
                ? networkLeaders.map(leader => leader.fullName).join(", ")
                : "No leaders assigned"
              }
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Created</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Date(network.createdAt).toLocaleDateString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Network creation date
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Network Details & Edit Form */}
        <Card>
          <CardHeader>
            <CardTitle>Network Information</CardTitle>
            <CardDescription>
              Update network details and assign network leaders
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EditNetworkForm network={network} networkLeaders={networkLeaders} />
          </CardContent>
        </Card>

        {/* Cell Groups */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Cell Groups</CardTitle>
                <CardDescription>
                  Manage cell groups within this network
                </CardDescription>
              </div>
              <Button asChild>
                <Link href={`/admin/networks/${id}/cells/new`}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Cell Group
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {networkCells.map((cell) => (
                <div key={cell.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{cell.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Leader: {cell.leaderName || "Unassigned"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {cell.memberCount} members
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/admin/networks/${id}/cells/${cell.id}`}>
                        <Settings className="h-4 w-4 mr-1" />
                        Manage
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
              
              {networkCells.length === 0 && (
                <div className="text-center py-6">
                  <Building className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground mb-4">No cell groups yet</p>
                  <Button asChild>
                    <Link href={`/admin/networks/${id}/cells/new`}>
                      Create First Cell Group
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
