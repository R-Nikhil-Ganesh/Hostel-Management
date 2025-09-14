import { DashboardLayout } from "@/components/dashboard-layout"
import { StudentSettingsContent } from "@/components/student-settings-content"

export default function StudentSettingsPage() {
  const mockUser = {
    name: "John Doe",
    email: "john.doe@university.edu",
    id: "STU001",
  }

  return (
    <DashboardLayout role="student" user={mockUser}>
      <StudentSettingsContent />
    </DashboardLayout>
  )
}
