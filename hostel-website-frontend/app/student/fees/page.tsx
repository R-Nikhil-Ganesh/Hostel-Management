import { DashboardLayout } from "@/components/dashboard-layout"
import { StudentFeesContent } from "@/components/student-fees-content"

export default function StudentFeesPage() {
  return (
    <DashboardLayout title="Fee Payment" role="student">
      <StudentFeesContent />
    </DashboardLayout>
  )
}
