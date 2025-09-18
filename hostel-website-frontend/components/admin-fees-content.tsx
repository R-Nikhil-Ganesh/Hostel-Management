"use client"

import { useEffect, useState } from "react"
import api from "@/lib/axios"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreditCard, Users, TrendingUp, AlertTriangle, Plus, Download } from "lucide-react"

type StudentAccount = {
  id: number | string
  email: string
  total_paid: number
  total_due: number
  overdue_count: number
  last_payment: string | null
  current_room: string | null
}

type FeeStructure = {
  id: number | string
  name: string
  fee_type: string
  amount: number
  frequency: string
  due_description?: string
  is_active: boolean
}

export function AdminFeesContent() {
  const [isAddFeeOpen, setIsAddFeeOpen] = useState(false)
  const [isEditAccountOpen, setIsEditAccountOpen] = useState(false)

  const [accounts, setAccounts] = useState<StudentAccount[]>([])
  const [structures, setStructures] = useState<FeeStructure[]>([])
  const [summary, setSummary] = useState({
    total_revenue: 0,
    total_pending: 0,
    total_overdue: 0,
    total_students: 0,
  })

  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")

  // form for creating fee structure
  const [newStructure, setNewStructure] = useState<Partial<FeeStructure>>({
    name: "",
    fee_type: "other",
    amount: 0,
    frequency: "monthly",
    due_description: "",
    is_active: true,
  })

  // edit account state (for payments/charges)
  const [selectedAccount, setSelectedAccount] = useState<StudentAccount | null>(null)
  const [paymentAmount, setPaymentAmount] = useState<number | "">("")
  const [paymentMethod, setPaymentMethod] = useState("UPI")
  const [chargeAmount, setChargeAmount] = useState<number | "">("")
  const [chargeDueDate, setChargeDueDate] = useState<string>("")

  // fetch initial data
  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    setLoading(true)
    try {
      const [accRes, structRes, sumRes] = await Promise.all([
        api.get("/v1/fees/accounts/"),
        api.get("/v1/fees/structures/"),
        api.get("/v1/fees/summary/"),
      ])
      setAccounts(accRes.data)
      setStructures(structRes.data)
      setSummary(sumRes.data)
    } catch (e) {
      // minimal error handling - adjust as you like
      console.error("Failed to load fees data", e)
    } finally {
      setLoading(false)
    }
  }

  const totalRevenue = summary.total_revenue
  const totalPending = summary.total_pending
  const totalOverdue = summary.total_overdue

  const filteredStudents = accounts.filter((s) => {
    const matchesSearch =
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.current_room || "").toLowerCase().includes(searchTerm.toLowerCase())

    if (filterStatus === "all") return matchesSearch
    if (filterStatus === "pending") return matchesSearch && s.total_due > 0
    if (filterStatus === "overdue") return matchesSearch && s.overdue_count > 0
    if (filterStatus === "paid") return matchesSearch && s.total_due === 0

    return matchesSearch
  })

  // add fee structure
  const handleAddFeeStructure = async () => {
    try {
      const payload = {
        name: newStructure.name,
        fee_type: newStructure.fee_type,
        amount: Number(newStructure.amount || 0),
        frequency: newStructure.frequency,
        due_description: newStructure.due_description || "",
        is_active: newStructure.is_active ?? true,
      }
      const res = await api.post("/v1/fees/structures/", payload)
      setStructures((prev) => [res.data, ...prev])
      setNewStructure({
        name: "",
        fee_type: "other",
        amount: 0,
        frequency: "monthly",
        due_description: "",
        is_active: true,
      })
      setIsAddFeeOpen(false)
    } catch (err) {
      console.error("Failed to add fee structure", err)
    }
  }

  // open account edit modal
  const openAccountEditor = (acc: StudentAccount) => {
    setSelectedAccount(acc)
    setPaymentAmount("")
    setChargeAmount("")
    setChargeDueDate("")
    setPaymentMethod("UPI")
    setIsEditAccountOpen(true)
  }

  // create a payment (will create account if backend supports email-based create)
  const handleCreatePayment = async () => {
    if (!selectedAccount || !paymentAmount) return
    try {
      await api.post("/v1/fees/payments/", {
        account: selectedAccount.id,
        amount: Number(paymentAmount),
        method: paymentMethod,
      })
      // refresh data
      await fetchAll()
      setIsEditAccountOpen(false)
    } catch (err) {
      console.error("Failed to create payment", err)
    }
  }

  // create a manual charge
  const handleCreateCharge = async () => {
    if (!selectedAccount || !chargeAmount || !chargeDueDate) return
    try {
      await api.post("/v1/fees/charges/", {
        account: selectedAccount.id,
        amount: Number(chargeAmount),
        due_date: chargeDueDate,
      })
      await fetchAll()
      setIsEditAccountOpen(false)
    } catch (err) {
      console.error("Failed to create charge", err)
    }
  }

  // export currently displayed data client-side (keeps same UX as before)
  const exportData = () => {
    const data = {
      summary: { totalRevenue, totalPending, totalOverdue, totalStudents: accounts.length },
      students: filteredStudents,
      feeStructures: structures,
      exportDate: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `fee-management-report-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{Number(totalRevenue).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Collected this academic year</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{Number(totalPending).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Outstanding payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accounts.length}</div>
            <p className="text-xs text-muted-foreground">Active fee accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Overdue Accounts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{Number(totalOverdue)}</div>
            <p className="text-xs text-muted-foreground">Require follow-up</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="students" className="space-y-4">
        <TabsList>
          <TabsTrigger value="students">Student Fees</TabsTrigger>
          <TabsTrigger value="structure">Fee Structure</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center w-full">
                <div>
                  <CardTitle>Student Fee Management</CardTitle>
                  <CardDescription>Monitor and manage individual student fee payments</CardDescription>
                </div>

                <div className="flex items-center gap-3">
                  <Input
                    placeholder="Search by email or room..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Students</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="paid">Up to Date</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button onClick={exportData}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                {filteredStudents.map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h4 className="font-medium">{student.email}</h4>
                        <p className="text-sm text-muted-foreground">{student.current_room || "No room assigned"}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Total Paid</p>
                        <p className="font-semibold text-green-600">₹{student.total_paid.toLocaleString()}</p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Amount Due</p>
                        <p className={`font-semibold ${student.total_due > 0 ? "text-red-600" : "text-green-600"}`}>
                          ₹{student.total_due.toLocaleString()}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Status</p>
                        <Badge
                          className={
                            student.overdue_count > 0
                              ? "bg-red-100 text-red-800"
                              : student.total_due > 0
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                          }
                        >
                          {student.overdue_count > 0 ? "Overdue" : student.total_due > 0 ? "Pending" : "Up to Date"}
                        </Badge>
                      </div>

                      <Button variant="outline" size="sm" onClick={() => openAccountEditor(student)}>
                        View / Actions
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {filteredStudents.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">No students found.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="structure" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center w-full">
                <div>
                  <CardTitle>Fee Structure Management</CardTitle>
                  <CardDescription>Configure and manage different types of fees</CardDescription>
                </div>

                <Dialog open={isAddFeeOpen} onOpenChange={setIsAddFeeOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Fee Type
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Fee Type</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 mt-2">
                      <div>
                        <Label>Label</Label>
                        <Input value={newStructure.name} onChange={(e) => setNewStructure((s) => ({ ...s, name: e.target.value }))} />
                      </div>

                      <div>
                        <Label>Amount (₹)</Label>
                        <Input
                          type="number"
                          value={newStructure.amount ?? 0}
                          onChange={(e) => setNewStructure((s) => ({ ...s, amount: Number(e.target.value) }))}
                        />
                      </div>

                      <div>
                        <Label>Frequency</Label>
                        <Select value={newStructure.frequency} onValueChange={(v) => setNewStructure((s) => ({ ...s, frequency: v }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="semester">Semester</SelectItem>
                            <SelectItem value="annual">Annual</SelectItem>
                            <SelectItem value="one-time">One-time</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Applicable / Note</Label>
                        <Input
                          value={newStructure.due_description ?? ""}
                          onChange={(e) => setNewStructure((s) => ({ ...s, due_description: e.target.value }))}
                        />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddFeeOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddFeeStructure}>Add</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                {structures.map((fee) => (
                  <div key={fee.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{fee.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        ₹{fee.amount.toLocaleString()} • {fee.frequency}
                      </p>
                      <p className="text-xs text-muted-foreground">{fee.due_description}</p>
                    </div>

                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={async () => {
                        try {
                          await api.patch(`/v1/fees/structures/${fee.id}/`, { is_active: !fee.is_active })
                          // update UI
                          setStructures((prev) => prev.map((p) => (p.id === fee.id ? { ...p, is_active: !p.is_active } : p)))
                        } catch (err) {
                          console.error("Failed to toggle active", err)
                        }
                      }}>{fee.is_active ? "Active" : "Inactive"}</Button>

                      <Button variant="outline" size="sm" onClick={async () => {
                        try {
                          await api.delete(`/v1/fees/structures/${fee.id}/`)
                          setStructures((prev) => prev.filter((p) => p.id !== fee.id))
                        } catch (err) {
                          console.error("Failed to delete", err)
                        }
                      }}>Delete</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fee Reports & Analytics</CardTitle>
              <CardDescription>Generate comprehensive reports on fee collection and outstanding amounts</CardDescription>
            </CardHeader>

            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <Button variant="outline" className="h-20 flex-col bg-transparent" onClick={exportData}>
                  <Download className="h-6 w-6 mb-2" />
                  Export Snapshot
                </Button>

                <Button variant="outline" className="h-20 flex-col bg-transparent" onClick={async () => {
                  // refresh summary from backend
                  try {
                    const res = await api.get("/v1/fees/summary/")
                    setSummary(res.data)
                  } catch (err) {
                    console.error("Failed to refresh summary", err)
                  }
                }}>
                  <Download className="h-6 w-6 mb-2" />
                  Refresh Summary
                </Button>

                <Button variant="outline" className="h-20 flex-col bg-transparent" onClick={() => {
                  // lightweight CSV export of accounts
                  const csv = [
                    ["email", "room", "total_paid", "total_due", "overdue_count"],
                    ...accounts.map(a => [a.email, a.current_room || "", a.total_paid, a.total_due, a.overdue_count]),
                  ].map(r => r.join(",")).join("\n")
                  const blob = new Blob([csv], { type: "text/csv" })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement("a")
                  a.href = url
                  a.download = `fee-accounts-${new Date().toISOString().split("T")[0]}.csv`
                  document.body.appendChild(a)
                  a.click()
                  document.body.removeChild(a)
                  URL.revokeObjectURL(url)
                }}>
                  <Download className="h-6 w-6 mb-2" />
                  CSV Accounts
                </Button>

                <Button variant="outline" className="h-20 flex-col bg-transparent" onClick={() => {
                  // quick reconciliation hint: open developer console
                  console.log("Accounts snapshot:", accounts)
                }}>
                  <Download className="h-6 w-6 mb-2" />
                  Debug Snapshot
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Account Dialog */}
      <Dialog open={isEditAccountOpen} onOpenChange={setIsEditAccountOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Account Actions</DialogTitle>
          </DialogHeader>

          {selectedAccount && (
            <div className="space-y-4 mt-2">
              <div>
                <Label>Email</Label>
                <Input value={selectedAccount.email} readOnly />
              </div>

              <div>
                <Label>Current Room</Label>
                <Input value={selectedAccount.current_room ?? ""} readOnly />
              </div>

              <div>
                <Label>Record Payment (₹)</Label>
                <Input
                  type="number"
                  value={paymentAmount === "" ? "" : String(paymentAmount)}
                  onChange={(e) => setPaymentAmount(e.target.value === "" ? "" : Number(e.target.value))}
                />
                <div className="mt-2">
                  <Label>Method</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Bank">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="mt-2" onClick={handleCreatePayment}>Create Payment</Button>
              </div>

              <div>
                <Label>Create Charge (₹)</Label>
                <Input
                  type="number"
                  value={chargeAmount === "" ? "" : String(chargeAmount)}
                  onChange={(e) => setChargeAmount(e.target.value === "" ? "" : Number(e.target.value))}
                />
                <div className="mt-2">
                  <Label>Due Date</Label>
                  <Input type="date" value={chargeDueDate} onChange={(e) => setChargeDueDate(e.target.value)} />
                </div>
                <Button className="mt-2" onClick={handleCreateCharge}>Create Charge</Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditAccountOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
