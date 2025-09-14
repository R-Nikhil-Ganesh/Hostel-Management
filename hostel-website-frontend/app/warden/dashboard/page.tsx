import { DashboardLayout } from "@/components/dashboard-layout"
import { WardenDashboardContent } from "@/components/warden-dashboard-content"

export default function WardenDashboard() {
  return (
    <DashboardLayout title="Warden Dashboard" role="warden">
      <WardenDashboardContent />
    </DashboardLayout>
  )
}
