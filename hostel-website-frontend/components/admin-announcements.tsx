"use client"

import { useEffect, useState } from "react"
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  Megaphone,
  Search,
  Filter,
  Edit,
  Trash2,
  Calendar,
  Plus,
} from "lucide-react"

interface Announcement {
  id: number
  title: string
  message: string
  priority: string
  category: string
  created_at: string
  is_read: boolean
}

export function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] =
    useState<Announcement | null>(null)
  const [form, setForm] = useState({
    title: "",
    message: "",
    priority: "medium",
    category: "general",
  })

  // Fetch announcements
  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const fetchAnnouncements = async () => {
    try {
      const res = await api.get("/v1/announcements/")
      setAnnouncements(res.data)
    } catch (err) {
      console.error("Error fetching announcements:", err)
    }
  }

  // Handle form changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSelect = (name: string, value: string) => {
    setForm({ ...form, [name]: value })
  }

  // Create or Update
  const handleSubmit = async () => {
    try {
      if (editingAnnouncement) {
        const res = await api.put(
          `/v1/announcements/${editingAnnouncement.id}/`,
          form
        )
        setAnnouncements((prev) =>
          prev.map((a) => (a.id === editingAnnouncement.id ? res.data : a))
        )
      } else {
        const res = await api.post("/v1/announcements/", form)
        setAnnouncements((prev) => [...prev, res.data])
      }

      setForm({ title: "", message: "", priority: "medium", category: "general" })
      setEditingAnnouncement(null)
      setIsDialogOpen(false)
    } catch (err) {
      console.error("Error saving announcement:", err)
    }
  }

  // Delete
  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/v1/announcements/${id}/`)
      setAnnouncements((prev) => prev.filter((a) => a.id !== id))
    } catch (err) {
      console.error("Error deleting announcement:", err)
    }
  }

  // Filter + Search
  const filteredAnnouncements = announcements.filter((announcement) => {
    const matchesSearch =
      announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      announcement.message.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory =
      categoryFilter === "all" || announcement.category === categoryFilter

    return matchesSearch && matchesCategory
  })

  // Helpers
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "maintenance":
        return "bg-orange-100 text-orange-800"
      case "food":
        return "bg-green-100 text-green-800"
      case "facilities":
        return "bg-blue-100 text-blue-800"
      case "inspection":
        return "bg-purple-100 text-purple-800"
      case "events":
        return "bg-pink-100 text-pink-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      {/* Filters + Create */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Announcement Management</CardTitle>
            <CardDescription>Monitor and manage announcements</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingAnnouncement(null)
                  setForm({
                    title: "",
                    message: "",
                    priority: "medium",
                    category: "general",
                  })
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Announcement
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingAnnouncement ? "Edit Announcement" : "New Announcement"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Title"
                />
                <Textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Message"
                />
                <Select
                  value={form.priority}
                  onValueChange={(v) => handleSelect("priority", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={form.category}
                  onValueChange={(v) => handleSelect("category", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="food">Food</SelectItem>
                    <SelectItem value="facilities">Facilities</SelectItem>
                    <SelectItem value="inspection">Inspection</SelectItem>
                    <SelectItem value="events">Events</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleSubmit}>
                  {editingAnnouncement ? "Update" : "Create"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search announcements..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-40">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="food">Food</SelectItem>
                  <SelectItem value="facilities">Facilities</SelectItem>
                  <SelectItem value="inspection">Inspection</SelectItem>
                  <SelectItem value="events">Events</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Announcements List */}
      <Card>
        <CardHeader>
          <CardTitle>
            All Announcements ({filteredAnnouncements.length})
          </CardTitle>
          <CardDescription>Overview and management</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredAnnouncements.map((announcement) => (
              <div key={announcement.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-lg mb-2">
                      {announcement.title}
                    </h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      {announcement.message}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(
                          announcement.created_at
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2 ml-4">
                    <Badge className={getPriorityColor(announcement.priority)}>
                      {announcement.priority}
                    </Badge>
                    <Badge
                      className={getCategoryColor(announcement.category)}
                      variant="outline"
                    >
                      {announcement.category}
                    </Badge>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingAnnouncement(announcement)
                      setForm({
                        title: announcement.title,
                        message: announcement.message,
                        priority: announcement.priority,
                        category: announcement.category,
                      })
                      setIsDialogOpen(true)
                    }}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(announcement.id)}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}

            {filteredAnnouncements.length === 0 && (
              <div className="text-center py-8">
                <Megaphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No announcements found matching your criteria.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
