"use client"

import { useEffect, useState } from "react"
import api from "@/lib/axios"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Wifi, Snowflake, LampDeskIcon as Desk, Archive, LampDeskIcon } from "lucide-react"

export function StudentRoom() {
  const [allocation, setAllocation] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const res = await api.get("/v1/allocations/my_room/")
        setAllocation(res.data)
      } catch (err: any) {
        if (err.response?.status === 404) {
          setAllocation(null)
        } else {
          console.error("Failed to fetch room:", err)
          setError("Failed to load room")
        }
      } finally {
        setLoading(false)
      }
    }
    fetchRoom()
  }, [])

  if (loading) return <div>Loading room…</div>
  if (error) return <div className="text-red-500">{error}</div>
  if (!allocation) return <div>No room assigned yet.</div>

  const room = allocation.room
  const facilities = [
    room.has_wifi && "Wi-Fi",
    room.has_ac && "AC",
    room.has_study_table && "Study Table",
    room.has_wardrobe && "Wardrobe",
    room.has_balcony && "Balcony",
    room.has_attached_washroom && "Attached Washroom",
  ].filter(Boolean)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{room.room_number ?? `Room ${room.id}`}</CardTitle>
        <div className="text-sm text-muted-foreground">
          {room.room_type ?? "Room"} — Occupancy:{" "}
          {room.current_occupancy ?? "?"}/{room.capacity ?? "?"}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold">Facilities</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {facilities.map((f: string, i: number) => (
                <div
                  key={i}
                  className="flex items-center space-x-2 p-3 border rounded-lg"
                >
                  {f === "Wi-Fi" && <Wifi className="h-5 w-5 text-primary" />}
                  {f === "AC" && <Snowflake className="h-5 w-5 text-primary" />}
                  {f === "Study Table" && <Desk className="h-5 w-5 text-primary" />}
                  {f === "Wardrobe" && <Archive className="h-5 w-5 text-primary" />}
                  <span className="text-sm">{f}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex space-x-4">
            <Button variant="outline">Report Room Issue</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
