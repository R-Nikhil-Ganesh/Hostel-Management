import { DashboardLayout } from "@/components/dashboard-layout"
import { AdminDashboardContent } from "@/components/admin-dashboard-content"

export default function AdminDashboard() {
  return (
    <DashboardLayout title="Admin Dashboard" role="admin">
      <AdminDashboardContent />
    </DashboardLayout>
  )
}
