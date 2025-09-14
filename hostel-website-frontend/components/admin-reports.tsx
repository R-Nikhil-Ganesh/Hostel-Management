"use client"

import { useEffect, useMemo, useState } from "react"
import api from "@/lib/axios"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { FileText, ClipboardCheck, AlertTriangle, Users, Building2, DollarSign, TrendingUp } from "lucide-react"

/**
 * AdminReports (data-driven)
 *
 * - Fetches rooms, allocations and optional maintenance issues from backend.
 * - Computes occupancy, revenue, block performance etc.
 * - Keeps your original layout and visuals intact.
 *
 * Endpoints used (best-effort):
 *  - GET /v1/rooms/
 *  - GET /v1/allocations/?active=true  (or /v1/allocations/)
 *  - GET /v1/maintenance/  OR GET /v1/issues/
 *  - Export endpoints attempted: GET /v1/reports/<slug>/download/
 *
 * The component degrades gracefully if endpoints are missing.
 */

type Room = {
  id: number
  room_number?: string
  room_type?: string
  block?: string
  floor?: number
  monthly_rent?: number | string
  current_occupancy?: number
  capacity?: number
  is_under_maintenance?: boolean
  maintenance_issue?: string | null
}

type Allocation = {
  id: number
  student?: any
  room?: number | Room
  start_date?: string
  end_date?: string | null
}

type Issue = {
  id: number
  block?: string
  room?: number
  status?: string
  created_at?: string
  summary?: string
}

