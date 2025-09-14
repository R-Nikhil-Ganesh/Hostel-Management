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
import { Textarea } from "@/components/ui/textarea"
import { User, Lock, Bell, Shield, Save, Database, Globe } from "lucide-react"

export function AdminSettingsContent() {
  const [profile, setProfile] = useState({
    name: "Michael Johnson",
    email: "michael.johnson@university.edu",
    phone: "+1 234 567 8900",
    employeeId: "A001",
    department: "IT Administration",
    accessLevel: "Super Admin",
  })

  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false,
    allowRegistrations: true,
    requireEmailVerification: true,
    sessionTimeout: "30",
    backupFrequency: "daily",
    logRetention: "90",
  })

  const [notifications, setNotifications] = useState({
    systemAlerts: true,
    securityAlerts: true,
    backupReports: true,
    userActivity: false,
    performanceAlerts: true,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Settings</h1>
        <p className="text-gray-600">Manage system configuration and administrative preferences</p>
      </div>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-blue-600" />
            <div>
              <CardTitle>Administrator Profile</CardTitle>
              <CardDescription>Update your administrative information</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-red-100 text-red-600 text-lg font-semibold">
                {profile.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg">{profile.name}</h3>
              <p className="text-gray-600">{profile.email}</p>
              <Badge className="mt-1 bg-red-100 text-red-800">Administrator</Badge>
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
              <Label htmlFor="accessLevel">Access Level</Label>
              <Select
                value={profile.accessLevel}
                onValueChange={(value) => setProfile({ ...profile, accessLevel: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Super Admin">Super Admin</SelectItem>
                  <SelectItem value="System Admin">System Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button className="bg-blue-600 hover:bg-blue-700">
            <Save className="h-4 w-4 mr-2" />
            Save Profile Changes
          </Button>
        </CardContent>
      </Card>

      {/* System Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Database className="h-5 w-5 text-blue-600" />
            <div>
              <CardTitle>System Configuration</CardTitle>
              <CardDescription>Configure global system settings</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
              <p className="text-sm text-gray-600">Enable maintenance mode to restrict system access</p>
            </div>
            <Switch
              id="maintenance-mode"
              checked={systemSettings.maintenanceMode}
              onCheckedChange={(checked) => setSystemSettings({ ...systemSettings, maintenanceMode: checked })}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="allow-registrations">Allow New Registrations</Label>
              <p className="text-sm text-gray-600">Allow new users to register accounts</p>
            </div>
            <Switch
              id="allow-registrations"
              checked={systemSettings.allowRegistrations}
              onCheckedChange={(checked) => setSystemSettings({ ...systemSettings, allowRegistrations: checked })}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email-verification">Require Email Verification</Label>
              <p className="text-sm text-gray-600">Require users to verify their email addresses</p>
            </div>
            <Switch
              id="email-verification"
              checked={systemSettings.requireEmailVerification}
              onCheckedChange={(checked) => setSystemSettings({ ...systemSettings, requireEmailVerification: checked })}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
              <p className="text-sm text-gray-600">Automatic logout after inactivity</p>
            </div>
            <Select
              value={systemSettings.sessionTimeout}
              onValueChange={(value) => setSystemSettings({ ...systemSettings, sessionTimeout: value })}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 min</SelectItem>
                <SelectItem value="30">30 min</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="120">2 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="backup-frequency">Backup Frequency</Label>
              <p className="text-sm text-gray-600">How often to backup system data</p>
            </div>
            <Select
              value={systemSettings.backupFrequency}
              onValueChange={(value) => setSystemSettings({ ...systemSettings, backupFrequency: value })}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hourly">Hourly</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
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
              <CardTitle>Admin Notifications</CardTitle>
              <CardDescription>Configure administrative notification preferences</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="system-alerts">System Alerts</Label>
              <p className="text-sm text-gray-600">Critical system notifications and errors</p>
            </div>
            <Switch
              id="system-alerts"
              checked={notifications.systemAlerts}
              onCheckedChange={(checked) => setNotifications({ ...notifications, systemAlerts: checked })}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="security-alerts">Security Alerts</Label>
              <p className="text-sm text-gray-600">Security incidents and login anomalies</p>
            </div>
            <Switch
              id="security-alerts"
              checked={notifications.securityAlerts}
              onCheckedChange={(checked) => setNotifications({ ...notifications, securityAlerts: checked })}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="backup-reports">Backup Reports</Label>
              <p className="text-sm text-gray-600">Backup completion and failure notifications</p>
            </div>
            <Switch
              id="backup-reports"
              checked={notifications.backupReports}
              onCheckedChange={(checked) => setNotifications({ ...notifications, backupReports: checked })}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="performance-alerts">Performance Alerts</Label>
              <p className="text-sm text-gray-600">System performance and resource usage alerts</p>
            </div>
            <Switch
              id="performance-alerts"
              checked={notifications.performanceAlerts}
              onCheckedChange={(checked) => setNotifications({ ...notifications, performanceAlerts: checked })}
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
              <CardDescription>Update password and security configurations</CardDescription>
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
          <div className="space-y-2">
            <Label htmlFor="security-notes">Security Notes</Label>
            <Textarea
              id="security-notes"
              placeholder="Add any security-related notes or reminders..."
              className="min-h-[100px]"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50 bg-transparent">
              <Shield className="h-4 w-4 mr-2" />
              Update Password
            </Button>
            <Button variant="outline" className="border-red-600 text-red-600 hover:bg-red-50 bg-transparent">
              <Globe className="h-4 w-4 mr-2" />
              View Security Logs
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
