"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { CreditCard, CheckCircle, Clock, AlertCircle, Receipt } from "lucide-react"

interface FeeRecord {
  id: string
  type: string
  amount: number
  dueDate: string
  status: "paid" | "pending" | "overdue"
  paidDate?: string
  transactionId?: string
}

export function StudentFeesContent() {
  const [paymentDialog, setPaymentDialog] = useState(false)
  const [selectedFee, setSelectedFee] = useState<FeeRecord | null>(null)
  const [paymentMethod, setPaymentMethod] = useState("")

  const [feeRecords, setFeeRecords] = useState<FeeRecord[]>([
    {
      id: "1",
      type: "Hostel Fee - Semester 1",
      amount: 25000,
      dueDate: "2024-01-15",
      status: "paid",
      paidDate: "2024-01-10",
      transactionId: "TXN123456789",
    },
    {
      id: "2",
      type: "Mess Fee - January",
      amount: 4500,
      dueDate: "2024-01-31",
      status: "paid",
      paidDate: "2024-01-28",
      transactionId: "TXN987654321",
    },
    {
      id: "3",
      type: "Hostel Fee - Semester 2",
      amount: 25000,
      dueDate: "2024-07-15",
      status: "pending",
    },
    {
      id: "4",
      type: "Mess Fee - February",
      amount: 4500,
      dueDate: "2024-02-29",
      status: "overdue",
    },
    {
      id: "5",
      type: "Security Deposit",
      amount: 5000,
      dueDate: "2024-03-15",
      status: "pending",
    },
  ])

  const totalPending = feeRecords
    .filter((fee) => fee.status === "pending" || fee.status === "overdue")
    .reduce((sum, fee) => sum + fee.amount, 0)

  const totalPaid = feeRecords.filter((fee) => fee.status === "paid").reduce((sum, fee) => sum + fee.amount, 0)

  const overdueCount = feeRecords.filter((fee) => fee.status === "overdue").length

  const handlePayment = () => {
    if (selectedFee && paymentMethod) {
      const updatedRecords = feeRecords.map((fee) =>
        fee.id === selectedFee.id
          ? {
              ...fee,
              status: "paid" as const,
              paidDate: new Date().toISOString().split("T")[0],
              transactionId: `TXN${Date.now()}`,
            }
          : fee,
      )
      setFeeRecords(updatedRecords)
      setPaymentDialog(false)
      setSelectedFee(null)
      setPaymentMethod("")
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "overdue":
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "overdue":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      {/* Fee Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pending</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalPending.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {feeRecords.filter((f) => f.status === "pending" || f.status === "overdue").length} pending payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalPaid.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {feeRecords.filter((f) => f.status === "paid").length} completed payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdueCount}</div>
            <p className="text-xs text-muted-foreground">
              {overdueCount > 0 ? "Requires immediate attention" : "No overdue payments"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Fee Records */}
      <Card>
        <CardHeader>
          <CardTitle>Fee Records</CardTitle>
          <CardDescription>View and manage your hostel and mess fee payments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {feeRecords.map((fee) => (
              <div key={fee.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  {getStatusIcon(fee.status)}
                  <div>
                    <h4 className="font-medium">{fee.type}</h4>
                    <p className="text-sm text-muted-foreground">
                      Due: {new Date(fee.dueDate).toLocaleDateString()}
                      {fee.paidDate && (
                        <span className="ml-2">• Paid: {new Date(fee.paidDate).toLocaleDateString()}</span>
                      )}
                    </p>
                    {fee.transactionId && (
                      <p className="text-xs text-muted-foreground">Transaction ID: {fee.transactionId}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="font-semibold">₹{fee.amount.toLocaleString()}</p>
                    <Badge className={getStatusColor(fee.status)}>
                      {fee.status.charAt(0).toUpperCase() + fee.status.slice(1)}
                    </Badge>
                  </div>

                  {fee.status === "paid" ? (
                    <Button variant="outline" size="sm">
                      <Receipt className="h-4 w-4 mr-2" />
                      Receipt
                    </Button>
                  ) : (
                    <Dialog open={paymentDialog} onOpenChange={setPaymentDialog}>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          onClick={() => setSelectedFee(fee)}
                          className={fee.status === "overdue" ? "bg-red-600 hover:bg-red-700" : ""}
                        >
                          Pay Now
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Make Payment</DialogTitle>
                          <DialogDescription>Complete your fee payment securely</DialogDescription>
                        </DialogHeader>

                        {selectedFee && (
                          <div className="space-y-4">
                            <div className="p-4 bg-muted rounded-lg">
                              <h4 className="font-medium">{selectedFee.type}</h4>
                              <p className="text-2xl font-bold">₹{selectedFee.amount.toLocaleString()}</p>
                              <p className="text-sm text-muted-foreground">
                                Due: {new Date(selectedFee.dueDate).toLocaleDateString()}
                              </p>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="payment-method">Payment Method</Label>
                              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select payment method" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="upi">UPI</SelectItem>
                                  <SelectItem value="netbanking">Net Banking</SelectItem>
                                  <SelectItem value="card">Credit/Debit Card</SelectItem>
                                  <SelectItem value="wallet">Digital Wallet</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <Separator />

                            <div className="flex justify-between items-center">
                              <span className="font-medium">Total Amount:</span>
                              <span className="text-xl font-bold">₹{selectedFee.amount.toLocaleString()}</span>
                            </div>

                            <Button onClick={handlePayment} className="w-full" disabled={!paymentMethod}>
                              <CreditCard className="h-4 w-4 mr-2" />
                              Pay ₹{selectedFee.amount.toLocaleString()}
                            </Button>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
