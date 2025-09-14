import { DashboardLayout } from "@/components/dashboard-layout"
import AdminRoomManagement from "@/components/admin-room-management"

export default function AdminRooms() {
  return (
    <DashboardLayout title="Room Management" role="admin">
      <AdminRoomManagement />
    </DashboardLayout>
  )
}
