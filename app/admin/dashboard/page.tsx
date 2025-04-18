"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, GraduationCap, BookOpen, Bell, ClipboardList, Calendar, Loader2, PlusCircle } from "lucide-react"
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
    totalSubjects: 0,
    pendingApplications: 0,
    recentNotifications: [],
    upcomingEvents: [],
  })

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem("user")

    if (!storedUser) {
      router.push("/login")
      return
    }

    const parsedUser = JSON.parse(storedUser)

    // Check if user is admin
    if (parsedUser.role !== "admin" && parsedUser.role !== "principal") {
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

      // Fetch total subjects
      const { count: subjectsCount, error: subjectsError } = await supabase
        .from("subjects")
        .select("*", { count: "exact", head: true })

      if (subjectsError) throw subjectsError

      // Fetch pending applications
      const { count: pendingApplicationsCount, error: applicationsError } = await supabase
        .from("applications")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending")

      if (applicationsError) throw applicationsError

      // Fetch recent notifications
      const { data: notificationsData, error: notificationsError } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5)

      if (notificationsError) throw notificationsError

      setStats({
        totalStudents: studentsCount || 0,
        totalTeachers: teachersCount || 0,
        totalClasses: classesCount || 0,
        totalSubjects: subjectsCount || 0,
        pendingApplications: pendingApplicationsCount || 0,
        recentNotifications: notificationsData || [],
        upcomingEvents: [], // This would be populated from an events table if available
      })
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <div className="flex space-x-2">
            <Button asChild>
              <Link href="/admin/applications">
                <ClipboardList className="mr-2 h-4 w-4" />
                Applications
                {stats.pendingApplications > 0 && (
                  <span className="ml-2 bg-red-500 text-white rounded-full px-2 py-0.5 text-xs">
                    {stats.pendingApplications}
                  </span>
                )}
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/notifications">
                <Bell className="mr-2 h-4 w-4" />
                Notifications
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
              <p className="text-xs text-muted-foreground">Enrolled students across all grades</p>
              <Button variant="ghost" size="sm" className="mt-2 w-full" asChild>
                <Link href="/admin/students">View All Students</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTeachers}</div>
              <p className="text-xs text-muted-foreground">Active teaching staff</p>
              <Button variant="ghost" size="sm" className="mt-2 w-full" asChild>
                <Link href="/admin/teachers">View All Teachers</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalClasses}</div>
              <p className="text-xs text-muted-foreground">Active classes for current academic year</p>
              <Button variant="ghost" size="sm" className="mt-2 w-full" asChild>
                <Link href="/admin/classes">View All Classes</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Subjects</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSubjects}</div>
              <p className="text-xs text-muted-foreground">Subjects in the curriculum</p>
              <Button variant="ghost" size="sm" className="mt-2 w-full" asChild>
                <Link href="/admin/subjects">View All Subjects</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Frequently used administrative tasks</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button className="justify-start" asChild>
                <Link href="/admin/applications">
                  <ClipboardList className="mr-2 h-4 w-4" />
                  Review Applications
                </Link>
              </Button>
              <Button className="justify-start" asChild>
                <Link href="/admin/teachers/add">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add New Teacher
                </Link>
              </Button>
              <Button className="justify-start" asChild>
                <Link href="/admin/classes/add">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create New Class
                </Link>
              </Button>
              <Button className="justify-start" asChild>
                <Link href="/admin/timetables/create">
                  <Calendar className="mr-2 h-4 w-4" />
                  Create Timetable
                </Link>
              </Button>
              <Button className="justify-start" asChild>
                <Link href="/admin/subjects/add">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add New Subject
                </Link>
              </Button>
              <Button className="justify-start" asChild>
                <Link href="/admin/notifications">
                  <Bell className="mr-2 h-4 w-4" />
                  Manage Notifications
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest notifications and events</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="notifications">
                <TabsList className="mb-4">
                  <TabsTrigger value="notifications">Notifications</TabsTrigger>
                  <TabsTrigger value="events">Upcoming Events</TabsTrigger>
                </TabsList>
                <TabsContent value="notifications">
                  {stats.recentNotifications.length > 0 ? (
                    <div className="space-y-4">
                      {stats.recentNotifications.map((notification: any) => (
                        <div key={notification.id} className="flex items-start space-x-4 border-b pb-4">
                          <Bell className="h-5 w-5 text-primary mt-0.5" />
                          <div>
                            <p className="font-medium">{notification.title}</p>
                            <p className="text-sm text-gray-600">{notification.message}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(notification.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <Link href="/admin/notifications">View All Notifications</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-500">No recent notifications</p>
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="events">
                  <div className="text-center py-4">
                    <p className="text-gray-500">No upcoming events</p>
                    <Button variant="outline" size="sm" className="mt-2">
                      Add New Event
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
