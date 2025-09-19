"use client"

import { useEffect, useState } from "react"
import api from "@/lib/axios"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarDays, CheckCircle, XCircle, Clock, Users, TrendingUp, Download, Search, Filter } from "lucide-react"

interface Student {
  id: number
  name: string
  email: string
  room?: string | null
  status: "present" | "absent" | "late"
  time_marked?: string | null
}

interface AttendanceSummary {
  total: number
  present: number
  absent: number
  late: number
  attendance_percentage: number
}

interface AttendanceHistoryRecord {
  date: string
  present: number
  absent: number
  late: number
}

export function WardenAttendanceContent() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [students, setStudents] = useState<Student[]>([])
  const [summary, setSummary] = useState<AttendanceSummary>({
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
    attendance_percentage: 0,
  })
  const [history, setHistory] = useState<AttendanceHistoryRecord[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [loading, setLoading] = useState(false)
  const [updating, setUpdating] = useState(false)

  const loadAttendance = async () => {
    setLoading(true)
    try {
      const [todayRes, summaryRes, historyRes] = await Promise.all([
        api.get("v1/attendance/", { params: { start_date: selectedDate, end_date: selectedDate } }),
        api.get("v1/attendance/summary/", { params: { start_date: selectedDate, end_date: selectedDate } }),
        api.get("v1/attendance/history/"),
      ])

      const mappedStudents: Student[] = todayRes.data.map((a: any) => ({
        id: a.id,
        name: a.student.name,
        email: a.student.email,
        room: a.student.room,
        status: a.status,
        time_marked: a.time_marked ? a.time_marked.slice(0, 5) : null,
      }))

      setStudents(mappedStudents)
      setSummary(summaryRes.data)
      setHistory(historyRes.data)
    } catch (err) {
      console.error("Failed to fetch attendance", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAttendance()
  }, [selectedDate])

  const handleStatusChange = async (studentId: number, newStatus: "present" | "absent" | "late") => {
    setUpdating(true)
    try {
      await api.patch(`/v1/attendance/${studentId}/`, { status: newStatus })
      await loadAttendance()
    } catch (err) {
      console.error("Failed to update status", err)
      alert("Failed to update attendance")
    } finally {
      setUpdating(false)
    }
  }

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.room ?? "").toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === "all" || student.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const exportAttendance = () => {
    const data = { date: selectedDate, students, summary }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `attendance-${selectedDate}.json`
    a.click()
    URL.revokeObjectURL(url)
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Daily Attendance</h2>
          <p className="text-muted-foreground">Mark and track student attendance</p>
        </div>
        <div className="flex items-center gap-3">
          <Label htmlFor="date" className="text-sm font-medium">
            Date:
          </Label>
          <Input
            id="date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto"
          />
          <Button onClick={exportAttendance} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Present</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summary.present}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Absent</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summary.absent}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Late</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{summary.late}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Attendance %</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{summary.attendance_percentage}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="today" className="space-y-4">
        <TabsList>
          <TabsTrigger value="today">Today's Attendance</TabsTrigger>
          <TabsTrigger value="history">Attendance History</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by name, email, or room..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Students</SelectItem>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
                <SelectItem value="late">Late</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Student list */}
          <Card>
            <CardHeader>
              <CardTitle>Student Attendance - {selectedDate}</CardTitle>
              <CardDescription>Mark attendance for each student</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  <div>Loading…</div>
                ) : (
                  filteredStudents.map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <div>
                            <h4 className="font-medium">{student.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {student.email} • Room {student.room ?? "N/A"}
                            </p>
                          </div>
                          {student.time_marked && (
                            <Badge variant="outline" className="ml-auto">
                              {new Date(student.time_marked).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            student.status === "present"
                              ? "default"
                              : student.status === "late"
                              ? "secondary"
                              : "destructive"
                          }
                          className={
                            student.status === "present"
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : student.status === "late"
                              ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                              : "bg-red-100 text-red-800 hover:bg-red-200"
                          }
                        >
                          {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                        </Badge>
                        <Select
                          value={student.status}
                          onValueChange={(value: "present" | "absent" | "late") =>
                            handleStatusChange(student.id, value)
                          }
                          disabled={updating}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="present">Present</SelectItem>
                            <SelectItem value="absent">Absent</SelectItem>
                            <SelectItem value="late">Late</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Attendance History</CardTitle>
              <CardDescription>View past attendance records and trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {history.map((record, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <CalendarDays className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <h4 className="font-medium">{record.date}</h4>
                        <p className="text-sm text-muted-foreground">{record.present + record.absent + record.late} total students</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-sm font-medium text-green-600">{record.present}</div>
                        <div className="text-xs text-muted-foreground">Present</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-red-600">{record.absent}</div>
                        <div className="text-xs text-muted-foreground">Absent</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-yellow-600">{record.late}</div>
                        <div className="text-xs text-muted-foreground">Late</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
