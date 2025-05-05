"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Search, ChevronUp, ChevronDown, User } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"

export default function TeacherPerformancePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [teachers, setTeachers] = useState<any[]>([])
  const [filteredTeachers, setFilteredTeachers] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [subjectFilter, setSubjectFilter] = useState("all")
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "ascending" | "descending" } | null>({
    key: "performance",
    direction: "descending",
  })
  const [subjects, setSubjects] = useState<any[]>([])

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
    fetchData()
  }, [router])

  useEffect(() => {
    filterAndSortTeachers()
  }, [searchQuery, subjectFilter, sortConfig, teachers])

  const fetchData = async () => {
    try {
      // Fetch teachers with their subjects
      const { data: teachersData, error: teachersError } = await supabase
        .from("teachers")
        .select(`
          *,
          users(email),
          teacher_subjects(
            id,
            subjects(id, name)
          )
        `)
        .order("last_name", { ascending: true })

      if (teachersError) throw teachersError

      // Fetch all subjects for filtering
      const { data: subjectsData, error: subjectsError } = await supabase
        .from("subjects")
        .select("id, name")
        .order("name", { ascending: true })

      if (subjectsError) throw subjectsError

      // Calculate teacher performance based on their students' marks
      const teachersWithPerformance = await Promise.all(
        (teachersData || []).map(async (teacher) => {
          try {
            // Find classes taught by this teacher
            const { data: classesData, error: classesError } = await supabase
              .from("classes")
              .select("id")
              .eq("teacher_id", teacher.id)

            if (classesError) throw classesError

            const classIds = (classesData || []).map((c) => c.id)

            // If teacher has classes, get student marks for those classes
            let averagePerformance = 0
            let passRate = 0

            if (classIds.length > 0) {
              // Get student marks
              const { data: marksData, error: marksError } = await supabase
                .from("marks")
                .select(`
                  mark,
                  student_classes!inner(
                    class_id
                  )
                `)
                .in("student_classes.class_id", classIds)

              if (marksError) throw marksError

              if (marksData && marksData.length > 0) {
                const sum = marksData.reduce((acc, curr) => acc + (curr.mark || 0), 0)
                averagePerformance = Math.round((sum / marksData.length) * 100) / 100

                const passed = marksData.filter((m) => m.mark >= 50).length
                passRate = Math.round((passed / marksData.length) * 100)
              }
            }

            return {
              ...teacher,
              performance: averagePerformance,
              passRate: passRate,
              subjectNames: teacher.teacher_subjects?.map((ts: any) => ts.subjects?.name).filter(Boolean) || [],
            }
          } catch (error) {
            console.error(`Error calculating performance for teacher ${teacher.id}:`, error)
            return {
              ...teacher,
              performance: 0,
              passRate: 0,
              subjectNames: teacher.teacher_subjects?.map((ts: any) => ts.subjects?.name).filter(Boolean) || [],
            }
          }
        }),
      )

      setTeachers(teachersWithPerformance || [])
      setSubjects(subjectsData || [])
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to load teachers data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filterAndSortTeachers = () => {
    let filtered = [...teachers]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (teacher) =>
          teacher.first_name.toLowerCase().includes(query) ||
          teacher.last_name.toLowerCase().includes(query) ||
          teacher.users?.email.toLowerCase().includes(query),
      )
    }

    // Apply subject filter
    if (subjectFilter !== "all") {
      filtered = filtered.filter((teacher) =>
        teacher.teacher_subjects?.some((ts: any) => ts.subjects?.id.toString() === subjectFilter),
      )
    }

    // Apply sorting
    if (sortConfig) {
      filtered.sort((a, b) => {
        let valueA, valueB

        switch (sortConfig.key) {
          case "name":
            valueA = `${a.last_name}, ${a.first_name}`.toLowerCase()
            valueB = `${b.last_name}, ${b.first_name}`.toLowerCase()
            break
          case "department":
            valueA = a.department?.toLowerCase() || ""
            valueB = b.department?.toLowerCase() || ""
            break
          case "performance":
            valueA = a.performance || 0
            valueB = b.performance || 0
            break
          case "passRate":
            valueA = a.passRate || 0
            valueB = b.passRate || 0
            break
          default:
            return 0
        }

        if (sortConfig.direction === "ascending") {
          return valueA > valueB ? 1 : -1
        } else {
          return valueA < valueB ? 1 : -1
        }
      })
    }

    setFilteredTeachers(filtered)
  }

  const requestSort = (key: string) => {
    let direction: "ascending" | "descending" = "ascending"
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }
    setSortConfig({ key, direction })
  }

  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return null
    }
    return sortConfig.direction === "ascending" ? (
      <ChevronUp className="h-4 w-4 ml-1" />
    ) : (
      <ChevronDown className="h-4 w-4 ml-1" />
    )
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
        <h1 className="text-2xl font-bold mb-6">Teacher Performance</h1>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative col-span-1 md:col-span-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                <Input
                  className="pl-10"
                  placeholder="Search teachers by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id.toString()}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Teacher Performance Overview</CardTitle>
            <CardDescription>View performance metrics for all teachers</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredTeachers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="py-3 px-4 text-left">
                        <div className="flex items-center cursor-pointer" onClick={() => requestSort("name")}>
                          Teacher
                          {getSortIcon("name")}
                        </div>
                      </th>
                      <th className="py-3 px-4 text-left">Subjects</th>
                      <th className="py-3 px-4 text-left">
                        <div className="flex items-center cursor-pointer" onClick={() => requestSort("department")}>
                          Department
                          {getSortIcon("department")}
                        </div>
                      </th>
                      <th className="py-3 px-4 text-left">
                        <div className="flex items-center cursor-pointer" onClick={() => requestSort("performance")}>
                          Class Average
                          {getSortIcon("performance")}
                        </div>
                      </th>
                      <th className="py-3 px-4 text-left">
                        <div className="flex items-center cursor-pointer" onClick={() => requestSort("passRate")}>
                          Pass Rate
                          {getSortIcon("passRate")}
                        </div>
                      </th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTeachers.map((teacher) => (
                      <tr key={teacher.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <Avatar className="h-8 w-8 mr-3">
                              <AvatarImage src={teacher.profile_image_url || "/placeholder.svg"} />
                              <AvatarFallback className="text-xs">
                                {teacher.first_name.charAt(0)}
                                {teacher.last_name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">
                                {teacher.first_name} {teacher.last_name}
                              </div>
                              <div className="text-sm text-gray-500">{teacher.users?.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {teacher.subjectNames.length > 0 ? (
                              teacher.subjectNames.map((subject: string, index: number) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {subject}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-gray-500 text-sm">No subjects</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {teacher.department || <span className="text-gray-500">Not assigned</span>}
                        </td>
                        <td className="py-3 px-4">
                          {teacher.performance > 0 ? (
                            <div>
                              <span
                                className={`font-medium ${
                                  teacher.performance >= 70
                                    ? "text-green-600"
                                    : teacher.performance >= 50
                                      ? "text-amber-600"
                                      : "text-red-600"
                                }`}
                              >
                                {teacher.performance}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-500">No data</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {teacher.passRate > 0 ? (
                            <div>
                              <span
                                className={`font-medium ${
                                  teacher.passRate >= 80
                                    ? "text-green-600"
                                    : teacher.passRate >= 60
                                      ? "text-amber-600"
                                      : "text-red-600"
                                }`}
                              >
                                {teacher.passRate}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-500">No data</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/admin/teachers/${teacher.id}`}>
                              <User className="h-4 w-4 mr-1" />
                              View
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                {searchQuery || subjectFilter !== "all"
                  ? "No teachers match your search criteria"
                  : "No teachers found"}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
