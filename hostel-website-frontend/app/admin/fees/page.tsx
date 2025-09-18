import { DashboardLayout } from "@/components/dashboard-layout"
import { AdminFeesContent } from "@/components/admin-fees-content"

export default function AdminFeesPage() {
  return (
    <DashboardLayout title="Fee Management" role="admin">
      <AdminFeesContent />
    </DashboardLayout>
  )
}
