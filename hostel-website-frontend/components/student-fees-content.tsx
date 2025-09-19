"use client"

import { useEffect, useState } from "react"
import api from "@/lib/axios"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search } from "lucide-react"

type Student = {
  id: number
  username?: string
  email: string
  fee_status: "paid" | "pending" | "overdue" | string
  current_room?: string | null
}

export function StudentFeesContent() {
  const [students, setStudents] = useState<Student[]>([])
  const [meId, setMeId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [updating, setUpdating] = useState(false)

  const [search, setSearch] = useState("")

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const meRes = await api.get("/v1/me/")
      setMeId(meRes.data?.id ?? null)

      const studentsRes = await api.get("/v1/students/")
      setStudents(
        (studentsRes.data ?? []).map((s: any) => ({
          id: s.id,
          username: s.username,
          email: s.email,
          fee_status: s.fee_status ?? "pending",
          current_room: s.current_room ?? null,
        }))
      )
    } catch (err) {
      console.error("Failed to load student info", err)
      alert("Failed to load student data")
    } finally {
      setLoading(false)
    }
  }

  const me = students.find((s) => s.id === meId)

  async function payFee() {
    if (!me) return
    setUpdating(true)
    try {
      await api.post("/v1/fees/pay/")
      await load()
    } catch (err) {
      console.error("Payment failed", err)
      alert("Payment failed")
    } finally {
      setUpdating(false)
    }
  }

  const statusBadge = (status: string) => {
    if (status === "paid") return <Badge className="bg-green-100 text-green-800">Paid</Badge>
    if (status === "overdue") return <Badge className="bg-red-100 text-red-800">Overdue</Badge>
    return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
  }

  // Only show the logged-in student
  const visible = me ? [me] : []

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle>My Fee</CardTitle>
            <CardDescription>View your current fee status</CardDescription>
          </div>
          <Badge className="bg-yellow-100 text-yellow-800">Student view</Badge>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div>Loading…</div>
          ) : visible.length === 0 ? (
            <div>No student data found.</div>
          ) : (
            visible.map((s) => (
              <div key={s.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border rounded-lg">
                <div>
                  <div className="font-medium">{s.email}</div>
                  <div className="text-sm text-muted-foreground">{s.current_room ?? "No room assigned"}</div>
                </div>

                <div className="flex items-center gap-4">
                  {statusBadge(s.fee_status)}

                  {s.fee_status !== "paid" && (
                    <Button onClick={payFee} disabled={updating}>
                      {updating ? "Processing…" : "Pay Now"}
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
