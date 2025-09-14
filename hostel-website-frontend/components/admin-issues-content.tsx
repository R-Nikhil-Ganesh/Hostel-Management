"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { AlertCircle, Clock, CheckCircle, MessageSquare, Search, Filter, User } from "lucide-react"
import api from "@/lib/axios"

interface Complaint {
  id: number
  title: string
  description: string
  category: string
  category_display?: string
  status: "pending" | "in_progress" | "resolved" | string
  status_display?: string
  priority: string
  priority_display?: string
  created_at: string
  updated_at: string
  // we only need room number for admin view
  student_room?: string | null
  response?: string | null
  // optional student id/name if present but not shown
  student?: { id?: number; name?: string } | number
}

export function AdminComplaintsContent() {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null)
  const [isResponseDialogOpen, setIsResponseDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchComplaints()
  }, [])

  const fetchComplaints = async () => {
    setLoading(true)
    try {
      const res = await api.get<Complaint[]>("/v1/complaints/")
      setComplaints(res.data || [])
    } catch (err) {
      console.error("Failed to fetch complaints", err)
    } finally {
      setLoading(false)
    }
  }

  // Stats
  const total = complaints.length
  const pendingCount = complaints.filter((c) => c.status === "pending").length
  const inProgressCount = complaints.filter((c) => c.status === "in_progress").length
  const resolvedCount = complaints.filter((c) => c.status === "resolved").length

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "in_progress":
        return "bg-blue-100 text-blue-800"
      case "resolved":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />
      case "in_progress":
        return <AlertCircle className="h-4 w-4" />
      case "resolved":
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-orange-100 text-orange-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // search + filters (search title, description, room)
  const filteredComplaints = complaints
    .filter((c) => {
      const q = searchTerm.trim().toLowerCase()
      if (!q) return true
      const inTitle = c.title?.toLowerCase().includes(q)
      const inDesc = c.description?.toLowerCase().includes(q)
      const inRoom = !!c.student_room && c.student_room.toLowerCase().includes(q)
      return !!(inTitle || inDesc || inRoom)
    })
    .filter((c) => (statusFilter === "all" ? true : c.status === statusFilter))
    .filter((c) => (priorityFilter === "all" ? true : c.priority === priorityFilter))

  // Optimistic status update: set UI immediately, then call API, revert on error
  const handleStatusUpdate = async (id: number, newStatus: "in_progress" | "resolved" | "pending") => {
    const prev = [...complaints]
    setComplaints((s) => s.map((c) => (c.id === id ? { ...c, status: newStatus, status_display: humanizeStatus(newStatus) } : c)))

    try {
      await api.patch(`/v1/complaints/${id}/`, { status: newStatus })
      // refresh from server to get canonical data
      await fetchComplaints()
    } catch (err) {
      console.error("Failed to update status", err)
      alert("Failed to update status. Reverting.")
      setComplaints(prev)
    }
  }

  const humanizeStatus = (s: string) => {
    if (s === "in_progress") return "In Progress"
    if (s === "pending") return "Pending"
    if (s === "resolved") return "Resolved"
    return s
  }

  // Response submit (keeps same flow you had)
  const handleResponseSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedComplaint) return
    const formData = new FormData(e.currentTarget)
    const response = formData.get("response") as string

    try {
      // optionally mark in-progress when responding; change if you prefer "pending"
      await api.patch(`/v1/complaints/${selectedComplaint.id}/`, { response, status: "in_progress" })
      setIsResponseDialogOpen(false)
      setSelectedComplaint(null)
      await fetchComplaints()
    } catch (err) {
      console.error("Failed to submit response", err)
      alert("Failed to submit response.")
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Complaints</h1>
        <p className="text-gray-600">Manage and respond to student complaints</p>
      </div>

      {/* Top stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Complaints</p>
                <p className="text-2xl font-bold">{total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold">{inProgressCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Resolved</p>
                <p className="text-2xl font-bold">{resolvedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by title, room, or description..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-gray-400" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Complaints List */}
      <div className="space-y-4">
        {filteredComplaints.map((c) => (
          <Card key={c.id}>
            <CardHeader className="flex justify-between items-start sm:items-center flex-col sm:flex-row gap-2">
              <div>
                <CardTitle>{c.title}</CardTitle>
                <CardDescription>
                  ID: {c.id} • Submitted: {new Date(c.created_at).toLocaleDateString()} • Last Updated:{" "}
                  {new Date(c.updated_at).toLocaleDateString()}
                </CardDescription>
              </div>

              <div className="flex gap-2 items-center">
                <Badge className={getPriorityColor(c.priority)}>{(c.priority || "").toUpperCase()}</Badge>
                <Badge className={getStatusColor(c.status)}>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(c.status)}
                    {c.status_display ?? humanizeStatus(c.status)}
                  </div>
                </Badge>

                {/* Header quick-actions: mark in-progress / resolved */}
                {c.status === "pending" && (
                  <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(c.id, "in_progress")}>
                    Mark In Progress
                  </Button>
                )}
                {c.status === "in_progress" && (
                  <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(c.id, "resolved")}>
                    Mark Resolved
                  </Button>
                )}
                {c.status === "resolved" && (
                  <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(c.id, "in_progress")}>
                    Reopen
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-2">
              <p>{c.description}</p>

              {/* only show room number here (student_room), not name/email */}
              <div className="bg-gray-50 p-3 rounded-lg text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-600" />
                  <span className="font-medium text-gray-900">Room Number</span>
                </div>
                <p className="mt-1 text-gray-700">{c.student_room ?? "N/A"}</p>
              </div>

              {c.response && (
                <div className="bg-blue-50 p-3 rounded-lg text-sm">
                  <span className="font-medium text-blue-900">Response:</span>
                  <p className="text-blue-800 mt-1">{c.response}</p>
                </div>
              )}

              {/* response dialog */}
              <div className="flex gap-2 pt-2">
                <Dialog
                  open={isResponseDialogOpen && selectedComplaint?.id === c.id}
                  onOpenChange={(open) => {
                    setIsResponseDialogOpen(open)
                    if (!open) setSelectedComplaint(null)
                  }}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => setSelectedComplaint(c)}>
                      <MessageSquare className="h-4 w-4 mr-1" /> {c.response ? "Update Response" : "Add Response"}
                    </Button>
                  </DialogTrigger>

                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Respond to Complaint</DialogTitle>
                      <DialogDescription>Send a response for room {c.student_room ?? "N/A"}</DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleResponseSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="response">Response</Label>
                        <Textarea
                          id="response"
                          name="response"
                          placeholder="Enter your response..."
                          defaultValue={c.response || ""}
                          required
                          rows={4}
                        />
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsResponseDialogOpen(false)
                            setSelectedComplaint(null)
                          }}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                          Submit Response
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredComplaints.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Complaints Found</h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== "all" || priorityFilter !== "all"
                  ? "No complaints match your filters."
                  : "No complaints reported yet."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
