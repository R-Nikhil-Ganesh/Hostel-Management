"use client"

import React, { useState, useEffect } from "react"
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
  category_display: string
  status: string
  status_display: string
  priority: string
  priority_display: string
  created_at: string
  updated_at: string
  student?: { id: number; name?: string } | number
  student_email?: string | null
  student_room?: string | null
  response?: string | null
}

export function WardenIssuesContent() {
  const [issues, setIssues] = useState<Complaint[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [selectedIssue, setSelectedIssue] = useState<number | null>(null)
  const [isResponseDialogOpen, setIsResponseDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchIssues()
  }, [])

  const fetchIssues = async () => {
    setLoading(true)
    try {
      const res = await api.get("/v1/complaints/")
      setIssues(res.data || [])
    } catch (err) {
      console.error("Failed to fetch complaints:", err)
    } finally {
      setLoading(false)
    }
  }

  // Stats helpers
  const totalIssues = issues.length
  const pendingCount = issues.filter((i) => i.status === "pending").length
  const inProgressCount = issues.filter((i) => i.status === "in_progress").length
  const resolvedCount = issues.filter((i) => i.status === "resolved").length

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

  const filteredIssues = issues
    .filter((issue) => {
      const q = searchTerm.trim().toLowerCase()
      if (!q) return true
      const inTitle = issue.title?.toLowerCase().includes(q)
      const inDescription = issue.description?.toLowerCase().includes(q)
      const studentName = typeof issue.student === "object" ? issue.student?.name : undefined
      const inStudentName = !!studentName && studentName.toLowerCase().includes(q)
      const inStudentRoom = !!issue.student_room && issue.student_room.toLowerCase().includes(q)
      const inStudentEmail = !!issue.student_email && issue.student_email.toLowerCase().includes(q)
      return !!(inTitle || inDescription || inStudentName || inStudentRoom || inStudentEmail)
    })
    .filter((issue) => {
      const matchesStatus = statusFilter === "all" || issue.status === statusFilter
      const matchesPriority = priorityFilter === "all" || issue.priority === priorityFilter
      return matchesStatus && matchesPriority
    })

  // optimistic update for status
  const handleStatusUpdate = async (issueId: number, newStatus: string) => {
    const prev = [...issues]
    setIssues((s) => s.map((it) => (it.id === issueId ? { ...it, status: newStatus, status_display: humanize(newStatus) } : it)))

    try {
      await api.patch(`/v1/complaints/${issueId}/`, { status: newStatus })
      await fetchIssues()
    } catch (err) {
      console.error("Failed to update status:", err)
      alert("Failed to update status. Reverting.")
      setIssues(prev)
    }
  }

  const humanize = (status: string) => {
    switch (status) {
      case "pending":
        return "Pending"
      case "in_progress":
        return "In Progress"
      case "resolved":
        return "Resolved"
      default:
        return status
    }
  }

  const handleResponseSubmit = async (e: React.FormEvent<HTMLFormElement>, issueId: number) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const response = (formData.get("response") as string) || null
    try {
      await api.patch(`/v1/complaints/${issueId}/`, { response })
      await fetchIssues()
      setIsResponseDialogOpen(false)
      setSelectedIssue(null)
    } catch (err) {
      console.error("Failed to send response:", err)
      alert("Failed to send response.")
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Student Issues Management</h1>
        <p className="text-gray-600">Review and respond to student-reported issues</p>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Issues</p>
                <p className="text-2xl font-bold">{totalIssues}</p>
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
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by issue, student name, room, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
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
          </div>
        </CardContent>
      </Card>

      {/* Issues List */}
      <div className="space-y-4">
        {filteredIssues.map((issue) => (
          <Card key={issue.id}>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="flex-1">
                  <CardTitle className="text-lg">{issue.title}</CardTitle>
                  <CardDescription className="mt-1">
                    Issue ID: {issue.id} • Submitted on {new Date(issue.created_at).toLocaleDateString()}
                  </CardDescription>
                </div>

                {/* badges + header quick-actions */}
                <div className="flex items-center gap-2">
                  <Badge className={getPriorityColor(issue.priority)}>{issue.priority_display}</Badge>

                  <Badge className={getStatusColor(issue.status)}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(issue.status)}
                      {issue.status_display}
                    </div>
                  </Badge>

                  {issue.status === "pending" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusUpdate(issue.id, "in_progress")}
                      className="ml-2"
                    >
                      Mark In Progress
                    </Button>
                  )}
                  {issue.status === "in_progress" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusUpdate(issue.id, "resolved")}
                      className="ml-2"
                    >
                      Mark Resolved
                    </Button>
                  )}
                  {issue.status === "resolved" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusUpdate(issue.id, "in_progress")}
                      className="ml-2"
                    >
                      Reopen
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-700">{issue.description}</p>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-600" />
                    <span className="font-medium text-gray-900">Room Number</span>
                  </div>
                  <p className="text-gray-700 mt-1">{issue.student_room ?? "N/A"}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Category:</span>
                    <span className="ml-2 capitalize">{issue.category_display}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Last Updated:</span>
                    <span className="ml-2">{new Date(issue.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {issue.response && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="font-medium text-blue-900 text-sm">Current Response:</p>
                    <p className="text-blue-800 text-sm mt-1">{issue.response}</p>
                  </div>
                )}

                {/* Only response dialog in body (no duplicate status buttons) */}
                <div className="flex flex-wrap gap-2 pt-2">
                  <Dialog
                    open={isResponseDialogOpen && selectedIssue === issue.id}
                    onOpenChange={(open) => {
                      setIsResponseDialogOpen(open)
                      if (!open) setSelectedIssue(null)
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedIssue(issue.id)}
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        {issue.response ? "Update Response" : "Add Response"}
                      </Button>
                    </DialogTrigger>

                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Respond to Issue</DialogTitle>
                        <DialogDescription>
                          Provide a response to {issue.student_email ?? `student #${(issue.student as any) ?? "?"}`}.
                        </DialogDescription>
                      </DialogHeader>

                      <form onSubmit={(e) => handleResponseSubmit(e, issue.id)} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="response">Response Message</Label>
                          <Textarea
                            id="response"
                            name="response"
                            placeholder="Enter your response..."
                            rows={4}
                            defaultValue={issue.response || ""}
                            required
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setIsResponseDialogOpen(false)
                              setSelectedIssue(null)
                            }}
                          >
                            Cancel
                          </Button>
                          <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                            Send Response
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredIssues.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Issues Found</h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== "all" || priorityFilter !== "all"
                  ? "No issues match your current filters."
                  : "No student issues have been reported yet."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
