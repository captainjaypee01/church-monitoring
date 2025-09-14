import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export default auth((req) => {
  const token = req.auth
  const { pathname } = req.nextUrl

  // Allow access to public routes and API routes
  if (pathname === "/" || pathname === "/login" || pathname === "/test" || pathname.startsWith("/api/")) {
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
    const userData = (token as any).userData as { role: string; isNetworkLeader: boolean; isCellLeader: boolean } || {}
    const isAdmin = userData.role === "ADMIN"
    const isNetworkLeader = userData.role === "NETWORK_LEADER" || userData.isNetworkLeader
    const isCellLeader = userData.role === "CELL_LEADER" || userData.isCellLeader

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
     * - api (all API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$).*)",
  ],
}
