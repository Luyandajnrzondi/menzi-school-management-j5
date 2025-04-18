"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  BookOpen,
  ClipboardList,
  FileText,
  GraduationCap,
  Home,
  LogOut,
  Settings,
  User,
  Users,
  Bell,
  BarChart,
  Menu,
  Calendar,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

interface SidebarProps {
  user: {
    name: string
    email: string
    role: string
    avatar?: string
  }
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    academics: true,
  })
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const toggleMenu = (menu: string) => {
    setOpenMenus((prev) => ({
      ...prev,
      [menu]: !prev[menu],
    }))
  }

  const isActive = (path: string) => {
    return pathname === path
  }

  const handleLogout = () => {
    // Clear user data from localStorage
    localStorage.removeItem("user")

    // Redirect to login page
    router.push("/login")
  }

  const getMenuItems = () => {
    switch (user.role) {
      case "admin":
        return [
          { href: "/admin/dashboard", icon: Home, label: "Dashboard" },
          { href: "/admin/applications", icon: ClipboardList, label: "Applications" },
          { href: "/admin/students", icon: Users, label: "Students" },
          { href: "/admin/teachers", icon: Users, label: "Teachers" },
          { href: "/admin/classes", icon: Users, label: "Classes" },
          { href: "/admin/subjects", icon: BookOpen, label: "Subjects" },
          { href: "/admin/notifications", icon: Bell, label: "Notifications" },
          { href: "/admin/settings", icon: Settings, label: "Settings" },
          {
            title: "Timetables",
            href: "/admin/timetables",
            icon: Calendar,
          },
        ]
      case "teacher":
        return [
          { href: "/teacher/dashboard", icon: Home, label: "Dashboard" },
          { href: "/teacher/my-classes", icon: Users, label: "My Classes" },
          { href: "/teacher/my-subjects", icon: BookOpen, label: "My Subjects" },
          { href: "/teacher/marks", icon: FileText, label: "Enter Marks" },
          { href: "/teacher/attendance", icon: ClipboardList, label: "Attendance" },
          { href: "/teacher/learning-materials", icon: BookOpen, label: "Learning Materials" },
          { href: "/teacher/notifications", icon: Bell, label: "Notifications" },
          { href: "/teacher/settings", icon: Settings, label: "Settings" },
          {
            title: "Timetable",
            href: "/timetables",
            icon: Calendar,
          },
        ]
      case "student":
        return [
          { href: "/dashboard", icon: Home, label: "Dashboard" },
          { href: "/my-profile", icon: User, label: "My Profile" },
          { href: "/my-class", icon: Users, label: "My Class" },
          { href: "/my-subjects", icon: BookOpen, label: "My Subjects" },
          { href: "/learning-materials", icon: BookOpen, label: "Learning Materials" },
          { href: "/results", icon: FileText, label: "Results" },
          { href: "/notifications", icon: Bell, label: "Notifications" },
          { href: "/settings", icon: Settings, label: "Settings" },
          {
            title: "Timetable",
            href: "/timetables",
            icon: Calendar,
          },
        ]
      case "principal":
        return [
          { href: "/principal/dashboard", icon: Home, label: "Dashboard" },
          { href: "/admin/applications", icon: ClipboardList, label: "Applications" },
          { href: "/principal/school-performance", icon: BarChart, label: "School Performance" },
          { href: "/principal/teacher-performance", icon: BarChart, label: "Teacher Performance" },
          { href: "/principal/top-students", icon: GraduationCap, label: "Top Students" },
          { href: "/principal/notifications", icon: Bell, label: "Notifications" },
          { href: "/principal/settings", icon: Settings, label: "Settings" },
        ]
      default:
        return []
    }
  }

  // Desktop sidebar
  const DesktopSidebar = (
    <div className="flex flex-col h-full bg-gray-100 border-r">
      <div className="p-4 border-b bg-black text-white">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-6 w-6" />
          <h2 className="text-xl font-bold">School MS</h2>
        </div>
      </div>

      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={user.avatar || "/placeholder.svg"} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium">{user.name}</span>
            <span className="text-xs text-gray-500 capitalize">{user.role}</span>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 px-3 py-2">
        <nav className="space-y-1">
          {getMenuItems().map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                isActive(item.href)
                  ? "bg-gray-200 text-gray-900"
                  : "text-gray-700 hover:bg-gray-200 hover:text-gray-900",
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </ScrollArea>

      <div className="p-4 border-t mt-auto">
        <Button variant="outline" className="w-full flex items-center gap-2" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          <span>Log out</span>
        </Button>
      </div>
    </div>
  )

  // Mobile sidebar
  const MobileSidebar = (
    <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="md:hidden fixed top-4 left-4 z-40">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-64">
        {DesktopSidebar}
      </SheetContent>
    </Sheet>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:block h-full">{DesktopSidebar}</div>

      {/* Mobile Sidebar */}
      {MobileSidebar}
    </>
  )
}
