import { DashboardLayout } from "@/components/dashboard-layout"
import { AdminSettingsContent } from "@/components/admin-settings-content"

export default function AdminSettingsPage() {
  const mockUser = {
    name: "Michael Chen",
    email: "michael.chen@university.edu",
    id: "ADM001",
  }

  return (
    <DashboardLayout role="admin" user={mockUser}>
      <AdminSettingsContent />
    </DashboardLayout>
  )
}
