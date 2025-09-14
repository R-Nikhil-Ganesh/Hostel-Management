import { DashboardLayout } from "@/components/dashboard-layout"
import { WardenOutpassManagement } from "@/components/warden-outpass-management"

export default function WardenOutpass() {
  return (
    <DashboardLayout title="Outpass Management" role="warden">
      <WardenOutpassManagement />
    </DashboardLayout>
  )
}
