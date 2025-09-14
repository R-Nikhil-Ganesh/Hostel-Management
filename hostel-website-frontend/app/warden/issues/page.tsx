import { DashboardLayout } from "@/components/dashboard-layout"
import { WardenIssuesContent } from "@/components/warden-issues-content"

export default function WardenIssuesPage() {
  return (
    <DashboardLayout title="Student Issues" role="warden">
      <WardenIssuesContent />
    </DashboardLayout>
  )
}
