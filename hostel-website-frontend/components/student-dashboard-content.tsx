"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import api from "@/lib/axios"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Building2, FileText, Users, AlertCircle, Megaphone, Calendar } from "lucide-react"

type RoomShape = {
  room_number?: string
  room_type?: string
  floor?: string | number
  block?: string
  facilities?: string[]
  has_wifi?: boolean
  has_ac?: boolean
  has_study_table?: boolean
  has_wardrobe?: boolean
  has_balcony?: boolean
  has_attached_washroom?: boolean
  capacity?: number
  current_occupancy?: number
  id?: number
}

type Outpass = {
  id: number
  reason: string
  from_date?: string
  to_date?: string
  date?: string
  status: string
}

type Issue = {
  id: number
  title: string
  status: string
  created_at?: string
  date?: string
}

type Announcement = {
  id: number
  title: string
  content?: string
  created_at?: string
  date?: string
}

export function StudentDashboardContent() {
  const router = useRouter()

  const [roomAlloc, setRoomAlloc] = useState<any | null>(null)
  const [outpasses, setOutpasses] = useState<Outpass[]>([])
  const [issues, setIssues] = useState<Issue[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const getStatusColor = (status: string) => {
    switch ((status || "").toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      case "in-progress":
      case "in_progress":
        return "bg-blue-100 text-blue-800"
      case "resolved":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      try {
        const [roomRes, outRes, issueRes, annRes] = await Promise.all([
          api.get("/v1/allocations/my_room/").catch(() => null),
          api.get("/v1/outpasses/?limit=5&ordering=-date").catch(() => null),
          api.get("/v1/complaints/?limit=5&ordering=-created_at").catch(() => null),
          api.get("/v1/announcements/?limit=5&ordering=-created_at").catch(() => null),
        ])

        setRoomAlloc(roomRes?.data ?? null)

        const normalize = <T,>(r: any): T[] => {
          if (!r) return []
          if (Array.isArray(r)) return r
          if (r.results && Array.isArray(r.results)) return r.results
          return typeof r === "object" ? (r as any) : []
        }

        setOutpasses(normalize<Outpass>(outRes?.data))
        setIssues(normalize<Issue>(issueRes?.data))
        setAnnouncements(normalize<Announcement>(annRes?.data))
      } catch (err) {
        console.error("dashboard fetch error", err)
        setError("Failed to load dashboard. Try refreshing.")
      } finally {
        setLoading(false)
      }
    }

    fetchAll()
  }, [])

  if (loading) return <p className="text-center py-6 text-muted-foreground">Loading dashboard…</p>
  if (error) return <p className="text-center py-6 text-red-500">{error}</p>

  const room: RoomShape | null = (() => {
    if (!roomAlloc) return null
    if (roomAlloc.room) return roomAlloc.room as RoomShape
    return roomAlloc as RoomShape
  })()

  const facilitiesList = (r: RoomShape | null) => {
    if (!r) return []
    if (Array.isArray(r.facilities) && r.facilities.length) return r.facilities
    const f: string[] = []
    if (r.has_wifi) f.push("Wi-Fi")
    if (r.has_ac) f.push("AC")
    if (r.has_study_table) f.push("Study Table")
    if (r.has_wardrobe) f.push("Wardrobe")
    if (r.has_balcony) f.push("Balcony")
    if (r.has_attached_washroom) f.push("Attached Washroom")
    return f
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-foreground mb-1">Welcome back!</h2>
        <p className="text-sm text-muted-foreground">Quick view of your room, outpasses, issues and announcements.</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Building2 className="h-8 w-8 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Room</p>
              <p className="text-xl font-semibold">{room?.room_number ?? "-"}</p>
              <p className="text-xs text-muted-foreground">{room?.room_type ?? ""}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Occupancy</p>
              <p className="text-xl font-semibold">{room ? `${room.current_occupancy ?? "?"}/${room.capacity ?? "?"}` : "-"}</p>
              <p className="text-xs text-muted-foreground">Capacity</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Recent Outpasses</p>
              <p className="text-xl font-semibold">{outpasses.length}</p>
              <p className="text-xs text-muted-foreground">Latest requests</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-8 w-8 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Issues</p>
              <p className="text-xl font-semibold">{issues.length}</p>
              <p className="text-xs text-muted-foreground">Open & recent</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Room */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" /> My Room</CardTitle>
            <CardDescription>Your current allocation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {room ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Room Number</p>
                    <p className="text-lg font-semibold">{room.room_number}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Type</p>
                    <p className="text-lg font-semibold">{room.room_type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Floor</p>
                    <p className="text-lg font-semibold">{room.floor}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Block</p>
                    <p className="text-lg font-semibold">{room.block}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-2">Facilities</p>
                  <div className="flex flex-wrap gap-2">
                    {facilitiesList(room).length ? (
                      facilitiesList(room).map((f, idx) => (
                        <Badge key={idx} variant="secondary">{f}</Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No facilities data</p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No room assigned yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Outpasses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Recent Outpasses</CardTitle>
            <CardDescription>Your recent outpass requests (quick view)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {outpasses.length ? (
              outpasses.map((o) => (
                <div key={o.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{o.reason}</p>
                    <p className="text-xs text-muted-foreground">{o.from_date ?? o.date ?? o.to_date}</p>
                  </div>
                  <Badge className={getStatusColor(o.status)}>{o.status}</Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No recent outpasses</p>
            )}

            <div>
              <Button className="w-full" onClick={() => router.push("/student/outpass")}>Apply for New Outpass</Button>
            </div>
          </CardContent>
        </Card>

        {/* Issues */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><AlertCircle className="h-5 w-5" /> My Issues</CardTitle>
            <CardDescription>Open and recent issues you reported</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {issues.length ? (
              issues.map((it) => (
                <div key={it.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{it.title}</p>
                    <p className="text-xs text-muted-foreground">{it.created_at ?? it.date}</p>
                  </div>
                  <Badge className={getStatusColor(it.status)}>{it.status}</Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No issues reported</p>
            )}

            <div>
              <Button className="w-full" onClick={() => router.push("/student/issues")}>Report New Issue</Button>
            </div>
          </CardContent>
        </Card>

        {/* Announcements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Megaphone className="h-5 w-5" /> Announcements</CardTitle>
            <CardDescription>Latest notices from hostel management</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {announcements.length ? (
              announcements.map((a) => (
                <div key={a.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium">{a.title}</h4>
                    <span className="text-xs text-muted-foreground flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {a.created_at ? new Date(a.created_at).toLocaleDateString() : (a.date ?? "")}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{a.content}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No announcements</p>
            )}

            <div>
              <Button variant="outline" className="w-full bg-transparent" onClick={() => router.push("/student/announcements")}>
                View All Announcements
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
