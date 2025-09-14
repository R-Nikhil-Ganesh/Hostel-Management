import { DashboardLayout } from "@/components/dashboard-layout"
import { AdminReports } from "@/components/admin-reports"

export default function AdminReportsPage() {
  return (
    <DashboardLayout title="Reports & Analytics" role="admin">
      <AdminReports />
    </DashboardLayout>
  )
}
