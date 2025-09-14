import { DashboardLayout } from "@/components/dashboard-layout"
import { StudentDashboardContent } from "@/components/student-dashboard-content"

export default function StudentDashboard() {
  return (
    <DashboardLayout title="Student Dashboard" role="student">
      <StudentDashboardContent />
    </DashboardLayout>
  )
}
