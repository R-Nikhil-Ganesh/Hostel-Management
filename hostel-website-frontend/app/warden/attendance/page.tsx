import { DashboardLayout } from "@/components/dashboard-layout"
import { WardenAttendanceContent } from "@/components/warden-attendance-content"

export default function WardenAttendancePage() {

  return (
    <DashboardLayout title="Daily Attendance" role="warden">
      <WardenAttendanceContent />
    </DashboardLayout>
  )
}
