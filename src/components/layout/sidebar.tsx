"use client"

import { useSession } from "next-auth/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { getUserPermissions } from "@/lib/rbac"
import {
  Home,
  Users,
  Calendar,
  Megaphone,
  BarChart3,
  Settings,
  Church,
  FileText,
  HandHeart,
  UserCheck,
  Network,
} from "lucide-react"

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: Home,
    roles: ["ADMIN", "NETWORK_LEADER", "CELL_LEADER", "MEMBER"],
  },
  {
    name: "Cell Management",
    href: "/cell",
    icon: Church,
    roles: ["ADMIN", "NETWORK_LEADER", "CELL_LEADER"],
  },
  {
    name: "Network Overview",
    href: "/network",
    icon: Network,
    roles: ["ADMIN", "NETWORK_LEADER"],
  },
  {
    name: "Events",
    href: "/events",
    icon: Calendar,
    roles: ["ADMIN", "NETWORK_LEADER", "CELL_LEADER", "MEMBER"],
  },
  {
    name: "Profile",
    href: "/profile",
    icon: UserCheck,
    roles: ["ADMIN", "NETWORK_LEADER", "CELL_LEADER", "MEMBER"],
  },
  {
    name: "Admin",
    href: "/admin",
    icon: Settings,
    roles: ["ADMIN"],
    children: [
      { name: "Users", href: "/admin/users", icon: Users },
      { name: "Networks & Cells", href: "/admin/networks", icon: Network },
      { name: "Events", href: "/admin/events", icon: Calendar },
      { name: "Announcements", href: "/admin/announcements", icon: Megaphone },
      { name: "Reports", href: "/admin/reports", icon: BarChart3 },
      { name: "Volunteers", href: "/admin/volunteers", icon: HandHeart },
    ],
  },
]

export function Sidebar() {
  const { data: session } = useSession()
  const pathname = usePathname()

  if (!session?.user) {
    return null
  }

  const permissions = getUserPermissions(session)
  const userRoles = session.roles?.map((role) => role.role) || []

  const hasAccess = (roles: string[]) => {
    return roles.some((role) => userRoles.includes(role as any))
  }

  return (
    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
      <div className="flex-1 flex flex-col min-h-0 bg-gray-800">
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <Church className="h-8 w-8 text-white mr-2" />
            <span className="text-white text-lg font-semibold">CMS</span>
          </div>
          <nav className="mt-5 flex-1 px-2 space-y-1">
            {navigation
              .filter((item) => hasAccess(item.roles))
              .map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                
                if (item.children) {
                  return (
                    <div key={item.name}>
                      <div
                        className={cn(
                          isActive
                            ? "bg-gray-900 text-white"
                            : "text-gray-300 hover:bg-gray-700 hover:text-white",
                          "group flex items-center px-2 py-2 text-sm font-medium rounded-md"
                        )}
                      >
                        <item.icon
                          className="text-gray-400 mr-3 flex-shrink-0 h-5 w-5"
                          aria-hidden="true"
                        />
                        {item.name}
                      </div>
                      <div className="ml-8 space-y-1">
                        {item.children.map((child) => {
                          const isChildActive = pathname === child.href
                          return (
                            <Link
                              key={child.name}
                              href={child.href}
                              className={cn(
                                isChildActive
                                  ? "bg-gray-900 text-white"
                                  : "text-gray-300 hover:bg-gray-700 hover:text-white",
                                "group flex items-center px-2 py-2 text-sm font-medium rounded-md"
                              )}
                            >
                              <child.icon
                                className="text-gray-400 mr-3 flex-shrink-0 h-4 w-4"
                                aria-hidden="true"
                              />
                              {child.name}
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  )
                }

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      isActive
                        ? "bg-gray-900 text-white"
                        : "text-gray-300 hover:bg-gray-700 hover:text-white",
                      "group flex items-center px-2 py-2 text-sm font-medium rounded-md"
                    )}
                  >
                    <item.icon
                      className="text-gray-400 mr-3 flex-shrink-0 h-5 w-5"
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                )
              })}
          </nav>
        </div>
        <div className="flex-shrink-0 flex bg-gray-700 p-4">
          <div className="flex items-center">
            <div className="ml-3">
              <p className="text-sm font-medium text-white">{session.user.name}</p>
              <p className="text-xs font-medium text-gray-300">
                {userRoles.join(", ")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
