"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, XCircle, Clock, Search, Filter } from "lucide-react";

interface OutpassRequest {
  id: number;
  student_email: string;
  student_id: string;
  room: string;
  reason: string;
  from_date: string;
  to_date: string;
  applied_at: string;
  status: string;
  description: string;
}

export function WardenOutpassManagement() {
  const [outpassRequests, setOutpassRequests] = useState<OutpassRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("access");

  // Fetch outpasses from backend
  const fetchOutpasses = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:8000/api/v1/outpasses/", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const normalized = res.data.map((o: any) => ({
        id: o.id,
        student_email: o.student_email ?? o.student?.user?.email ?? "Unknown",
        student_id: o.student?.id ?? o.student_id ?? "—",
        room: o.room ?? o.room_number ?? o.room_no ?? "—",
        reason: o.reason ?? "",
        from_date: o.from_date ?? "",
        to_date: o.to_date ?? "",
        applied_at: o.applied_at ?? "",
        status: o.status ?? "pending",
        description: o.description ?? "",
      }));

      setOutpassRequests(normalized);
    } catch (err) {
      console.error("Failed to fetch outpasses", err);
      setOutpassRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOutpasses();
  }, []);

  // Approve / Reject handlers
  const handleApprove = async (id: number) => {
    if (!token) return;
    try {
      await axios.post(
        `http://localhost:8000/api/v1/outpasses/${id}/approve/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchOutpasses();
    } catch (err) {
      console.error("Approval failed", err);
    }
  };

  const handleReject = async (id: number) => {
    if (!token) return;
    try {
      await axios.post(
        `http://localhost:8000/api/v1/outpasses/${id}/reject/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchOutpasses();
    } catch (err) {
      console.error("Rejection failed", err);
    }
  };

  // Filtering
  const filteredRequests = outpassRequests.filter((request) => {
    const matchesSearch =
      request.student_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.room.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.reason.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || request.status.toLowerCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Helpers for badge colors/icons
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return <CheckCircle className="h-4 w-4" />;
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "rejected":
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Outpass Requests</CardTitle>
          <CardDescription>Search and filter student outpass requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email, room, or reason..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Outpass Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Outpass Requests ({filteredRequests.length})</CardTitle>
          <CardDescription>Review and manage student outpass requests</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <div key={request.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-lg">{request.student_email}</h4>
                    </div>
                    <Badge className={getStatusColor(request.status)}>
                      {getStatusIcon(request.status)}
                      <span className="ml-1 capitalize">{request.status}</span>
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-sm font-medium">Reason</p>
                      <p className="text-sm text-muted-foreground">{request.reason}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Duration</p>
                      <p className="text-sm text-muted-foreground">
                        {request.from_date} to {request.to_date}
                      </p>
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-sm font-medium">Description</p>
                    <p className="text-sm text-muted-foreground">{request.description}</p>
                  </div>

                  {request.status.toLowerCase() === "pending" && (
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleApprove(request.id)}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(request.id)}
                      >
                        <XCircle className="h-3 w-3 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              ))}

              {filteredRequests.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No outpass requests found matching your criteria.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
