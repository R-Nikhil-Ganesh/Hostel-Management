"use client"

import { useEffect, useMemo, useState } from "react"
import api from "@/lib/axios"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { FileText, Users, Building2, DollarSign, TrendingUp, Megaphone, AlertTriangle } from "lucide-react"

// ----------------- Types -----------------
type Room = {
  id: number
  room_number?: string
  room_type?: string
  block?: string
  floor?: number
  monthly_rent?: number | string
  current_occupancy?: number
  capacity?: number
}

type Allocation = {
  id: number
  student?: any
  room?: number | Room
  start_date?: string
  end_date?: string | null
}

type Complaint = {
  id: number
  title: string
  status_display: string
  created_at: string
  student?: { email?: string }
}

type Announcement = {
  id: number
  title: string
  description?: string
  created_at: string
}

// ----------------- Component -----------------
export function AdminDashboardContent() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [allocations, setAllocations] = useState<Allocation[]>([])
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        // rooms
        const roomsRes = await api.get("/v1/rooms/")
        setRooms(roomsRes.data || [])

        // allocations
        const allocRes = await api.get("/v1/allocations/")
        setAllocations(allocRes.data || [])

        // complaints (recent 5)
        const compRes = await api.get("/v1/complaints/")
        setComplaints((compRes.data || []).slice(0, 5))

        // announcements (recent 5)
        const annRes = await api.get("/v1/announcements/")
        setAnnouncements((annRes.data || []).slice(0, 5))
      } catch (err) {
        console.error("Dashboard load error:", err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Stats
  const totals = useMemo(() => {
    const totalCapacity = rooms.reduce((s, r) => s + (Number(r.capacity ?? 0)), 0)
    const totalOccupied = rooms.reduce((s, r) => s + (Number(r.current_occupancy ?? 0)), 0)
    const avgOccupancyPct = totalCapacity > 0 ? (totalOccupied / totalCapacity) * 100 : 0
    const monthlyRevenue = rooms.reduce(
      (s, r) => s + (Number(r.monthly_rent ?? 0) * Number(r.current_occupancy ?? 0)),
      0
    )
    const activeAllocations = allocations.filter((a) => !a.end_date)
    const totalStudents = activeAllocations.length

    return {
      totalCapacity,
      totalOccupied,
      avgOccupancyPct: Number(avgOccupancyPct.toFixed(1)),
      monthlyRevenue: Math.round(monthlyRevenue),
      totalStudents,
    }
  }, [rooms, allocations])

  if (loading) return <div>Loading dashboard…</div>

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Occupancy</p>
                <p className="text-2xl font-bold">{totals.avgOccupancyPct}%</p>
                <p className="text-xs text-green-600">
                  {totals.totalOccupied}/{totals.totalCapacity} occupied
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Monthly Revenue</p>
                <p className="text-2xl font-bold">₹{totals.monthlyRevenue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Students</p>
                <p className="text-2xl font-bold">{totals.totalStudents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Building2 className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Rooms</p>
                <p className="text-2xl font-bold">{rooms.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Complaints */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Complaints</CardTitle>
            <CardDescription>Last 5 complaints submitted</CardDescription>
          </CardHeader>
          <CardContent>
            {complaints.length === 0 ? (
              <p className="text-sm text-muted-foreground">No complaints yet.</p>
            ) : (
              <ul className="space-y-2">
                {complaints.map((c) => (
                  <li key={c.id} className="p-2 border rounded-md flex justify-between">
                    <div>
                      <p className="font-medium">{c.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.student?.email || "Unknown"} • {new Date(c.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded bg-gray-100">{c.status_display}</span>
                  </li>
                ))}
              </ul>
            )}
            <Button variant="outline" className="mt-3 w-full" onClick={() => (window.location.href = "/admin/issues")}>
              View All Complaints
            </Button>
          </CardContent>
        </Card>

        {/* Recent Announcements */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Announcements</CardTitle>
            <CardDescription>Last 5 announcements</CardDescription>
          </CardHeader>
          <CardContent>
            {announcements.length === 0 ? (
              <p className="text-sm text-muted-foreground">No announcements yet.</p>
            ) : (
              <ul className="space-y-2">
                {announcements.map((a) => (
                  <li key={a.id} className="p-2 border rounded-md">
                    <p className="font-medium">{a.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(a.created_at).toLocaleDateString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            <Button variant="outline" className="mt-3 w-full" onClick={() => (window.location.href = "/admin/announcements")}>
              View All Announcements
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
