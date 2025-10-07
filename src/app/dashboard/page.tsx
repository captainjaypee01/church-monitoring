import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getUserPermissions } from "@/lib/rbac"
import { MemberDashboard } from "@/components/dashboard/member-dashboard"
import { CellLeaderDashboard } from "@/components/dashboard/cell-leader-dashboard"
import { NetworkLeaderDashboard } from "@/components/dashboard/network-leader-dashboard"
import { AdminDashboard } from "@/components/dashboard/admin-dashboard"

export default async function DashboardPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/login")
  }

  const permissions = getUserPermissions(session)
  const primaryRole = session.userData?.role

  // Route to appropriate dashboard based on primary role
  switch (primaryRole) {
    case "ADMIN":
      return <AdminDashboard user={session.user} permissions={permissions} />
    case "NETWORK_LEADER":
      return <NetworkLeaderDashboard user={session.user} permissions={permissions} />
    case "CELL_LEADER":
      return <CellLeaderDashboard user={session.user} permissions={permissions} />
    case "MEMBER":
    default:
      return <MemberDashboard user={session.user} permissions={permissions} />
  }
}
