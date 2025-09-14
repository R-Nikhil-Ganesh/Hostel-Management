"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, Lock, Bell, Shield, Save, Settings } from "lucide-react"

export function WardenSettingsContent() {
  const [profile, setProfile] = useState({
    name: "Dr. Sarah Wilson",
    email: "sarah.wilson@university.edu",
    phone: "+1 234 567 8900",
    employeeId: "W001",
    department: "Student Affairs",
    experience: "5 years",
  })

  const [preferences, setPreferences] = useState({
    autoApproveOutpass: false,
    requireParentConsent: true,
    maxOutpassDuration: "24",
    workingHours: "9-17",
    emergencyContact: true,
  })

  const [notifications, setNotifications] = useState({
    newOutpassRequests: true,
    emergencyAlerts: true,
    maintenanceRequests: true,
    systemUpdates: false,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Warden Settings</h1>
        <p className="text-gray-600">Manage your profile and hostel management preferences</p>
      </div>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-blue-600" />
            <div>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your professional information</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-blue-100 text-blue-600 text-lg font-semibold">
                {profile.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg">{profile.name}</h3>
              <p className="text-gray-600">{profile.email}</p>
              <Badge className="mt-1 bg-green-100 text-green-800">Warden</Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employeeId">Employee ID</Label>
              <Input
                id="employeeId"
                value={profile.employeeId}
                onChange={(e) => setProfile({ ...profile, employeeId: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={profile.department}
                onChange={(e) => setProfile({ ...profile, department: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="experience">Experience</Label>
              <Input
                id="experience"
                value={profile.experience}
                onChange={(e) => setProfile({ ...profile, experience: e.target.value })}
              />
            </div>
          </div>

          <Button className="bg-blue-600 hover:bg-blue-700">
            <Save className="h-4 w-4 mr-2" />
            Save Profile Changes
          </Button>
        </CardContent>
      </Card>

      {/* Management Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Settings className="h-5 w-5 text-blue-600" />
            <div>
              <CardTitle>Management Preferences</CardTitle>
              <CardDescription>Configure your hostel management settings</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-approve">Auto-approve Short Outpasses</Label>
              <p className="text-sm text-gray-600">Automatically approve outpasses under 4 hours</p>
            </div>
            <Switch
              id="auto-approve"
              checked={preferences.autoApproveOutpass}
              onCheckedChange={(checked) => setPreferences({ ...preferences, autoApproveOutpass: checked })}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="parent-consent">Require Parent Consent</Label>
              <p className="text-sm text-gray-600">Require parent consent for overnight outpasses</p>
            </div>
            <Switch
              id="parent-consent"
              checked={preferences.requireParentConsent}
              onCheckedChange={(checked) => setPreferences({ ...preferences, requireParentConsent: checked })}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="max-duration">Maximum Outpass Duration</Label>
              <p className="text-sm text-gray-600">Maximum hours for a single outpass</p>
            </div>
            <Select
              value={preferences.maxOutpassDuration}
              onValueChange={(value) => setPreferences({ ...preferences, maxOutpassDuration: value })}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12">12 hours</SelectItem>
                <SelectItem value="24">24 hours</SelectItem>
                <SelectItem value="48">48 hours</SelectItem>
                <SelectItem value="72">72 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="working-hours">Working Hours</Label>
              <p className="text-sm text-gray-600">Your available hours for approvals</p>
            </div>
            <Select
              value={preferences.workingHours}
              onValueChange={(value) => setPreferences({ ...preferences, workingHours: value })}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="8-16">8 AM - 4 PM</SelectItem>
                <SelectItem value="9-17">9 AM - 5 PM</SelectItem>
                <SelectItem value="10-18">10 AM - 6 PM</SelectItem>
                <SelectItem value="24/7">24/7 Available</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-blue-600" />
            <div>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure your notification preferences</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="outpass-requests">New Outpass Requests</Label>
              <p className="text-sm text-gray-600">Get notified when students submit outpass requests</p>
            </div>
            <Switch
              id="outpass-requests"
              checked={notifications.newOutpassRequests}
              onCheckedChange={(checked) => setNotifications({ ...notifications, newOutpassRequests: checked })}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="emergency-alerts">Emergency Alerts</Label>
              <p className="text-sm text-gray-600">Receive urgent notifications and emergencies</p>
            </div>
            <Switch
              id="emergency-alerts"
              checked={notifications.emergencyAlerts}
              onCheckedChange={(checked) => setNotifications({ ...notifications, emergencyAlerts: checked })}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="maintenance-requests">Maintenance Requests</Label>
              <p className="text-sm text-gray-600">Get notified about room maintenance issues</p>
            </div>
            <Switch
              id="maintenance-requests"
              checked={notifications.maintenanceRequests}
              onCheckedChange={(checked) => setNotifications({ ...notifications, maintenanceRequests: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Lock className="h-5 w-5 text-blue-600" />
            <div>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Update your password and security preferences</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input id="current-password" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input id="new-password" type="password" />
            </div>
          </div>
          <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50 bg-transparent">
            <Shield className="h-4 w-4 mr-2" />
            Update Password
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
