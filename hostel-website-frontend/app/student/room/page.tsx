import { DashboardLayout } from "@/components/dashboard-layout"
import { StudentRoom } from "@/components/student-room"

export default function StudentAnnouncementsPage() {
  return (
    <DashboardLayout title="Room" role="student">
      <StudentRoom />
    </DashboardLayout>
  )
}