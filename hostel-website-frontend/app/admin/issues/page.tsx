import { DashboardLayout } from "@/components/dashboard-layout"
import { AdminComplaintsContent } from "@/components/admin-issues-content"

export default function AdminIssuesPage() {
  return (
    <DashboardLayout title="System Issues" role="admin">
      <AdminComplaintsContent />
    </DashboardLayout>
  )
}
