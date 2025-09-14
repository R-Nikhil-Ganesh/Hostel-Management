"use client"

import { useState, useEffect } from "react"
import api from "@/lib/axios"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Building2,
  Users,
  Search,
  Filter,
  Edit,
  Eye,
  Wifi,
  Snowflake,
  Disc as Desk,
  Shirt,
} from "lucide-react"

export function WardenRoomManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [rooms, setRooms] = useState<any[]>([])
  const [selectedRoom, setSelectedRoom] = useState<any>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  // editForm now holds facility booleans so backend receives booleans
  const [editForm, setEditForm] = useState({
    occupant: "",
    occupantId: "",
    notes: "",
    has_ac: false,
    has_wifi: false,
    has_study_table: false,
    has_wardrobe: false,
    has_balcony: false,
    has_attached_washroom: false,
  })

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await api.get("/v1/rooms/")
        setRooms(res.data)
      } catch (err) {
        console.error("Failed to fetch rooms:", err)
      }
    }
    fetchRooms()
  }, [])

  const filteredRooms = rooms.filter((room) => {
    const q = searchTerm.trim().toLowerCase()
    const matchesSearch =
      q.length === 0 ||
      room.number?.toLowerCase().includes(q) ||
      (room.occupant && room.occupant.toLowerCase().includes(q)) ||
      room.block?.toLowerCase().includes(q)

    const matchesStatus = statusFilter === "all" || room.status === statusFilter
    const matchesType =
      typeFilter === "all" || room.type?.toLowerCase() === typeFilter

    return matchesSearch && matchesStatus && matchesType
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "occupied":
        return <Users className="h-4 w-4" />
      case "vacant":
        return <Building2 className="h-4 w-4" />
      case "maintenance":
        return <Building2 className="h-4 w-4" />
      default:
        return null
    }
  }

  const getFacilityIcon = (facility: string) => {
    switch (facility.toLowerCase()) {
      case "wi-fi":
        return <Wifi className="h-3 w-3" />
      case "ac":
        return <Snowflake className="h-3 w-3" />
      case "study table":
        return <Desk className="h-3 w-3" />
      case "wardrobe":
        return <Shirt className="h-3 w-3" />
      default:
        return null
    }
  }

  const handleViewDetails = (room: any) => {
    setSelectedRoom(room)
    setShowDetailsModal(true)
  }

  const handleEditRoom = (room: any) => {
    setSelectedRoom(room)
    setEditForm({
      occupant: room.occupant || "",
      occupantId: room.occupantId || "",
      notes: room.notes || "",
      has_ac: !!room.has_ac,
      has_wifi: !!room.has_wifi,
      has_study_table: !!room.has_study_table,
      has_wardrobe: !!room.has_wardrobe,
      has_balcony: !!room.has_balcony,
      has_attached_washroom: !!room.has_attached_washroom,
    })
    setShowEditModal(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedRoom) return
    try {
      // send boolean fields to backend
      const payload = {
        occupant: editForm.occupant,
        occupantId: editForm.occupantId,
        notes: editForm.notes,
        has_ac: editForm.has_ac,
        has_wifi: editForm.has_wifi,
        has_study_table: editForm.has_study_table,
        has_wardrobe: editForm.has_wardrobe,
        has_balcony: editForm.has_balcony,
        has_attached_washroom: editForm.has_attached_washroom,
      }
      await api.patch(`/v1/rooms/${selectedRoom.id}/`, payload)
      setRooms((prev) =>
        prev.map((r) =>
          r.id === selectedRoom.id ? { ...r, ...payload } : r
        )
      )
      setShowEditModal(false)
    } catch (err) {
      console.error("Failed to update room:", err)
    }
  }

  const handleMarkAsFixed = async (roomId: number) => {
    try {
      await api.patch(`/v1/rooms/${roomId}/`, { status: "vacant" })
      setRooms((prev) =>
        prev.map((room) =>
          room.id === roomId ? { ...room, status: "vacant", issue: undefined } : room
        )
      )
    } catch (err) {
      console.error("Failed to mark as fixed:", err)
    }
  }

  return (
    <div className="space-y-6">
      {/* Room Statistics */}
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
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Occupied</p>
                <p className="text-2xl font-bold">{rooms.filter((r) => r.status === "occupied").length}</p>
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
                <p className="text-2xl font-bold">{rooms.filter((r) => r.status === "vacant").length}</p>
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
                <p className="text-2xl font-bold">{rooms.filter((r) => r.status === "maintenance").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Rooms</CardTitle>
          <CardDescription>Search and filter room information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by room number, occupant, or block..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-40">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="occupied">Occupied</SelectItem>
                  <SelectItem value="vacant">Vacant</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-40">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="double">Double</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Room List */}
      <Card>
        <CardHeader>
          <CardTitle>Room Directory ({filteredRooms.length})</CardTitle>
          <CardDescription>Manage room allocations and details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredRooms.map((room) => (
              <div key={room.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-lg">Room {room.room_number}</h4>
                    <p className="text-sm text-muted-foreground">
                      {room.type} Room | Block {room.block} | Floor {room.floor}
                    </p>
                  </div>
                  <Badge className={getStatusColor(room.status)}>
                    {getStatusIcon(room.status)}
                    <span className="ml-1 capitalize">{room.status}</span>
                  </Badge>
                </div>

                {room.occupant && (
                  <div className="mb-3">
                    <p className="text-sm font-medium">Current Occupant(s)</p>
                    <p className="text-sm text-muted-foreground">{room.occupant}</p>
                    <p className="text-xs text-muted-foreground">ID: {room.occupantId}</p>
                  </div>
                )}

                {room.status === "maintenance" && room.issue && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-red-600">Maintenance Issue</p>
                    <p className="text-sm text-muted-foreground">{room.issue}</p>
                  </div>
                )}

                <p className="text-sm font-medium">Facilities</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {/* render directly from booleans */}
                  {room.has_ac && (
                    <Badge variant="outline" className="text-xs flex items-center gap-1">
                      {getFacilityIcon("AC")}
                      AC
                    </Badge>
                  )}
                  {room.has_wifi && (
                    <Badge variant="outline" className="text-xs flex items-center gap-1">
                      {getFacilityIcon("Wi-Fi")}
                      Wi-Fi
                    </Badge>
                  )}
                  {room.has_study_table && (
                    <Badge variant="outline" className="text-xs flex items-center gap-1">
                      {getFacilityIcon("Study Table")}
                      Study Table
                    </Badge>
                  )}
                  {room.has_wardrobe && (
                    <Badge variant="outline" className="text-xs flex items-center gap-1">
                      {getFacilityIcon("Wardrobe")}
                      Wardrobe
                    </Badge>
                  )}
                  {room.has_balcony && (
                    <Badge variant="outline" className="text-xs flex items-center gap-1">
                      {getFacilityIcon("Balcony")}
                      Balcony
                    </Badge>
                  )}
                  {room.has_attached_washroom && (
                    <Badge variant="outline" className="text-xs flex items-center gap-1">
                      {getFacilityIcon("Attached Washroom")}
                      Attached Washroom
                    </Badge>
                  )}

                  {/* fallback */}
                  {!room.has_ac &&
                    !room.has_wifi &&
                    !room.has_study_table &&
                    !room.has_wardrobe &&
                    !room.has_balcony &&
                    !room.has_attached_washroom && (
                      <span className="text-xs text-gray-500">No facilities</span>
                    )}
                </div>

                <div className="flex space-x-2 mt-3">
                  <Button size="sm" variant="outline" onClick={() => handleViewDetails(room)}>
                    <Eye className="h-3 w-3 mr-1" />
                    View Details
                  </Button>
                  {room.status === "maintenance" && (
                    <Button size="sm" onClick={() => handleMarkAsFixed(room.id)}>
                      Mark as Fixed
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

      {/* Room Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Room {selectedRoom?.number} Details</DialogTitle>
            <DialogDescription>Complete room information and specifications</DialogDescription>
          </DialogHeader>
          {selectedRoom && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Room Type</Label>
                  <p className="text-sm text-muted-foreground">{selectedRoom.room_type}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge className={getStatusColor(selectedRoom.status)}>
                    {getStatusIcon(selectedRoom.status)}
                    <span className="ml-1 capitalize">{selectedRoom.status}</span>
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Block</Label>
                  <p className="text-sm text-muted-foreground">Block {selectedRoom.block}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Floor</Label>
                  <p className="text-sm text-muted-foreground">Floor {selectedRoom.floor}</p>
                </div>
              </div>

              {selectedRoom.occupant && (
                <div>
                  <Label className="text-sm font-medium">Current Occupant(s)</Label>
                  <p className="text-sm text-muted-foreground">{selectedRoom.occupant}</p>
                  <p className="text-xs text-muted-foreground">ID: {selectedRoom.occupantId}</p>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium">Facilities</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedRoom.has_ac && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      {getFacilityIcon("AC")}
                      AC
                    </Badge>
                  )}
                  {selectedRoom.has_wifi && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      {getFacilityIcon("Wi-Fi")}
                      Wi-Fi
                    </Badge>
                  )}
                  {selectedRoom.has_study_table && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      {getFacilityIcon("Study Table")}
                      Study Table
                    </Badge>
                  )}
                  {selectedRoom.has_wardrobe && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      {getFacilityIcon("Wardrobe")}
                      Wardrobe
                    </Badge>
                  )}
                  {selectedRoom.has_balcony && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      {getFacilityIcon("Balcony")}
                      Balcony
                    </Badge>
                  )}
                  {selectedRoom.has_attached_washroom && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      {getFacilityIcon("Attached Washroom")}
                      Attached Washroom
                    </Badge>
                  )}

                  {!selectedRoom.has_ac &&
                    !selectedRoom.has_wifi &&
                    !selectedRoom.has_study_table &&
                    !selectedRoom.has_wardrobe &&
                    !selectedRoom.has_balcony &&
                    !selectedRoom.has_attached_washroom && (
                      <span className="text-xs text-gray-500">No facilities</span>
                    )}
                </div>
              </div>

              {selectedRoom.issue && (
                <div>
                  <Label className="text-sm font-medium text-red-600">Maintenance Issue</Label>
                  <p className="text-sm text-muted-foreground">{selectedRoom.issue}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Room Edit/Allocate Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedRoom?.status === "vacant" ? "Allocate" : "Edit"} Room {selectedRoom?.number}
            </DialogTitle>
            <DialogDescription>Update room allocation and details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="occupant">Occupant Name(s)</Label>
              <Input
                id="occupant"
                value={editForm.occupant}
                onChange={(e) => setEditForm({ ...editForm, occupant: e.target.value })}
                placeholder="Enter occupant name(s)"
              />
            </div>
            <div>
              <Label htmlFor="occupantId">Student ID(s)</Label>
              <Input
                id="occupantId"
                value={editForm.occupantId}
                onChange={(e) => setEditForm({ ...editForm, occupantId: e.target.value })}
                placeholder="Enter student ID(s)"
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                placeholder="Additional notes..."
              />
            </div>

            {/* Optionally, add controls for facility booleans here later if you want to edit them */}

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit}>Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
