import { DashboardLayout } from "@/components/dashboard-layout"
import { StudentIssuesContent } from "@/components/student-issues-content"

export default function StudentIssuesPage() {
  const mockUser = {
    name: "John Doe",
    email: "john.doe@university.edu",
    id: "STU001",
  }

  return (
    <DashboardLayout role="student" user={mockUser}>
      <StudentIssuesContent />
    </DashboardLayout>
  )
}
