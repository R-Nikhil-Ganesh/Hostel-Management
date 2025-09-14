"use client"

import { useEffect, useState } from "react"
import api from "@/lib/axios"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Building2, Plus, Edit, Trash2, Search } from "lucide-react"

type Room = {
  id: number
  room_number: string
  room_type: string
  block: string
  floor: number
  monthly_rent: number
  facilities: string[]
  is_under_maintenance: boolean
  maintenance_issue?: string | null
  current_occupancy: number
  capacity: number
}

export default function AdminRoomManagement() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // Dialog / form state
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false)
  const [isEditRoomOpen, setIsEditRoomOpen] = useState(false)
  const [isAllocateRoomOpen, setIsAllocateRoomOpen] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)

  const availableFacilities = ["Wi-Fi", "AC", "Study Table", "Wardrobe", "Balcony", "Attached Bathroom"]

  const facilityMap: Record<string, string> = {
    "Wi-Fi": "has_wifi",
    "AC": "has_ac",
    "Study Table": "has_study_table",
    "Wardrobe": "has_wardrobe",
    "Balcony": "has_balcony",
    "Attached Bathroom": "has_attached_washroom",
  }

  const emptyRoomForm = {
    room_number: "",
    room_type: "Single",
    block: "A",
    floor: 1,
    monthly_rent: 0,
    facilities: [] as string[],
    is_under_maintenance: false,
    maintenance_issue: "",
  }

  const [roomForm, setRoomForm] = useState({ ...emptyRoomForm })

  const [allocationData, setAllocationData] = useState({
    student_name: "",
    student_id: "",
    student_email: "",
    student_phone: "",
  })

  // Fetch rooms from backend
  useEffect(() => {
    fetchRooms()
  }, [])

  const fetchRooms = async () => {
    setLoading(true)
    try {
      const res = await api.get("/v1/rooms/")
      const data: Room[] = (res.data || []).map((r: any) => {
        const facilities = Object.entries(facilityMap)
          .filter(([_, backendKey]) => r[backendKey])
          .map(([label]) => label)

        return {
          id: r.id,
          room_number: r.room_number ?? `#${r.id}`,
          room_type: r.room_type ?? "Single",
          block: r.block ?? "A",
          floor: r.floor ?? 1,
          monthly_rent: r.monthly_rent ?? 0,
          facilities,
          is_under_maintenance: r.is_under_maintenance ?? false,
          maintenance_issue: r.maintenance_issue ?? null,
          current_occupancy: r.current_occupancy ?? 0,
          capacity: r.capacity ?? (r.room_type === "Single" ? 1 : 2),
        }
      })
      setRooms(data)
    } catch (err) {
      console.error("Failed to fetch rooms:", err)
      alert("Failed to fetch rooms. Check console for details.")
    } finally {
      setLoading(false)
    }
  }

  // Derived status: maintenance > occupied > vacant
  const roomStatus = (r: Room) => {
    if (r.is_under_maintenance) return "maintenance"
    if ((r.current_occupancy ?? 0) >= (r.capacity ?? 1)) return "occupied"
    return "vacant"
  }


  const filteredRooms = rooms.filter((room) => {
    const q = searchTerm.trim().toLowerCase()
    const matchesSearch =
      room.room_number.toLowerCase().includes(q) ||
      room.block.toLowerCase().includes(q)

    const matchesStatus = statusFilter === "all" || roomStatus(room) === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "occupied":
        return "bg-blue-100 text-blue-800"
      case "vacant":
        return "bg-green-100 text-green-800"
      case "maintenance":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Create room
  const handleAddRoom = async () => {
    try {
      const facilitiesPayload: Record<string, boolean> = {}
      for (const [label, backendKey] of Object.entries(facilityMap)) {
        facilitiesPayload[backendKey] = roomForm.facilities.includes(label)
      }

      const payload = {
        room_number: roomForm.room_number,
        room_type: roomForm.room_type,
        block: roomForm.block,
        floor: roomForm.floor,
        monthly_rent: Number(roomForm.monthly_rent),
        is_under_maintenance: roomForm.is_under_maintenance,
        maintenance_issue: roomForm.maintenance_issue || null,
        ...facilitiesPayload,
      }

      await api.post("/v1/rooms/", payload)
      await fetchRooms()
      setIsAddRoomOpen(false)
      setRoomForm({ ...emptyRoomForm })
    } catch (err) {
      console.error("Error creating room:", err)
      alert("Failed to create room. Check console.")
    }
  }

  // Start edit
  const handleEditRoom = (room: Room) => {
    setSelectedRoom(room)
    setRoomForm({
      room_number: room.room_number,
      room_type: room.room_type,
      block: room.block,
      floor: room.floor,
      monthly_rent: room.monthly_rent ?? 0,
      facilities: room.facilities ?? [],
      is_under_maintenance: room.is_under_maintenance ?? false,
      maintenance_issue: room.maintenance_issue ?? "",
    })
    setIsEditRoomOpen(true)
  }

  // Save edit
  const handleSaveEdit = async () => {
    if (!selectedRoom) return
    try {
      const facilitiesPayload: Record<string, boolean> = {}
      for (const [label, backendKey] of Object.entries(facilityMap)) {
        facilitiesPayload[backendKey] = roomForm.facilities.includes(label)
      }

      const payload = {
        room_number: roomForm.room_number,
        room_type: roomForm.room_type,
        block: roomForm.block,
        floor: roomForm.floor,
        monthly_rent: Number(roomForm.monthly_rent),
        is_under_maintenance: roomForm.is_under_maintenance,
        maintenance_issue: roomForm.maintenance_issue || null,
        ...facilitiesPayload,
      }

      await api.put(`/v1/rooms/${selectedRoom.id}/`, payload)
      await fetchRooms()
      setIsEditRoomOpen(false)
      setSelectedRoom(null)
      setRoomForm({ ...emptyRoomForm })
    } catch (err) {
      console.error("Error updating room:", err)
      alert("Failed to update room. Check console.")
    }
  }

  // Delete
  const handleDeleteRoom = async (roomId: number) => {
    if (!confirm("Delete this room? This is irreversible.")) return
    try {
      await api.delete(`/v1/rooms/${roomId}/`)
      setRooms((prev) => prev.filter((r) => r.id !== roomId))
    } catch (err) {
      console.error("Error deleting room:", err)
      alert("Failed to delete room. Check console.")
    }
  }

  const handleAllocateRoom = (room: Room) => {
    setSelectedRoom(room)
    setAllocationData({ student_name: "", student_id: "", student_email: "", student_phone: "" })
    setIsAllocateRoomOpen(true)
  }

  // Allocate
const handleSaveAllocation = async () => {
  if (!selectedRoom) return
  if (!allocationData.student_email.trim()) {
    alert("Please provide student email for allocation.")
    return
  }

  try {
    await api.post("/v1/allocations/", {
      room_id: selectedRoom.id, // ✅ correct key
      student_email: allocationData.student_email, // ✅ required field
      start_date: new Date().toISOString().split("T")[0], // use today's date
      end_date: null, // adjust if needed
    })
    alert("Room allocated successfully!")
    setIsAllocateRoomOpen(false)
    setSelectedRoom(null)
    setAllocationData({ student_name: "", student_id: "", student_email: "", student_phone: "" })
    await fetchRooms() // refresh occupancy after allocation
  } catch (error: any) {
    console.error("Error allocating room:", error)
    alert(`Failed to allocate room. ${JSON.stringify(error.response?.data)}`)
  }
}


  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Building2 className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Rooms</p>
                <p className="text-2xl font-bold">{rooms.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Occupied</p>
                <p className="text-2xl font-bold">{rooms.filter((r) => roomStatus(r) === "occupied").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Building2 className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Vacant</p>
                <p className="text-2xl font-bold">{rooms.filter((r) => roomStatus(r) === "vacant").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Building2 className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Maintenance</p>
                <p className="text-2xl font-bold">{rooms.filter((r) => roomStatus(r) === "maintenance").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions / Filters */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle>Room Management</CardTitle>
            <CardDescription>Add, edit, and manage hostel rooms</CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Dialog open={isAddRoomOpen} onOpenChange={setIsAddRoomOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Room
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Room</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Room Number</Label>
                      <Input value={roomForm.room_number} onChange={(e) => setRoomForm({ ...roomForm, room_number: e.target.value })} />
                    </div>
                    <div>
                      <Label>Room Type</Label>
                      <Select value={roomForm.room_type} onValueChange={(v) => setRoomForm({ ...roomForm, room_type: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Single">Single</SelectItem>
                          <SelectItem value="Double">Double</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Block</Label>
                      <Select value={roomForm.block} onValueChange={(v) => setRoomForm({ ...roomForm, block: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A">A Block</SelectItem>
                          <SelectItem value="B">B Block</SelectItem>
                          <SelectItem value="C">C Block</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Floor</Label>
                      <Select value={String(roomForm.floor)} onValueChange={(v) => setRoomForm({ ...roomForm, floor: Number(v) })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Monthly Rent (₹)</Label>
                    <Input type="number" value={String(roomForm.monthly_rent)} onChange={(e) => setRoomForm({ ...roomForm, monthly_rent: Number(e.target.value) })} />
                  </div>

                  <div>
                    <Label>Facilities</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {availableFacilities.map((f) => (
                        <label key={f} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={roomForm.facilities.includes(f)}
                            onChange={(e) =>
                              setRoomForm({
                                ...roomForm,
                                facilities: e.target.checked ? [...roomForm.facilities, f] : roomForm.facilities.filter((x) => x !== f),
                              })
                            }
                          />
                          <span className="text-sm">{f}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button onClick={handleAddRoom} className="flex-1">Add Room</Button>
                    <Button variant="outline" onClick={() => { setIsAddRoomOpen(false); setRoomForm({ ...emptyRoomForm }) }} className="flex-1">Cancel</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by room number, block, or occupant..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>

            <div className="w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger><SelectValue placeholder="Filter by status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="occupied">Occupied</SelectItem>
                  <SelectItem value="vacant">Vacant</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Room Dialog */}
      <Dialog open={isEditRoomOpen} onOpenChange={setIsEditRoomOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Room</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Room Number</Label>
                <Input value={roomForm.room_number} onChange={(e) => setRoomForm({ ...roomForm, room_number: e.target.value })} />
              </div>
              <div>
                <Label>Room Type</Label>
                <Select value={roomForm.room_type} onValueChange={(v) => setRoomForm({ ...roomForm, room_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Single">Single</SelectItem>
                    <SelectItem value="Double">Double</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Block</Label>
                <Select value={roomForm.block} onValueChange={(v) => setRoomForm({ ...roomForm, block: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A Block</SelectItem>
                    <SelectItem value="B">B Block</SelectItem>
                    <SelectItem value="C">C Block</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Floor</Label>
                <Select value={String(roomForm.floor)} onValueChange={(v) => setRoomForm({ ...roomForm, floor: Number(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Monthly Rent (₹)</Label>
              <Input type="number" value={String(roomForm.monthly_rent)} onChange={(e) => setRoomForm({ ...roomForm, monthly_rent: Number(e.target.value) })} />
            </div>

            <div>
              <Label>Facilities</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {availableFacilities.map((f) => (
                  <label key={f} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={roomForm.facilities.includes(f)}
                      onChange={(e) =>
                        setRoomForm({
                          ...roomForm,
                          facilities: e.target.checked ? [...roomForm.facilities, f] : roomForm.facilities.filter((x) => x !== f),
                        })
                      }
                    />
                    <span className="text-sm">{f}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button onClick={handleSaveEdit} className="flex-1">Save Changes</Button>
              <Button variant="outline" onClick={() => { setIsEditRoomOpen(false); setSelectedRoom(null); setRoomForm({ ...emptyRoomForm }) }} className="flex-1">Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Allocate Dialog */}
      <Dialog open={isAllocateRoomOpen} onOpenChange={setIsAllocateRoomOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Allocate Room {selectedRoom?.room_number}</DialogTitle>
            <DialogDescription>Assign this room to a student (by email)</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Student Email</Label>
              <Input value={allocationData.student_email} onChange={(e) => setAllocationData({ ...allocationData, student_email: e.target.value })} placeholder="student@college.edu" />
            </div>

            <div>
              <Label>Student Name (optional)</Label>
              <Input value={allocationData.student_name} onChange={(e) => setAllocationData({ ...allocationData, student_name: e.target.value })} placeholder="Full name" />
            </div>

            <div className="flex items-center space-x-2">
              <Button onClick={handleSaveAllocation} className="flex-1">Allocate Room</Button>
              <Button variant="outline" onClick={() => { setIsAllocateRoomOpen(false); setSelectedRoom(null); setAllocationData({ student_name: "", student_id: "", student_email: "", student_phone: "" }) }} className="flex-1">Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Room List */}
      <Card>
        <CardHeader>
          <CardTitle>Rooms ({filteredRooms.length})</CardTitle>
          <CardDescription>Manage all hostel rooms and their details</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {filteredRooms.map((room) => (
              <div key={room.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-lg">Room {room.room_number}</h4>
                    <p className="text-sm text-muted-foreground">
                      {room.room_type} | Block {room.block} | Floor {room.floor} | ₹{room.monthly_rent}/month
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Occupancy: {room.current_occupancy ?? 0}/{room.capacity ?? (room.room_type === "Single" ? 1 : 2)}
                    </p>
                    {room.is_under_maintenance && room.maintenance_issue && (
                      <p className="text-sm text-red-600 mt-2">Maintenance: {room.maintenance_issue}</p>
                    )}
                  </div>

                  <Badge className={getStatusColor(roomStatus(room))}>{roomStatus(room)}</Badge>
                </div>

                <div className="mb-3">
                  <p className="text-sm font-medium">Facilities</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {room.facilities?.map((facility, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {facility}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" onClick={() => handleEditRoom(room)}>
                    <Edit className="h-3 w-3 mr-1" /> Edit
                  </Button>

                  <Button size="sm" variant="destructive" onClick={() => handleDeleteRoom(room.id)}>
                    <Trash2 className="h-3 w-3 mr-1" /> Delete
                  </Button>

                  {roomStatus(room) === "vacant" && (
                    <Button size="sm" onClick={() => handleAllocateRoom(room)}>
                      Allocate
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {filteredRooms.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No rooms found matching your criteria.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}