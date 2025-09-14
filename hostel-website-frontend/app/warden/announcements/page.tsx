import { DashboardLayout } from "@/components/dashboard-layout"
import { WardenAnnouncements } from "@/components/warden-announcements"

export default function WardenAnnouncementsPage() {
  return (
    <DashboardLayout title="Announcements" role="warden">
      <WardenAnnouncements />
    </DashboardLayout>
  )
}
