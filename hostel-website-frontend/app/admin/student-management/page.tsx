import { DashboardLayout } from "@/components/dashboard-layout"
import { AdminStudentsContent } from "@/components/admin-student-content"

const mockUser = {
  name: "Admin User",
  email: "admin@hostel.com",
  id: "admin-1",
}

export default function AdminStudentsPage() {
  return (
    <DashboardLayout title="Student Management" role="admin">
      <AdminStudentsContent />
    </DashboardLayout>
  )
}
