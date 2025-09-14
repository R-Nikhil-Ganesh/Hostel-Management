import { DashboardLayout } from "@/components/dashboard-layout"
import { OutpassRequestForm } from "@/components/outpass-request-form"

export default function StudentOutpass() {
  return (
    <DashboardLayout title="Outpass Requests" role="student">
      <OutpassRequestForm />
    </DashboardLayout>
  )
}
