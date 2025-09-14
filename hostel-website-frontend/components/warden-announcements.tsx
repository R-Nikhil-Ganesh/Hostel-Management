"use client"

import { useState, useEffect } from "react"
import api from "@/lib/axios"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Megaphone, Plus, Edit, Trash2, Calendar } from "lucide-react"

export function WardenAnnouncements() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<any>(null)
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    message: "",
    priority: "medium",
    category: "general",
  })

  // Fetch announcements from backend
  useEffect(() => {
    api
      .get("/v1/announcements/")
      .then((res) => setAnnouncements(res.data))
      .catch((err) => console.error("Error fetching announcements:", err))
  }, [])

  // Create
  const handleCreateAnnouncement = () => {
    api
      .post("/v1/announcements/", newAnnouncement)
      .then((res) => {
        setAnnouncements([...announcements, res.data])
        setIsCreateOpen(false)
        setNewAnnouncement({
          title: "",
          message: "",
          priority: "medium",
          category: "general",
        })
      })
      .catch((err) => console.error("Error creating:", err))
  }

  // Edit
  const handleEditAnnouncement = (announcement: any) => {
    setEditingAnnouncement(announcement)
    setIsEditOpen(true)
  }

  const handleSaveEdit = () => {
    if (editingAnnouncement) {
      api
        .put(`/announcements/${editingAnnouncement.id}/`, editingAnnouncement)
        .then((res) => {
          setAnnouncements(
            announcements.map((a) => (a.id === editingAnnouncement.id ? res.data : a))
          )
          setIsEditOpen(false)
          setEditingAnnouncement(null)
        })
        .catch((err) => console.error("Error editing:", err))
    }
  }

  // Delete
  const handleDeleteAnnouncement = (id: number) => {
    api
      .delete(`/announcements/${id}/`)
      .then(() => {
        setAnnouncements(announcements.filter((a) => a.id !== id))
      })
      .catch((err) => console.error("Error deleting:", err))
  }

  // Priority color helper
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

  // Category color helper
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
      case "general":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Megaphone className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Announcements</p>
                <p className="text-2xl font-bold">{announcements.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Announcement */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Manage Announcements</CardTitle>
              <CardDescription>Create and manage announcements for students</CardDescription>
            </div>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Announcement
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Announcement</DialogTitle>
                  <DialogDescription>Post a new announcement for students</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      placeholder="Announcement title"
                      value={newAnnouncement.title}
                      onChange={(e) =>
                        setNewAnnouncement({ ...newAnnouncement, title: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Announcement message"
                      value={newAnnouncement.message}
                      onChange={(e) =>
                        setNewAnnouncement({ ...newAnnouncement, message: e.target.value })
                      }
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Select
                        value={newAnnouncement.priority}
                        onValueChange={(value) =>
                          setNewAnnouncement({ ...newAnnouncement, priority: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={newAnnouncement.category}
                        onValueChange={(value) =>
                          setNewAnnouncement({ ...newAnnouncement, category: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                          <SelectItem value="food">Food</SelectItem>
                          <SelectItem value="facilities">Facilities</SelectItem>
                          <SelectItem value="inspection">Inspection</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button onClick={handleCreateAnnouncement} className="flex-1">
                      Publish
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateOpen(false)}
                      className="flex-1 bg-transparent"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Edit Announcement Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Announcement</DialogTitle>
            <DialogDescription>Update your announcement</DialogDescription>
          </DialogHeader>
          {editingAnnouncement && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  placeholder="Announcement title"
                  value={editingAnnouncement.title}
                  onChange={(e) =>
                    setEditingAnnouncement({ ...editingAnnouncement, title: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-message">Message</Label>
                <Textarea
                  id="edit-message"
                  placeholder="Announcement message"
                  value={editingAnnouncement.message}
                  onChange={(e) =>
                    setEditingAnnouncement({ ...editingAnnouncement, message: e.target.value })
                  }
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-priority">Priority</Label>
                  <Select
                    value={editingAnnouncement.priority}
                    onValueChange={(value) =>
                      setEditingAnnouncement({ ...editingAnnouncement, priority: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-category">Category</Label>
                  <Select
                    value={editingAnnouncement.category}
                    onValueChange={(value) =>
                      setEditingAnnouncement({ ...editingAnnouncement, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="food">Food</SelectItem>
                      <SelectItem value="facilities">Facilities</SelectItem>
                      <SelectItem value="inspection">Inspection</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button onClick={handleSaveEdit} className="flex-1">
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsEditOpen(false)}
                  className="flex-1 bg-transparent"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Announcements List */}
      <Card>
        <CardHeader>
          <CardTitle>My Announcements</CardTitle>
          <CardDescription>Manage your published announcements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <div key={announcement.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-lg mb-2">{announcement.title}</h4>
                    <p className="text-sm text-muted-foreground mb-3">{announcement.message}</p>
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(announcement.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2 ml-4">
                    <Badge className={getPriorityColor(announcement.priority)}>
                      {announcement.priority}
                    </Badge>
                    <Badge className={getCategoryColor(announcement.category)} variant="outline">
                      {announcement.category}
                    </Badge>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" onClick={() => handleEditAnnouncement(announcement)}>
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDeleteAnnouncement(announcement.id)}>
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
