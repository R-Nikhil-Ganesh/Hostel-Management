"use client"

import { useEffect, useState } from "react"
import api from "@/lib/axios"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Search, AlertTriangle } from "lucide-react"

type Student = {
  id: number
  username?: string
  email: string
  fee_status: "paid" | "pending" | "overdue" | string
  current_room?: string | null
}

export function AdminFeesContent() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(false)
  const [savingId, setSavingId] = useState<number | null>(null)

  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all" | "paid" | "pending" | "overdue">("all")

  useEffect(() => {
    fetchStudents()
  }, [])

  async function fetchStudents() {
    setLoading(true)
    try {
      const res = await api.get("/v1/students/")
      const data: Student[] = (res.data ?? []).map((s: any) => ({
        id: s.id,
        username: s.username,
        email: s.email,
        fee_status: s.fee_status ?? "pending",
        current_room: s.current_room ?? null,
      }))
      setStudents(data)
    } catch (err) {
      console.error("Failed to fetch students", err)
      alert("Failed to load students (see console).")
    } finally {
      setLoading(false)
    }
  }

  // Only show students who have a room assigned
  const visible = students
    .filter((s) => s.current_room) // <-- filter out those without room
    .filter((s) => {
      const q = search.trim().toLowerCase()
      const matchSearch =
        !q ||
        s.email.toLowerCase().includes(q) ||
        (s.current_room ?? "").toLowerCase().includes(q) ||
        (s.username ?? "").toLowerCase().includes(q)

      if (!matchSearch) return false
      if (filter === "all") return true
      return s.fee_status === filter
    })

  async function updateFeeStatus(id: number, status: Student["fee_status"]) {
    setSavingId(id)
    try {
      const res = await api.patch(`/v1/students/${id}/update/`, { fee_status: status })
      // Option A: use server response to update the single item
      const updated = res.data
      setStudents(prev => prev.map(p => p.id === id ? { ...p, fee_status: updated.fee_status, current_room: updated.current_room } : p))

      // Option B (safer): re-fetch entire list
      // await fetchStudents()
    } catch (err) {
      console.error("Failed to update fee status", err)
      alert("Failed to update fee status. See console for details.")
    } finally {
      setSavingId(null)
    }
  }
  const statusBadge = (s: Student) => {
    if (s.fee_status === "paid") return <Badge className="bg-green-100 text-green-800">Paid</Badge>
    if (s.fee_status === "overdue") return <Badge className="bg-red-100 text-red-800">Overdue</Badge>
    return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
            <div className="text-xs text-muted-foreground">Total students (all)</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">With Rooms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{students.filter((s) => s.current_room).length}</div>
            <div className="text-xs text-muted-foreground">Allocated</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{students.filter((s) => s.fee_status === "overdue").length}</div>
            <div className="text-xs text-muted-foreground">Need follow-up (all students)</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between w-full gap-4">
            <div>
              <CardTitle>Fee Status — Students with Rooms</CardTitle>
              <CardDescription>
                Showing only students who currently have a room assigned. Students without rooms are managed in the registry.
              </CardDescription>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:flex-none">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by email / room / username..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={fetchStudents}>Refresh</Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : visible.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No allocated students match.</div>
            ) : (
              visible.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">{s.email}</div>
                    <div className="text-sm text-muted-foreground">{s.current_room ?? "No room assigned"}</div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div>{statusBadge(s)}</div>

                    <Select
                      value={s.fee_status}
                      onValueChange={(v) => updateFeeStatus(s.id, v)}
                    >
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button size="sm" variant="outline" onClick={() => updateFeeStatus(s.id, s.fee_status)} disabled={savingId === s.id}>
                      {savingId === s.id ? "Saving…" : "Save"}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
