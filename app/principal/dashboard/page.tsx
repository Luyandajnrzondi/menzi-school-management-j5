"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, LineChart, PieChart } from "lucide-react"

export default function PrincipalDashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

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
    setIsLoading(false)
  }, [router])

  if (isLoading) {
    return <div>Loading...</div>
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
              <p className="text-3xl font-bold">450</p>
              <p className="text-sm text-gray-500">Across all grades</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Teachers</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">35</p>
              <p className="text-sm text-gray-500">Across all departments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Average Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">72%</p>
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performance Trend</CardTitle>
              <CardDescription>School performance over the last 4 terms</CardDescription>
            </CardHeader>
            <CardContent className="h-80 flex items-center justify-center">
              <LineChart className="h-64 w-64 text-gray-300" />
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
                          <p className="text-2xl font-bold">65%</p>
                        </div>
                        <div className="bg-gray-100 p-4 rounded-lg">
                          <p className="text-sm text-gray-500">Diploma Passes</p>
                          <p className="text-2xl font-bold">25%</p>
                        </div>
                        <div className="bg-gray-100 p-4 rounded-lg">
                          <p className="text-sm text-gray-500">Higher Certificate</p>
                          <p className="text-2xl font-bold">8%</p>
                        </div>
                        <div className="bg-gray-100 p-4 rounded-lg">
                          <p className="text-sm text-gray-500">Failed</p>
                          <p className="text-2xl font-bold">2%</p>
                        </div>
                      </div>

                      <div className="bg-gray-100 p-4 rounded-lg">
                        <p className="text-sm text-gray-500">Distinctions</p>
                        <p className="text-2xl font-bold">120</p>
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
