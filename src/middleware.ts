import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export default withAuth(
  function middleware(req: NextRequest) {
    const token = req.nextauth.token
    const { pathname } = req.nextUrl

    // Redirect to login if not authenticated and trying to access protected routes
    if (!token && pathname !== "/login" && pathname !== "/") {
      return NextResponse.redirect(new URL("/login", req.url))
    }

    // Redirect to dashboard if authenticated user tries to access login
    if (token && pathname === "/login") {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    // Role-based route protection
    if (token) {
      const userRoles = token.roles as Array<{ role: string; networkId?: string; cellId?: string }> || []
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
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to public routes
        if (req.nextUrl.pathname === "/" || req.nextUrl.pathname === "/login") {
          return true
        }
        
        // Require authentication for all other routes
        return !!token
      },
    },
  }
)

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
