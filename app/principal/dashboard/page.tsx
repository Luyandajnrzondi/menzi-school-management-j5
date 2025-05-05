"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, LineChart, PieChart, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"

export default function PrincipalDashboardPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    averagePerformance: 0,
    gradePerformance: {},
    academicStats: {
      bachelorPasses: 0,
      diplomaPasses: 0,
      higherCertificate: 0,
      failed: 0,
      distinctions: 0,
    },
  })

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem("user")

    if (!storedUser) {
      router.push("/login")
      return
    }

    const parsedUser = JSON.parse(storedUser)

    // Check if user is principal
    if (parsedUser.role !== "principal") {
      router.push("/dashboard")
      return
    }

    setUser(parsedUser)
    fetchDashboardData()
  }, [router])

  const fetchDashboardData = async () => {
    try {
      // Fetch total number of students
      const { count: studentCount, error: studentError } = await supabase
        .from("students")
        .select("*", { count: "exact", head: true })

      if (studentError) throw studentError

      // Fetch total number of teachers
      const { count: teacherCount, error: teacherError } = await supabase
        .from("teachers")
        .select("*", { count: "exact", head: true })

      if (teacherError) throw teacherError

      // Fetch average marks for all students
      const { data: marksData, error: marksError } = await supabase.from("marks").select("mark")

      if (marksError) throw marksError

      let averageMark = 0
      if (marksData && marksData.length > 0) {
        const sum = marksData.reduce((acc, curr) => acc + (curr.mark || 0), 0)
        averageMark = Math.round((sum / marksData.length) * 100) / 100
      }

      // Calculate pass statistics (this is simplified - you would need to adapt to your specific schema)
      const { data: bachelorData, error: bachelorError } = await supabase
        .from("marks")
        .select("count", { count: "exact", head: true })
        .gt("mark", 79.9)

      if (bachelorError) throw bachelorError

      const { data: diplomaData, error: diplomaError } = await supabase
        .from("marks")
        .select("count", { count: "exact", head: true })
        .gt("mark", 69.9)
        .lt("mark", 80)

      if (diplomaError) throw diplomaError

      const { data: certificateData, error: certificateError } = await supabase
        .from("marks")
        .select("count", { count: "exact", head: true })
        .gt("mark", 49.9)
        .lt("mark", 70)

      if (certificateError) throw certificateError

      const { data: failData, error: failError } = await supabase
        .from("marks")
        .select("count", { count: "exact", head: true })
        .lt("mark", 50)

      if (failError) throw failError

      // Count distinctions (marks above 75%)
      const { count: distinctionCount, error: distinctionError } = await supabase
        .from("marks")
        .select("*", { count: "exact", head: true })
        .gt("mark", 74.9)

      if (distinctionError) throw distinctionError

      setDashboardData({
        totalStudents: studentCount || 0,
        totalTeachers: teacherCount || 0,
        averagePerformance: averageMark || 0,
        gradePerformance: {}, // This would require more complex queries
        academicStats: {
          bachelorPasses: bachelorData?.count || 0,
          diplomaPasses: diplomaData?.count || 0,
          higherCertificate: certificateData?.count || 0,
          failed: failData?.count || 0,
          distinctions: distinctionCount || 0,
        },
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
        <h1 className="text-2xl font-bold mb-6">Principal Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Students</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{dashboardData.totalStudents}</p>
              <p className="text-sm text-gray-500">Across all grades</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Teachers</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{dashboardData.totalTeachers}</p>
              <p className="text-sm text-gray-500">Across all departments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Average Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{dashboardData.averagePerformance}%</p>
              <p className="text-sm text-gray-500">School-wide average</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance by Grade</CardTitle>
              <CardDescription>Average performance across all grades</CardDescription>
            </CardHeader>
            <CardContent className="h-80 flex items-center justify-center">
              <BarChart className="h-64 w-64 text-gray-300" />
              <p className="text-sm text-gray-500 absolute">Data visualization coming soon</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performance Trend</CardTitle>
              <CardDescription>School performance over the last 4 terms</CardDescription>
            </CardHeader>
            <CardContent className="h-80 flex items-center justify-center">
              <LineChart className="h-64 w-64 text-gray-300" />
              <p className="text-sm text-gray-500 absolute">Data visualization coming soon</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Academic Statistics</CardTitle>
            <CardDescription>Detailed breakdown of academic performance</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overall">
              <TabsList className="mb-6">
                <TabsTrigger value="overall">Overall</TabsTrigger>
                <TabsTrigger value="grade8">Grade 8</TabsTrigger>
                <TabsTrigger value="grade9">Grade 9</TabsTrigger>
                <TabsTrigger value="grade10">Grade 10</TabsTrigger>
                <TabsTrigger value="grade11">Grade 11</TabsTrigger>
                <TabsTrigger value="grade12">Grade 12</TabsTrigger>
              </TabsList>

              <TabsContent value="overall">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Pass Rate Distribution</h3>
                    <div className="flex items-center justify-center h-64">
                      <PieChart className="h-48 w-48 text-gray-300" />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-4">Performance Statistics</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-100 p-4 rounded-lg">
                          <p className="text-sm text-gray-500">Bachelor Passes</p>
                          <p className="text-2xl font-bold">{dashboardData.academicStats.bachelorPasses}</p>
                        </div>
                        <div className="bg-gray-100 p-4 rounded-lg">
                          <p className="text-sm text-gray-500">Diploma Passes</p>
                          <p className="text-2xl font-bold">{dashboardData.academicStats.diplomaPasses}</p>
                        </div>
                        <div className="bg-gray-100 p-4 rounded-lg">
                          <p className="text-sm text-gray-500">Higher Certificate</p>
                          <p className="text-2xl font-bold">{dashboardData.academicStats.higherCertificate}</p>
                        </div>
                        <div className="bg-gray-100 p-4 rounded-lg">
                          <p className="text-sm text-gray-500">Failed</p>
                          <p className="text-2xl font-bold">{dashboardData.academicStats.failed}</p>
                        </div>
                      </div>

                      <div className="bg-gray-100 p-4 rounded-lg">
                        <p className="text-sm text-gray-500">Distinctions</p>
                        <p className="text-2xl font-bold">{dashboardData.academicStats.distinctions}</p>
                        <p className="text-sm text-gray-500">Across all subjects</p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Similar content for other tabs */}
              <TabsContent value="grade8">
                <div className="text-center py-12">
                  <p className="text-gray-500">Grade 8 statistics will be displayed here</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
