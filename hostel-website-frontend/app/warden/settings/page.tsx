import { DashboardLayout } from "@/components/dashboard-layout"
import { WardenSettingsContent } from "@/components/warden-settings-content"

export default function WardenSettingsPage() {
  const mockUser = {
    name: "Dr. Sarah Wilson",
    email: "sarah.wilson@university.edu",
    id: "WAR001",
  }

  return (
    <DashboardLayout role="warden" user={mockUser}>
      <WardenSettingsContent />
    </DashboardLayout>
  )
}
