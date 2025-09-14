import { DashboardLayout } from "@/components/dashboard-layout"
import { WardenRoomManagement } from "@/components/warden-room-management"

export default function WardenRooms() {
  return (
    <DashboardLayout title="Room Management" role="warden">
      <WardenRoomManagement />
    </DashboardLayout>
  )
}
