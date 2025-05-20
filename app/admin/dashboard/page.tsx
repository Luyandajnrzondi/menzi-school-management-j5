"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Users,
  UserPlus,
  GraduationCap,
  ClipboardList,
  BookOpen,
  Calendar,
  Bell,
  FileText,
  Settings,
  Plus,
  Clock,
  ArrowRight,
  Loader2,
} from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"

export default function AdminDashboardPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    pendingApplications: 0,
    unreadNotifications: 0,
  })
  const [recentApplications, setRecentApplications] = useState<any[]>([])

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem("user")

    if (!storedUser) {
      router.push("/login")
      return
    }

    const parsedUser = JSON.parse(storedUser)

    // Check if user is admin
    if (parsedUser.role !== "admin") {
      router.push("/dashboard")
      return
    }

    setUser(parsedUser)
    fetchDashboardData()
  }, [router])

  const fetchDashboardData = async () => {
    try {
      // Fetch total students
      const { count: studentsCount, error: studentsError } = await supabase
        .from("students")
        .select("*", { count: "exact", head: true })

      if (studentsError) throw studentsError

      // Fetch total teachers
      const { count: teachersCount, error: teachersError } = await supabase
        .from("teachers")
        .select("*", { count: "exact", head: true })

      if (teachersError) throw teachersError

      // Fetch total classes
      const { count: classesCount, error: classesError } = await supabase
        .from("classes")
        .select("*", { count: "exact", head: true })
        .eq("academic_year", new Date().getFullYear())

      if (classesError) throw classesError

      // Fetch pending applications
      const { count: pendingApplicationsCount, error: applicationsError } = await supabase
        .from("applications")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending")

      if (applicationsError) throw applicationsError

      // Fetch unread notifications
      const { count: unreadNotificationsCount, error: notificationsError } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .or(`user_id.is.null,user_id.eq.${user?.id}`)
        .eq("is_read", false)

      if (notificationsError) throw notificationsError

      // Fetch recent applications
      const { data: recentApplicationsData, error: recentApplicationsError } = await supabase
        .from("applications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5)

      if (recentApplicationsError) throw recentApplicationsError

      setStats({
        totalStudents: studentsCount || 0,
        totalTeachers: teachersCount || 0,
        totalClasses: classesCount || 0,
        pendingApplications: pendingApplicationsCount || 0,
        unreadNotifications: unreadNotificationsCount || 0,
      })

      setRecentApplications(recentApplicationsData || [])
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Admin quick actions
  const quickActions = [
    {
      title: "Manage Applications",
      description: "Review and process new student applications",
      icon: ClipboardList,
      href: "/admin/applications",
      color: "bg-blue-100 text-blue-700",
    },
    {
      title: "Add Teacher",
      description: "Register a new teacher in the system",
      icon: UserPlus,
      href: "/admin/teachers/add",
      color: "bg-green-100 text-green-700",
    },
    {
      title: "Create Timetable",
      description: "Create and manage class timetables",
      icon: Clock,
      href: "/admin/timetables/create",
      color: "bg-purple-100 text-purple-700",
    },
    {
      title: "Add Class",
      description: "Create a new class in the system",
      icon: Plus,
      href: "/admin/classes/add",
      color: "bg-amber-100 text-amber-700",
    },
  ]

  // Admin management modules
  const managementModules = [
    {
      title: "Students",
      description: "Manage student information and enrollment",
      icon: GraduationCap,
      href: "/admin/students",
    },
    {
      title: "Teachers",
      description: "Manage teacher profiles and assignments",
      icon: Users,
      href: "/admin/teachers",
    },
    {
      title: "Classes",
      description: "Manage class structures and assignments",
      icon: Users,
      href: "/admin/classes",
    },
    {
      title: "Subjects",
      description: "Manage subject offerings and curriculum",
      icon: BookOpen,
      href: "/admin/subjects",
    },
    {
      title: "Timetables",
      description: "Create and manage class schedules",
      icon: Calendar,
      href: "/admin/timetables",
    },
    {
      title: "Applications",
      description: "Process new student applications",
      icon: ClipboardList,
      href: "/admin/applications",
    },
    {
      title: "Results",
      description: "Manage and publish student results",
      icon: FileText,
      href: "/admin/results",
    },
    {
      title: "Notifications",
      description: "View system notifications",
      icon: Bell,
      href: "/admin/notifications",
    },
    {
      title: "Settings",
      description: "Configure system settings",
      icon: Settings,
      href: "/admin/settings",
    },
  ]

  if (isLoading) {
    return (
      <DashboardLayout user={user}>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout user={user}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Students</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.totalStudents}</p>
              <p className="text-sm text-gray-500">Across all grades</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Teachers</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.totalTeachers}</p>
              <p className="text-sm text-gray-500">Active teaching staff</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Classes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.totalClasses}</p>
              <p className="text-sm text-gray-500">Across all grades</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Pending Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.pendingApplications}</p>
              <p className="text-sm text-gray-500">Awaiting review</p>
            </CardContent>
          </Card>
        </div>

        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickActions.map((action, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className={`w-12 h-12 rounded-full ${action.color} flex items-center justify-center mb-4`}>
                  <action.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold mb-2">{action.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{action.description}</p>
                <Button asChild className="w-full">
                  <Link href={action.href}>{action.title}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Recent Applications</CardTitle>
              <CardDescription>Latest student applications</CardDescription>
            </CardHeader>
            <CardContent>
              {recentApplications.length > 0 ? (
                <div className="space-y-4">
                  {recentApplications.map((application) => (
                    <div key={application.id} className="flex items-center justify-between border-b pb-4">
                      <div>
                        <p className="font-medium">
                          {application.first_name} {application.last_name}
                        </p>
                        <p className="text-sm text-gray-500">{application.email}</p>
                        <div className="flex items-center mt-1">
                          <span
                            className={`inline-block h-2 w-2 rounded-full mr-2 ${
                              application.status === "pending"
                                ? "bg-yellow-500"
                                : application.status === "approved"
                                  ? "bg-green-500"
                                  : "bg-red-500"
                            }`}
                          ></span>
                          <span className="text-xs capitalize">{application.status}</span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/applications/${application.id}`}>
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-4 text-gray-500">No recent applications</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Recent system notifications</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.unreadNotifications > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="bg-primary/10 p-2 rounded-full mr-4">
                        <Bell className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">You have {stats.unreadNotifications} unread notifications</p>
                        <p className="text-sm text-gray-500">Click to view all notifications</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/admin/notifications">
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-center py-4 text-gray-500">No unread notifications</p>
              )}
            </CardContent>
          </Card>
        </div>

        <h2 className="text-xl font-semibold mb-4">Management Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {managementModules.map((module, index) => (
            <Link key={index} href={module.href}>
              <Card className="hover:bg-gray-50 transition-colors cursor-pointer h-full">
                <CardContent className="p-4 flex items-center space-x-4">
                  <div className="bg-gray-100 p-2 rounded-full">
                    <module.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">{module.title}</h3>
                    <p className="text-sm text-gray-600">{module.description}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
