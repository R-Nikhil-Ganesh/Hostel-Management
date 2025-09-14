"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, FileText } from "lucide-react";

interface Outpass {
  id: number;
  reason: string;
  from_date: string;
  to_date: string;
  status: string;
  description?: string;
  warden_comment?: string;
}

export function OutpassRequestForm() {
  const [reason, setReason] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [description, setDescription] = useState("");
  const [outpasses, setOutpasses] = useState<Outpass[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const token = localStorage.getItem("access"); // JWT token

  const fetchOutpasses = async () => {
    if (!token) return router.push("/");
    try {
      const response = await axios.get("http://localhost:8000/api/v1/outpasses/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOutpasses(response.data);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch outpasses. Please login again.");
      router.push("/");
    }
  };

  useEffect(() => {
    fetchOutpasses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return router.push("/");
    try {
      setLoading(true);
      const response = await axios.post(
        "http://localhost:8000/api/v1/outpasses/",
        {
          reason,
          from_date: fromDate,
          to_date: toDate,
          description,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Append the new outpass to the list
      setOutpasses((prev) => [response.data, ...prev]);
      setReason("");
      setFromDate("");
      setToDate("");
      setDescription("");
    } catch (err: any) {
      console.error("Failed to submit outpass:", err.response?.data || err.message);
      alert("Failed to submit outpass.");
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="space-y-6">
      {/* New Outpass Request */}
      <Card>
        <CardHeader>
          <CardTitle>Apply for Outpass</CardTitle>
          <CardDescription>Submit a new outpass request</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reason">Reason</Label>
                <Input
                  id="reason"
                  placeholder="e.g., Home Visit, Medical Checkup"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="from-date">From Date</Label>
                <Input
                  id="from-date"
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="to-date">To Date</Label>
              <Input
                id="to-date"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Additional details about your outpass request"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Submitting..." : "Submit Outpass Request"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Previous Outpass Requests */}
      <Card>
        <CardHeader>
          <CardTitle>My Outpass History</CardTitle>
          <CardDescription>Your previous outpass requests and their status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {outpasses.map((outpass) => (
              <div key={outpass.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    {outpass.reason}
                  </h4>
                  <Badge className={getStatusColor(outpass.status)}>{outpass.status}</Badge>
                </div>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <span className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    From: {outpass.from_date}
                  </span>
                  <span className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    To: {outpass.to_date}
                  </span>
                </div>
                {outpass.warden_comment && (
                  <p className="mt-2 text-sm">
                    <strong>Warden Comment:</strong> {outpass.warden_comment}
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