export function AdminReports() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [allocations, setAllocations] = useState<Allocation[]>([])
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        // 1) rooms
        const roomsRes = await api.get("/v1/rooms/")
        const roomsData = Array.isArray(roomsRes.data) ? roomsRes.data : []
        // normalise numeric fields
        const roomsNorm: Room[] = roomsData.map((r: any) => ({
          id: r.id,
          room_number: r.room_number,
          room_type: r.room_type,
          block: r.block ?? "Unknown",
          floor: r.floor ?? 0,
          monthly_rent: typeof r.monthly_rent === "string" ? parseFloat(r.monthly_rent) : Number(r.monthly_rent ?? 0),
          current_occupancy: Number(r.current_occupancy ?? 0),
          capacity: Number(r.capacity ?? (r.room_type === "Single" ? 1 : 2)),
          is_under_maintenance: Boolean(r.is_under_maintenance),
          maintenance_issue: r.maintenance_issue ?? null,
        }))

        // 2) allocations — try to fetch active allocations; some APIs return only user's allocations
        let allocData: Allocation[] = []
        try {
          const allocRes = await api.get("/v1/allocations/")
          allocData = Array.isArray(allocRes.data) ? allocRes.data : []
        } catch (err) {
          // fallback: empty — not fatal
          allocData = []
        }

        // 3) maintenance/issues (optional)
        let issuesData: Issue[] = []
        try {
          const issuesRes = await api.get("/v1/maintenance/")
          issuesData = Array.isArray(issuesRes.data) ? issuesRes.data : []
        } catch {
          try {
            const issuesRes2 = await api.get("/v1/issues/")
            issuesData = Array.isArray(issuesRes2.data) ? issuesRes2.data : []
          } catch {
            issuesData = []
          }
        }

        if (!mounted) return
        setRooms(roomsNorm)
        setAllocations(allocData)
        setIssues(issuesData)
      } catch (err: any) {
        console.error("AdminReports load error:", err)
        setError("Failed to load reports data (check console).")
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  // Derived metrics
  const totals = useMemo(() => {
    const totalCapacity = rooms.reduce((s, r) => s + (Number(r.capacity ?? 0)), 0)
    const totalOccupied = rooms.reduce((s, r) => s + (Number(r.current_occupancy ?? 0)), 0)
    const avgOccupancyPct = totalCapacity > 0 ? (totalOccupied / totalCapacity) * 100 : 0
    const monthlyRevenue = rooms.reduce((s, r) => s + (Number(r.monthly_rent ?? 0) * Number(r.current_occupancy ?? 0)), 0)

    // group by block
    const blocks = new Map<string, { capacity: number; occupied: number; revenue: number; issues: number }>()
    for (const r of rooms) {
      const block = r.block ?? "Unknown"
      const entry = blocks.get(block) ?? { capacity: 0, occupied: 0, revenue: 0, issues: 0 }
      entry.capacity += Number(r.capacity ?? 0)
      entry.occupied += Number(r.current_occupancy ?? 0)
      entry.revenue += Number(r.monthly_rent ?? 0) * Number(r.current_occupancy ?? 0)
      blocks.set(block, entry)
    }

    // count issues per block (if issues include a block field)
    for (const it of issues) {
      const b = it.block ?? "Unknown"
      const entry = blocks.get(b)
      if (entry) entry.issues += 1
      else blocks.set(b, { capacity: 0, occupied: 0, revenue: 0, issues: 1 })
    }

    const blockPerformance = Array.from(blocks.entries()).map(([block, data]) => {
      const occupancyPct = data.capacity > 0 ? (data.occupied / data.capacity) * 100 : 0
      return {
        block,
        occupancy: Number(occupancyPct.toFixed(1)),
        revenue: Math.round(data.revenue),
        issues: data.issues,
      }
    })

    // active students: count allocations with end_date null OR missing
    const activeAllocations = allocations.filter((a) => a.end_date === null || a.end_date === undefined)
    const totalStudents = activeAllocations.length

    return {
      totalCapacity,
      totalOccupied,
      avgOccupancyPct: Number(avgOccupancyPct.toFixed(1)),
      monthlyRevenue: Math.round(monthlyRevenue),
      blockPerformance,
      totalStudents,
      totalIssues: issues.length,
      activeAllocations,
    }
  }, [rooms, allocations, issues])

  // quick export helper (attempts to download, falls back gracefully)
  async function handleExport(slug: string) {
    try {
      // attempt an API export endpoint
      const res = await api.get(`/v1/reports/${slug}/download/`, { responseType: "blob" })
      const blob = new Blob([res.data])
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${slug}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error("Export failed", err)
      alert("Export not available on server. Check console for details.")
    }
  }

  if (loading) {
    return <div>Loading reports…</div>
  }

  if (error) {
    return <div className="text-red-600">{error}</div>
  }

  // Keep original UI layout but plugged with live data
  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Occupancy</p>
                <p className="text-2xl font-bold">{totals.avgOccupancyPct}%</p>
                <p className="text-xs text-green-600">{totals.totalOccupied} occupied / {totals.totalCapacity} capacity</p>
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
                <p className="text-xs text-blue-600">Based on current occupancy</p>
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
                <p className="text-xs text-purple-600">{allocations.length} allocations total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Building2 className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Issues</p>
                <p className="text-2xl font-bold">{totals.totalIssues}</p>
                <p className="text-xs text-orange-600">From maintenance/issues endpoint</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Block Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Block Performance</CardTitle>
            <CardDescription>Occupancy and revenue by hostel blocks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {totals.blockPerformance.length === 0 ? (
              <div className="text-sm text-muted-foreground">No block data available.</div>
            ) : (
              totals.blockPerformance.map((block, index) => (
                <div key={index} className="space-y-3 p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{block.block}</h4>
                    <div className="text-right">
                      <p className="text-sm font-medium">₹{block.revenue.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{block.occupancy}% occupied</p>
                    </div>
                  </div>
                  <Progress value={block.occupancy} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Occupancy: {block.occupancy}%</span>
                    <span>{block.issues} active issues</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Occupancy Trends (simple monthly estimate) */}
        <Card>
          <CardHeader>
            <CardTitle>Occupancy Snapshot</CardTitle>
            <CardDescription>Current occupancy and revenue snapshot</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Current Month Snapshot</p>
                <p className="text-sm text-muted-foreground">{totals.totalOccupied}/{totals.totalCapacity} occupied</p>
              </div>
              <div className="text-right">
                <p className="font-medium">₹{totals.monthlyRevenue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Estimated monthly revenue</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Quick breakdown</p>
              <div className="grid grid-cols-1 gap-2">
                <div className="p-3 border rounded-lg">
                  <div className="flex justify-between">
                    <span>Total rooms</span>
                    <strong>{rooms.length}</strong>
                  </div>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="flex justify-between">
                    <span>Total capacity</span>
                    <strong>{totals.totalCapacity}</strong>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Reports */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Reports</CardTitle>
            <CardDescription>Generate specific reports instantly</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start bg-transparent" onClick={() => handleExport("student-directory")}>
              <FileText className="h-4 w-4 mr-2" />
              Student Directory Report
            </Button>

            <Button variant="outline" className="w-full justify-start bg-transparent" onClick={() => handleExport("room-allocation")}>
              <Building2 className="h-4 w-4 mr-2" />
              Room Allocation Report
            </Button>

            <Button variant="outline" className="w-full justify-start bg-transparent" onClick={() => handleExport("financial-summary")}>
              <DollarSign className="h-4 w-4 mr-2" />
              Financial Summary
            </Button>

            <Button variant="outline" className="w-full justify-start bg-transparent" onClick={() => handleExport("occupancy-analytics")}>
              <TrendingUp className="h-4 w-4 mr-2" />
              Occupancy Analytics
            </Button>
          </CardContent>
        </Card>

        {/* System Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>System Statistics</CardTitle>
            <CardDescription>Overall system health & activity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 border rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{totals.avgOccupancyPct}%</p>
                <p className="text-xs text-muted-foreground">Avg Occupancy</p>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <p className="text-2xl font-bold text-green-600">{totals.totalStudents}</p>
                <p className="text-xs text-muted-foreground">Active Students</p>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{rooms.length}</p>
                <p className="text-xs text-muted-foreground">Total Rooms</p>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <p className="text-2xl font-bold text-orange-600">{totals.totalIssues}</p>
                <p className="text-xs text-muted-foreground">Active Issues</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
