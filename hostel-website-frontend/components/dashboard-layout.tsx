"use client"
import api from "@/lib/axios";
import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Home, Building2, FileText, AlertCircle, Megaphone, Settings, LogOut, Menu, CreditCard, X, Users } from "lucide-react"

interface User {
  email: string
  role: "student" | "warden" | "admin"
}

interface DashboardLayoutProps {
  children: React.ReactNode
  title: string
  role: "student" | "warden" | "admin"
}

const navigationItems = {
  student: [
    { icon: Home, label: "Dashboard", href: "/student/dashboard" },
    { icon: Building2, label: "My Room", href: "/student/room" },
    { icon: FileText, label: "Outpass", href: "/student/outpass" },
    { icon: CreditCard, label: "Fee Payment", href: "/student/fees" },
    { icon: AlertCircle, label: "Issues", href: "/student/issues" },
    { icon: Megaphone, label: "Announcements", href: "/student/announcements" },
  ],
  warden: [
    { icon: Home, label: "Dashboard", href: "/warden/dashboard" },
    { icon: Building2, label: "Rooms", href: "/warden/rooms" },
    { icon: FileText, label: "Outpass Requests", href: "/warden/outpass" },
    { icon: AlertCircle, label: "Student Issues", href: "/warden/issues" },
    { icon: FileText, label: "Daily Attendance", href: "/warden/attendance" },
    { icon: Megaphone, label: "Announcements", href: "/warden/announcements" },
  ],
  admin: [
    { icon: Home, label: "Dashboard", href: "/admin/dashboard" },
    { icon: Building2, label: "Room Management", href: "/admin/rooms" },
    { icon: Users, label: "Student Management", href: "/admin/student-management" },
    { icon: FileText, label: "Reports", href: "/admin/reports" },
    { icon: CreditCard, label: "Fee Management", href: "/admin/fees" },
    { icon: AlertCircle, label: "System Issues", href: "/admin/issues" },
    { icon: Megaphone, label: "Announcements", href: "/admin/announcements" },
  ],
}

export function DashboardLayout({ children, title, role }: DashboardLayoutProps) {
  const [user, setUser] = useState<User | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()

 // your axios instance that attaches Authorization header

useEffect(() => {
  // client-only
  if (typeof window === "undefined") return;

  const init = async () => {
    const access = localStorage.getItem("access"); // token key you use
    const stored = localStorage.getItem("user");

    // If no access token, go to login (or root)
    if (!access) {
      router.replace("/"); // or "/login" if you have a dedicated page
      return;
    }

    // If we have a cached user, set it immediately (optimistic)
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        // ignore parse errors
      }
    }

    // Verify token and fetch canonical user (this ensures token is valid, userprofile exists)
    try {
      const res = await api.get("/v1/me/"); // endpoint you already had (MeViewSet)
      const me = res.data;
      // canonicalize and store
      localStorage.setItem("user", JSON.stringify(me));
      setUser(me);
    } catch (err) {
      // token invalid/expired - clear and redirect to login
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      localStorage.removeItem("user");
      router.replace("/"); // or "/login"
    }
  };

  init();
}, [router]);

const handleLogout = () => {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  localStorage.removeItem("user");
  router.replace("/"); // or "/login"
};

  const navItems = navigationItems[role]

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
            <h2 className="text-lg font-semibold text-sidebar-foreground">
              HMS - {role ? role.charAt(0).toUpperCase() + role.slice(1) : "User"}
            </h2>
            <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navItems?.map((item) => (
              <Button
                key={item.href}
                variant="ghost"
                className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                onClick={() => {
                  router.push(item.href)
                  setSidebarOpen(false)
                }}
              >
                <item.icon className="mr-3 h-4 w-4" />
                {item.label}
              </Button>
            ))}
          </nav>

          {/* User profile */}
          <div className="p-4 border-t border-sidebar-border">
            <div className="flex items-center space-x-3 mb-3">
              <Avatar>
                <AvatarFallback>{user?.email ? user.email.charAt(0).toUpperCase() : "U"}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">{user.email}</p>
                <p className="text-xs text-sidebar-foreground/60 capitalize">{user.role}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-sidebar-foreground hover:bg-destructive hover:text-destructive-foreground"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="bg-card border-b border-border px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
                <Menu className="h-4 w-4" />
              </Button>
              <h1 className="text-xl font-semibold text-card-foreground">{title}</h1>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
