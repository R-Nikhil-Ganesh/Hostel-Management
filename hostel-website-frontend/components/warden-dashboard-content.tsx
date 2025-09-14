"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import api from "@/lib/axios"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Building2,
  Users,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react"

export function WardenDashboardContent() {
  const router = useRouter()
  const [outpasses, setOutpasses] = useState<any[]>([])
  const [issues, setIssues] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalRooms: 0,
    occupiedRooms: 0,
    pendingOutpasses: 0,
    activeIssues: 0,
  })

  // Fetch dashboard data
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch complaints (recent 5)
        const issuesRes = await api.get("/v1/complaints/?limit=5&ordering=-created_at")
        setIssues(issuesRes.data.results || issuesRes.data)

        // Fetch outpasses (pending only)
       const outpassRes = await api.get("/v1/outpasses/");
        const pendingOutpasses = (outpassRes.data.results || outpassRes.data).filter(
          (o: any) => o.status === "Pending"
        );
      setOutpasses(pendingOutpasses);

        // Fetch rooms + allocations for stats
        const roomsRes = await api.get("/v1/rooms/")
        const allocationsRes = await api.get("/v1/allocations/")
        setStats({
          totalRooms: roomsRes.data.length,
          occupiedRooms: allocationsRes.data.length,
          pendingOutpasses: pendingOutpasses.length,
          activeIssues: issuesRes.data.filter((c: any) => c.status !== "resolved").length,
        })
      } catch (error) {
        console.error("Error loading dashboard:", error)
      }
    }
    fetchData()
  }, [])

const handleOutpassAction = async (id: number, action: "approve" | "reject") => {
  try {
    await api.post(`/v1/outpasses/${id}/${action}/`);

    // Remove the request locally
    const updatedOutpasses = outpasses.filter((o) => o.id !== id);
    setOutpasses(updatedOutpasses);

    // Update stats based on the filtered list
    setStats((prev) => ({
      ...prev,
      pendingOutpasses: updatedOutpasses.length,
    }));
  } catch (err) {
    console.error("Error updating outpass:", err);
  }
};


  const handleIssueAction = async (id: number, action: "assign" | "resolve") => {
    try {
      await api.patch(`/v1/complaints/${id}/`, {
        status: action === "resolve" ? "resolved" : "in_progress",
      })
      setIssues((prev) =>
        prev.map((issue) =>
          issue.id === id ? { ...issue, status: action === "resolve" ? "resolved" : "in_progress" } : issue,
        ),
      )
    } catch (err) {
      console.error("Error updating issue:", err)
    }
  }
  

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

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">Warden Dashboard</h2>
        <p className="text-muted-foreground">Manage hostel operations and student requests efficiently.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 flex items-center space-x-2">
          <Building2 className="h-8 w-8 text-primary" />
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Rooms</p>
            <p className="text-2xl font-bold">{stats.totalRooms}</p>
          </div>
        </CardContent></Card>

        <Card><CardContent className="p-4 flex items-center space-x-2">
          <Users className="h-8 w-8 text-primary" />
          <div>
            <p className="text-sm font-medium text-muted-foreground">Occupied</p>
            <p className="text-2xl font-bold">{stats.occupiedRooms}</p>
          </div>
        </CardContent></Card>

        <Card><CardContent className="p-4 flex items-center space-x-2">
          <FileText className="h-8 w-8 text-primary" />
          <div>
            <p className="text-sm font-medium text-muted-foreground">Pending Outpasses</p>
            <p className="text-2xl font-bold">{stats.pendingOutpasses}</p>
          </div>
        </CardContent></Card>

        <Card><CardContent className="p-4 flex items-center space-x-2">
          <AlertCircle className="h-8 w-8 text-primary" />
          <div>
            <p className="text-sm font-medium text-muted-foreground">Active Issues</p>
            <p className="text-2xl font-bold">{stats.activeIssues}</p>
          </div>
        </CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Outpass Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Pending Outpass Requests</span>
            </CardTitle>
            <CardDescription>Review and approve student outpass requests</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {outpasses.map((outpass) => (
              <div key={outpass.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-medium">{outpass.student_email}</h4>
                    <p className="text-sm text-muted-foreground">{outpass.reason}</p>
                  </div>
                  <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  {outpass.from_date} → {outpass.to_date}
                </p>
                <div className="flex space-x-2">
                  <Button size="sm" className="flex-1" onClick={() => handleOutpassAction(outpass.id, "approve")}>
                    <CheckCircle className="h-3 w-3 mr-1" /> Approve
                  </Button>
                  <Button size="sm" variant="destructive" className="flex-1"
                    onClick={() => handleOutpassAction(outpass.id, "reject")}>
                    <XCircle className="h-3 w-3 mr-1" /> Reject
                  </Button>
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full" onClick={() => router.push("/warden/outpass")}>
              View All Outpass Requests
            </Button>
          </CardContent>
        </Card>

        {/* Student Issues */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5" />
              <span>Student Issues</span>
            </CardTitle>
            <CardDescription>Manage and resolve student reported issues</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {issues.map((issue) => (
              <div key={issue.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-medium">{issue.title}</h4>
                    <p className="text-sm text-muted-foreground">{issue.student_email}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Badge className={getPriorityColor(issue.priority)}>{issue.priority}</Badge>
                    <Badge className={getStatusColor(issue.status)}>{issue.status}</Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{issue.created_at}</p>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" className="flex-1"
                    onClick={() => handleIssueAction(issue.id, "assign")}>
                    Assign
                  </Button>
                  <Button size="sm" className="flex-1" onClick={() => handleIssueAction(issue.id, "resolve")}>
                    Resolve
                  </Button>
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full" onClick={() => router.push("/warden/issues")}>
              View All Issues
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
