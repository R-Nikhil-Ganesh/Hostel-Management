"use client"

import { useEffect, useState } from "react"
import api from "@/lib/axios"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, Edit, Trash2, Mail, MapPin } from "lucide-react"

type Student = {
  id: number | string
  email: string
  room_number?: string | null
  fee_status: "paid" | "pending" | "overdue"
}

export function AdminStudentsContent() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [searchTerm, setSearchTerm] = useState("")
  const [feeFilter, setFeeFilter] = useState<string>("all")

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [newEmail, setNewEmail] = useState("")
  const [newRoom, setNewRoom] = useState("")
  const [newFeeStatus, setNewFeeStatus] = useState<Student["fee_status"]>("pending")

  useEffect(() => {
    fetchStudents()
  }, [])

  async function fetchStudents() {
    setLoading(true)
    try {
      const res = await api.get("/v1/students/")
      const raw = (res.data ?? []) as any[]

      const normalized: Student[] = raw.map((item) => {
        // server may return email under email or username; room under current_room
        const email = (item.email ?? item.username ?? item.email_read ?? "") as string
        const fee_status = (item.fee_status ?? item.status ?? "pending") as Student["fee_status"]
        const room_number = item.current_room ?? item.room_number ?? item.room ?? null
        return {
          id: item.id,
          email: String(email),
          room_number,
          fee_status,
        }
      })

      setStudents(normalized)
    } catch (err: any) {
      console.error("Failed to load students", err)
      const msg = err?.response?.data || err.message || "Failed to load students"
      alert(String(msg))
    } finally {
      setLoading(false)
    }
  }

  const filteredStudents = students.filter((s) => {
    const email = (s.email || "").toLowerCase()
    const room = (s.room_number || "").toLowerCase()
    const q = searchTerm.trim().toLowerCase()
    const matchesSearch = q === "" || email.includes(q) || room.includes(q)
    const matchesFee = feeFilter === "all" || s.fee_status === feeFilter
    return matchesSearch && matchesFee
  })

  // CREATE
  const handleAddStudent = async () => {
    if (!newEmail.trim()) {
      alert("Please provide an email.")
      return
    }
    setSaving(true)
    try {
      // POST to the create endpoint we designed
      const payload = {
        email: newEmail.trim(),
        fee_status: newFeeStatus,
        // NOTE: allocation by room is done via Allocation endpoint; sending room here is optional
        // If backend supports creating allocation from this endpoint, it can read room_number.
        room_number: newRoom || null,
      }
      const res = await api.post("/v1/students/add/", payload)
      const item = res.data ?? {}

      const email = (item.email ?? item.username ?? item.email_read ?? "") as string
      const normalized: Student = {
        id: item.id,
        email: String(email),
        room_number: item.current_room ?? item.room_number ?? item.room ?? null,
        fee_status: (item.fee_status ?? "pending") as Student["fee_status"],
      }

      setStudents((prev) => [normalized, ...prev])
      setNewEmail("")
      setNewRoom("")
      setNewFeeStatus("pending")
      setIsAddDialogOpen(false)
    } catch (err: any) {
      console.error("Failed to add student", err)
      const msg = err?.response?.data || err.message || "Failed to add student"
      alert(String(msg))
    } finally {
      setSaving(false)
    }
  }

  // OPEN EDIT
  const openEditDialog = (student: Student) => {
    setSelectedStudent(student)
    setIsEditDialogOpen(true)
  }

  // UPDATE (fee_status and optionally room_number)
  const handleEditStudent = async () => {
    if (!selectedStudent) return
    setSaving(true)
    try {
      const payload: Partial<Student> = {
        fee_status: selectedStudent.fee_status,
        // backend update endpoint expects fee_status, room allocation should be done via allocation endpoints;
        // we still send room_number in case your backend accepts it for convenience
        room_number: selectedStudent.room_number ?? null,
      }
      const res = await api.patch(`/v1/students/${selectedStudent.id}/update/`, payload)
      const item = res.data ?? {}
      const email = (item.email ?? item.username ?? item.email_read ?? "") as string

      const updated: Student = {
        id: item.id,
        email: String(email),
        room_number: item.current_room ?? item.room_number ?? item.room ?? null,
        fee_status: (item.fee_status ?? selectedStudent.fee_status) as Student["fee_status"],
      }
      setStudents((prev) => prev.map((s) => (s.id === selectedStudent.id ? updated : s)))
      setSelectedStudent(null)
      setIsEditDialogOpen(false)
    } catch (err: any) {
      console.error("Failed to update student", err)
      const msg = err?.response?.data || err.message || "Failed to update student"
      alert(String(msg))
    } finally {
      setSaving(false)
    }
  }

  // DELETE
  const handleDeleteStudent = async (id: number | string) => {
    if (!confirm("Delete this student account? This cannot be undone.")) return
    setSaving(true)
    try {
      // backend delete endpoint may not exist yet; this is a standard REST call
      await api.delete(`/v1/students/${id}/`)
      setStudents((prev) => prev.filter((s) => s.id !== id))
    } catch (err: any) {
      console.error("Failed to delete", err)
      const msg = err?.response?.data || err.message || "Failed to delete student"
      alert(String(msg))
    } finally {
      setSaving(false)
    }
  }

  const getFeeBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case "overdue":
        return <Badge className="bg-red-100 text-red-800">Overdue</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">With Rooms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{students.filter((s) => s.room_number).length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{students.filter((s) => s.fee_status === "paid").length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{students.filter((s) => s.fee_status === "pending").length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{students.filter((s) => s.fee_status === "overdue").length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
            <div>
              <CardTitle>Student Registry</CardTitle>
              <CardDescription>Admin-managed student accounts</CardDescription>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={feeFilter} onValueChange={setFeeFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Fee status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>

              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button disabled={saving}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Email
                  </Button>
                </DialogTrigger>

                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add Student Email</DialogTitle>
                  </DialogHeader>

                  <div className="space-y-2 mt-2">
                    <div>
                      <Label>Email</Label>
                      <Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="student@example.edu" />
                    </div>

                    <div>
                      <Label>Room (optional)</Label>
                      <Input value={newRoom} onChange={(e) => setNewRoom(e.target.value)} placeholder="A-101" />
                    </div>

                    <div>
                      <Label>Fee status</Label>
                      <Select value={newFeeStatus} onValueChange={(v) => setNewFeeStatus(v as Student["fee_status"])}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="overdue">Overdue</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={saving}>Cancel</Button>
                    <Button onClick={handleAddStudent} disabled={saving}>Add</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-3">
            {filteredStudents.map((student) => (
              <Card key={student.id}>
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div className="font-medium">{student.email}</div>
                      <div className="ml-3">{getFeeBadge(student.fee_status)}</div>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground flex items-center gap-3">
                      <MapPin className="h-4 w-4" />
                      <div>{student.room_number || "No room assigned"}</div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(student)} disabled={saving}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteStudent(student.id)} disabled={saving}>
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredStudents.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">{loading ? "Loading..." : "No emails found."}</div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
          </DialogHeader>

          {selectedStudent && (
            <div className="space-y-4 mt-2">
              <div>
                <Label>Email</Label>
                <Input value={selectedStudent.email} readOnly />
              </div>

              <div>
                <Label>Room Number</Label>
                <Input
                  value={selectedStudent.room_number ?? ""}
                  onChange={(e) =>
                    setSelectedStudent((prev) => (prev ? { ...prev, room_number: e.target.value || null } : prev))
                  }
                />
              </div>

              <div>
                <Label>Fee Status</Label>
                <Select
                  value={selectedStudent.fee_status}
                  onValueChange={(v) =>
                    setSelectedStudent((prev) => (prev ? { ...prev, fee_status: v as Student["fee_status"] } : prev))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleEditStudent} disabled={saving}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
