import { DashboardLayout } from "@/components/layout/dashboard-layout"

export default function NetworkLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DashboardLayout>{children}</DashboardLayout>
}
