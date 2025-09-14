import { DashboardLayout } from "@/components/dashboard-layout"
import { AdminAnnouncements } from "@/components/admin-announcements"

export default function AdminAnnouncementsPage() {
  return (
    <DashboardLayout title="Announcements Management" role="admin">
      <AdminAnnouncements />
    </DashboardLayout>
  )
}
