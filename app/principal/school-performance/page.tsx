"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function SchoolPerformancePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [selectedTerm, setSelectedTerm] = useState("all")
  const [performanceData, setPerformanceData] = useState({
    overallAverage: 0,
    gradeAverages: [] as { grade: string; average: number }[],
    subjectAverages: [] as { subject: string; average: number }[],
    passFail: {
      passed: 0,
      failed: 0,
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
    fetchPerformanceData()
  }, [router, selectedYear, selectedTerm])

  const fetchPerformanceData = async () => {
    try {
      setIsLoading(true)

      // Define base query
      let query = supabase.from("marks").select(`
        mark,
        term,
        academic_year,
        subjects(id, name),
        students(id, first_name, last_name),
        student_classes(
          classes(
            name,
            grade_id,
            grades(name)
          )
        )
      `)

      // Add filters
      query = query.eq("academic_year", selectedYear)
      if (selectedTerm !== "all") {
        query = query.eq("term", selectedTerm)
      }

      // Execute query
      const { data, error } = await query

      if (error) throw error

      // Process data
      if (data && data.length > 0) {
        // Calculate overall average
        const sum = data.reduce((acc, curr) => acc + (curr.mark || 0), 0)
        const overallAverage = Math.round((sum / data.length) * 100) / 100

        // Group by grade to calculate grade averages
        const gradeGroups = data.reduce(
          (acc, curr) => {
            const gradeName = curr.student_classes?.classes?.grades?.name || "Unknown"
            if (!acc[gradeName]) {
              acc[gradeName] = { sum: 0, count: 0 }
            }
            acc[gradeName].sum += curr.mark || 0
            acc[gradeName].count += 1
            return acc
          },
          {} as Record<string, { sum: number; count: number }>,
        )

        const gradeAverages = Object.entries(gradeGroups)
          .map(([grade, data]) => ({
            grade,
            average: Math.round((data.sum / data.count) * 100) / 100,
          }))
          .sort((a, b) => a.grade.localeCompare(b.grade))

        // Group by subject to calculate subject averages
        const subjectGroups = data.reduce(
          (acc, curr) => {
            const subjectName = curr.subjects?.name || "Unknown"
            if (!acc[subjectName]) {
              acc[subjectName] = { sum: 0, count: 0 }
            }
            acc[subjectName].sum += curr.mark || 0
            acc[subjectName].count += 1
            return acc
          },
          {} as Record<string, { sum: number; count: number }>,
        )

        const subjectAverages = Object.entries(subjectGroups)
          .map(([subject, data]) => ({
            subject,
            average: Math.round((data.sum / data.count) * 100) / 100,
          }))
          .sort((a, b) => b.average - a.average)

        // Calculate pass/fail
        const passed = data.filter((mark) => mark.mark >= 50).length
        const failed = data.length - passed

        setPerformanceData({
          overallAverage,
          gradeAverages,
          subjectAverages,
          passFail: {
            passed,
            failed,
          },
        })
      } else {
        // No data found
        setPerformanceData({
          overallAverage: 0,
          gradeAverages: [],
          subjectAverages: [],
          passFail: {
            passed: 0,
            failed: 0,
          },
        })
      }
    } catch (error) {
      console.error("Error fetching performance data:", error)
      toast({
        title: "Error",
        description: "Failed to load performance data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DashboardLayout user={user}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">School Performance</h1>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Academic Year</label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2023">2023</SelectItem>
                    <SelectItem value="2022">2022</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Term</label>
                <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Term" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Terms</SelectItem>
                    <SelectItem value="1">Term 1</SelectItem>
                    <SelectItem value="2">Term 2</SelectItem>
                    <SelectItem value="3">Term 3</SelectItem>
                    <SelectItem value="4">Term 4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Overall Average</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{performanceData.overallAverage}%</p>
                  <p className="text-sm text-gray-500">School average for selected period</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Pass Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {performanceData.passFail.passed > 0 || performanceData.passFail.failed > 0
                      ? Math.round(
                          (performanceData.passFail.passed /
                            (performanceData.passFail.passed + performanceData.passFail.failed)) *
                            100,
                        )
                      : 0}
                    %
                  </p>
                  <p className="text-sm text-gray-500">Students achieving 50% or higher</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Top Subject</CardTitle>
                </CardHeader>
                <CardContent>
                  {performanceData.subjectAverages.length > 0 ? (
                    <>
                      <p className="text-xl font-bold">{performanceData.subjectAverages[0].subject}</p>
                      <p className="text-3xl font-bold">{performanceData.subjectAverages[0].average}%</p>
                    </>
                  ) : (
                    <p className="text-gray-500">No data available</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle>Grade Performance</CardTitle>
                  <CardDescription>Average performance by grade</CardDescription>
                </CardHeader>
                <CardContent>
                  {performanceData.gradeAverages.length > 0 ? (
                    <div className="space-y-4">
                      {performanceData.gradeAverages.map((grade) => (
                        <div key={grade.grade} className="flex items-center">
                          <div className="w-32 font-medium">{grade.grade}</div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full"
                                style={{ width: `${grade.average}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="w-16 text-right font-medium">{grade.average}%</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-500">No grade data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Subject Performance</CardTitle>
                  <CardDescription>Average performance by subject</CardDescription>
                </CardHeader>
                <CardContent>
                  {performanceData.subjectAverages.length > 0 ? (
                    <div className="space-y-4">
                      {performanceData.subjectAverages.map((subject) => (
                        <div key={subject.subject} className="flex items-center">
                          <div className="w-32 font-medium truncate" title={subject.subject}>
                            {subject.subject}
                          </div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full"
                                style={{ width: `${subject.average}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="w-16 text-right font-medium">{subject.average}%</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-500">No subject data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
