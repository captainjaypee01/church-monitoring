import { Session } from "next-auth"

export type Role = "ADMIN" | "NETWORK_LEADER" | "CELL_LEADER" | "MEMBER"
export type UserRole = {
  id: string
  userId: string
  role: Role
  networkId: string | null
  cellId: string | null
  createdAt: Date
}

export type AbilityContext = {
  user: Session["user"]
  targetUserId?: string
  targetNetworkId?: string
  targetCellId?: string
}

export class RBACError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "RBACError"
  }
}

export function hasRole(user: Session["user"], role: Role): boolean {
  return user.roles.some((userRole) => userRole.role === role)
}

export function hasAnyRole(user: Session["user"], roles: Role[]): boolean {
  return user.roles.some((userRole) => roles.includes(userRole.role))
}

export function getUserRoleInNetwork(user: Session["user"], networkId: string): UserRole | null {
  return user.roles.find((role) => role.networkId === networkId) || null
}

export function getUserRoleInCell(user: Session["user"], cellId: string): UserRole | null {
  return user.roles.find((role) => role.cellId === cellId) || null
}

export function isAdmin(user: Session["user"]): boolean {
  return hasRole(user, "ADMIN")
}

export function isNetworkLeader(user: Session["user"], networkId?: string): boolean {
  if (hasRole(user, "ADMIN")) return true
  
  const networkRoles = user.roles.filter((role) => role.role === "NETWORK_LEADER")
  if (!networkId) return networkRoles.length > 0
  
  return networkRoles.some((role) => role.networkId === networkId)
}

export function isCellLeader(user: Session["user"], cellId?: string): boolean {
  if (hasRole(user, "ADMIN")) return true
  
  const cellRoles = user.roles.filter((role) => role.role === "CELL_LEADER")
  if (!cellId) return cellRoles.length > 0
  
  return cellRoles.some((role) => role.cellId === cellId)
}

export function canAccessCell(user: Session["user"], cellId: string): boolean {
  // Admin can access all cells
  if (isAdmin(user)) return true
  
  // Cell leader can access their own cell
  if (isCellLeader(user, cellId)) return true
  
  // Network leader can access cells in their network
  // This would require additional logic to check if the cell belongs to their network
  // For now, we'll implement a simplified version
  const cellRole = getUserRoleInCell(user, cellId)
  if (cellRole) return true
  
  return false
}

export function canAccessNetwork(user: Session["user"], networkId: string): boolean {
  // Admin can access all networks
  if (isAdmin(user)) return true
  
  // Network leader can access their own network
  if (isNetworkLeader(user, networkId)) return true
  
  return false
}

export function canManageUsers(user: Session["user"]): boolean {
  return isAdmin(user)
}

export function canManageEvents(user: Session["user"]): boolean {
  return isAdmin(user)
}

export function canManageAnnouncements(user: Session["user"]): boolean {
  return isAdmin(user)
}

export function canLogMeeting(user: Session["user"], cellId: string): boolean {
  return canAccessCell(user, cellId)
}

export function canViewReports(user: Session["user"], scope: "global" | "network" | "cell", resourceId?: string): boolean {
  switch (scope) {
    case "global":
      return isAdmin(user)
    case "network":
      return resourceId ? canAccessNetwork(user, resourceId) : false
    case "cell":
      return resourceId ? canAccessCell(user, resourceId) : false
    default:
      return false
  }
}

export function canManageVolunteers(user: Session["user"]): boolean {
  return hasAnyRole(user, ["ADMIN", "NETWORK_LEADER"])
}

export function assertPermission(condition: boolean, message = "Access denied"): void {
  if (!condition) {
    throw new RBACError(message)
  }
}

export function getAccessibleCells(user: Session["user"]): string[] {
  if (isAdmin(user)) {
    // Admin can access all cells - this would need to be implemented differently
    // in a real application by querying the database
    return ["*"] // Wildcard to represent all cells
  }
  
  return user.roles
    .filter((role) => role.cellId)
    .map((role) => role.cellId!)
}

export function getAccessibleNetworks(user: Session["user"]): string[] {
  if (isAdmin(user)) {
    // Admin can access all networks
    return ["*"] // Wildcard to represent all networks
  }
  
  return user.roles
    .filter((role) => role.networkId)
    .map((role) => role.networkId!)
}

export function getUserPermissions(user: Session["user"]) {
  return {
    isAdmin: isAdmin(user),
    isNetworkLeader: hasRole(user, "NETWORK_LEADER"),
    isCellLeader: hasRole(user, "CELL_LEADER"),
    isMember: hasRole(user, "MEMBER"),
    canManageUsers: canManageUsers(user),
    canManageEvents: canManageEvents(user),
    canManageAnnouncements: canManageAnnouncements(user),
    canManageVolunteers: canManageVolunteers(user),
    accessibleCells: getAccessibleCells(user),
    accessibleNetworks: getAccessibleNetworks(user),
  }
}
