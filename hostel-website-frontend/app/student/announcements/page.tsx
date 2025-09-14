import { DashboardLayout } from "@/components/dashboard-layout"
import { StudentAnnouncements } from "@/components/student-announcements"

export default function StudentAnnouncementsPage() {
  return (
    <DashboardLayout title="Announcements" role="student">
      <StudentAnnouncements />
    </DashboardLayout>
  )
}
