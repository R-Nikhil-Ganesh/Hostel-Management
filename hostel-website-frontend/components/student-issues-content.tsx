"use client"

import { useState, useEffect } from "react"
import api from "@/lib/axios"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
import { AlertCircle, Clock, CheckCircle, Plus, Search, Filter } from "lucide-react"

interface Complaint {
  id: number
  title: string
  description: string
  category: string
  category_display: string
  status: string
  status_display: string
  priority: string
  priority_display: string
  created_at: string
  updated_at: string
}

export function StudentIssuesContent() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false)

  const [newComplaint, setNewComplaint] = useState({
    title: "",
    description: "",
    category: "Other",
    priority: "medium",
  })

  const CATEGORY_OPTIONS = ["Plumbing", "Electricity", "Food", "Other"]
  const PRIORITY_OPTIONS = ["low", "medium", "high"]

  useEffect(() => {
    fetchComplaints()
  }, [])

  const fetchComplaints = async () => {
    try {
      const res = await api.get("/v1/complaints/")
      setComplaints(res.data)
    } catch (err) {
      console.error("Error fetching complaints:", err)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setNewComplaint({ ...newComplaint, [e.target.name]: e.target.value })
  }

  const handleSelect = (name: string, value: string) => {
    setNewComplaint({ ...newComplaint, [name]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await api.post("/v1/complaints/", newComplaint)
      setComplaints([res.data, ...complaints])
      setIsSubmitDialogOpen(false)
      setNewComplaint({ title: "", description: "", category: "Other", priority: "medium" })
    } catch (err) {
      console.error("Error submitting complaint:", err)
    }
  }

  const filteredComplaints = complaints.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || c.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800"
      case "in_progress": return "bg-blue-100 text-blue-800"
      case "resolved": return "bg-green-100 text-green-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800"
      case "medium": return "bg-orange-100 text-orange-800"
      case "low": return "bg-green-100 text-green-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="h-4 w-4" />
      case "in_progress": return <AlertCircle className="h-4 w-4" />
      case "resolved": return <CheckCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Issues</h1>
          <p className="text-gray-600">Track and manage your reported issues</p>
        </div>
        <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Report New Issue
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Report New Issue</DialogTitle>
              <DialogDescription>Describe the issue you're experiencing and we'll help resolve it.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" value={newComplaint.title} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={newComplaint.category} onValueChange={(v) => handleSelect("category", v)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={newComplaint.priority} onValueChange={(v) => handleSelect("priority", v)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map((p) => (
                      <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" value={newComplaint.description} onChange={handleChange} rows={4} required />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsSubmitDialogOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Submit Issue</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input placeholder="Search issues..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
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
        </CardContent>
      </Card>

      {/* Issues List */}
      <div className="space-y-4">
        {filteredComplaints.map((c) => (
          <Card key={c.id}>
            <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <CardTitle className="text-lg">{c.title}</CardTitle>
                <CardDescription>
                  Complaint ID: {c.id} • Submitted on {new Date(c.created_at).toLocaleDateString()}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Badge className={getPriorityColor(c.priority)}>{c.priority_display}</Badge>
                <Badge className={getStatusColor(c.status)}>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(c.status)}
                    {c.status_display}
                  </div>
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{c.description}</p>
              <div className="text-sm mt-2">
                <span className="font-medium">Category:</span> {c.category_display}
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredComplaints.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Issues Found</h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== "all"
                  ? "No issues match your current filters."
                  : "You haven't reported any issues yet."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
