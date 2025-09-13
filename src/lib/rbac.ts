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
  session: Session
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

export function hasRole(session: Session, role: Role): boolean {
  return session.roles?.some((userRole) => userRole.role === role) || false
}

export function hasAnyRole(session: Session, roles: Role[]): boolean {
  return session.roles?.some((userRole) => roles.includes(userRole.role)) || false
}

export function getUserRoleInNetwork(session: Session, networkId: string): UserRole | null {
  return session.roles?.find((role) => role.networkId === networkId) || null
}

export function getUserRoleInCell(session: Session, cellId: string): UserRole | null {
  return session.roles?.find((role) => role.cellId === cellId) || null
}

export function isAdmin(session: Session): boolean {
  return hasRole(session, "ADMIN")
}

export function isNetworkLeader(session: Session, networkId?: string): boolean {
  if (hasRole(session, "ADMIN")) return true
  
  const networkRoles = session.roles?.filter((role) => role.role === "NETWORK_LEADER") || []
  if (!networkId) return networkRoles.length > 0
  
  return networkRoles.some((role) => role.networkId === networkId)
}

export function isCellLeader(session: Session, cellId?: string): boolean {
  if (hasRole(session, "ADMIN")) return true
  if (isNetworkLeader(session)) return true
  
  const cellRoles = session.roles?.filter((role) => role.role === "CELL_LEADER") || []
  if (!cellId) return cellRoles.length > 0
  
  return cellRoles.some((role) => role.cellId === cellId)
}

// Leadership scope helpers
export function getCellIdsForUser(session: Session): string[] {
  return session.roles
    ?.filter((role) => role.cellId)
    .map((role) => role.cellId!) || []
}

export function getNetworkIdsForUser(session: Session): string[] {
  return session.roles
    ?.filter((role) => role.networkId)
    .map((role) => role.networkId!) || []
}

// Ability checks
export function canViewReports(session: Session): boolean {
  return hasRole(session, "ADMIN")
}

export function canManageEvents(session: Session): boolean {
  return hasRole(session, "ADMIN")
}

export function canManageAnnouncements(session: Session): boolean {
  return hasRole(session, "ADMIN")
}

export function canManageNetworks(session: Session): boolean {
  return hasRole(session, "ADMIN")
}

export function canManageCells(session: Session): boolean {
  return hasRole(session, "ADMIN") || isNetworkLeader(session)
}

export function canManageUsers(session: Session): boolean {
  return hasRole(session, "ADMIN")
}

export function canLogCellMeeting(session: Session, cellId: string): boolean {
  return hasRole(session, "ADMIN") || isNetworkLeader(session) || isCellLeader(session, cellId)
}

export function canViewCellReports(session: Session, cellId: string): boolean {
  return hasRole(session, "ADMIN") || isNetworkLeader(session) || isCellLeader(session, cellId)
}

export function canViewNetworkReports(session: Session, networkId: string): boolean {
  return hasRole(session, "ADMIN") || isNetworkLeader(session, networkId)
}

// Legacy function for backward compatibility
export function getUserPermissions(session: Session) {
  return ability({ session })
}

// Main ability function
export function ability(context: AbilityContext) {
  const { session } = context
  
  return {
    canViewReports: () => canViewReports(session),
    canManageEvents: () => canManageEvents(session),
    canManageAnnouncements: () => canManageAnnouncements(session),
    canManageNetworks: () => canManageNetworks(session),
    canManageCells: () => canManageCells(session),
    canManageUsers: () => canManageUsers(session),
    canLogCellMeeting: (cellId: string) => canLogCellMeeting(session, cellId),
    canViewCellReports: (cellId: string) => canViewCellReports(session, cellId),
    canViewNetworkReports: (networkId: string) => canViewNetworkReports(session, networkId),
    
    // User role checks
    isAdmin: () => isAdmin(session),
    isNetworkLeader: (networkId?: string) => isNetworkLeader(session, networkId),
    isCellLeader: (cellId?: string) => isCellLeader(session, cellId),
    hasRole: (role: Role) => hasRole(session, role),
    hasAnyRole: (roles: Role[]) => hasAnyRole(session, roles),
    
    // Scope helpers
    getCellIds: () => getCellIdsForUser(session),
    getNetworkIds: () => getNetworkIdsForUser(session),
  }
}