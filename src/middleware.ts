import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export default auth((req) => {
  const token = req.auth
  const { pathname } = req.nextUrl

  // Allow access to public routes
  if (pathname === "/" || pathname === "/login") {
    // Redirect to dashboard if authenticated user tries to access login
    if (token && pathname === "/login") {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }
    return NextResponse.next()
  }

  // Redirect to login if not authenticated and trying to access protected routes
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  // Role-based route protection
  if (token) {
    const userRoles = (token as any).roles as Array<{ role: string; networkId?: string; cellId?: string }> || []
    const hasRole = (role: string) => userRoles.some(r => r.role === role)
    const isAdmin = hasRole("ADMIN")
    const isNetworkLeader = hasRole("NETWORK_LEADER")
    const isCellLeader = hasRole("CELL_LEADER")

    // Admin-only routes
    if (pathname.startsWith("/admin") && !isAdmin) {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    // Network leader routes
    if (pathname.startsWith("/network") && !isAdmin && !isNetworkLeader) {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    // Cell leader routes
    if (pathname.startsWith("/cell") && !isAdmin && !isNetworkLeader && !isCellLeader) {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$).*)",
  ],
}
