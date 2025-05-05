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
      // Fetch total number of students - simple count query
      const { count: studentCount, error: studentError } = await supabase
        .from("students")
        .select("*", { count: "exact", head: true })

      if (studentError) throw studentError

      // Fetch total number of teachers - simple count query
      const { count: teacherCount, error: teacherError } = await supabase
        .from("teachers")
        .select("*", { count: "exact", head: true })

      if (teacherError) throw teacherError

      // Fetch marks for average calculation - simple select query
      const { data: marksData, error: marksError } = await supabase.from("marks").select("mark")

      if (marksError) throw marksError

      // Calculate average mark
      let averageMark = 0
      if (marksData && marksData.length > 0) {
        const sum = marksData.reduce((acc, curr) => acc + (curr.mark || 0), 0)
        averageMark = Math.round((sum / marksData.length) * 100) / 100
      }

      // Count marks in different ranges for academic stats
      // Bachelor passes (80% and above)
      const { data: bachelorData } = await supabase.from("marks").select("id").gte("mark", 80)

      // Diploma passes (70-79%)
      const { data: diplomaData } = await supabase.from("marks").select("id").gte("mark", 70).lt("mark", 80)

      // Higher certificate (50-69%)
      const { data: certificateData } = await supabase.from("marks").select("id").gte("mark", 50).lt("mark", 70)

      // Failed (below 50%)
      const { data: failData } = await supabase.from("marks").select("id").lt("mark", 50)

      // Distinctions (75% and above)
      const { data: distinctionData } = await supabase.from("marks").select("id").gte("mark", 75)

      setDashboardData({
        totalStudents: studentCount || 0,
        totalTeachers: teacherCount || 0,
        averagePerformance: averageMark || 0,
        academicStats: {
          bachelorPasses: bachelorData?.length || 0,
          diplomaPasses: diplomaData?.length || 0,
          higherCertificate: certificateData?.length || 0,
          failed: failData?.length || 0,
          distinctions: distinctionData?.length || 0,
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
