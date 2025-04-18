"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, Users, Loader2, Eye, Filter, ArrowUpDown, BookOpen, GraduationCap } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function AdminClassesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [classes, setClasses] = useState<any[]>([])
  const [filteredClasses, setFilteredClasses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [totalClasses, setTotalClasses] = useState(0)
  const [grades, setGrades] = useState<any[]>([])
  const [academicYears, setAcademicYears] = useState<number[]>([])

  // Filtering and sorting states
  const [filterGrade, setFilterGrade] = useState<string>("all")
  const [filterYear, setFilterYear] = useState<string>("all")
  const [sortField, setSortField] = useState<string>("grade")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

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
    fetchGrades()
    fetchClasses()
  }, [router])

  const fetchGrades = async () => {
    try {
      const { data, error } = await supabase.from("grades").select("*").order("id", { ascending: true })

      if (error) throw error
      setGrades(data || [])
    } catch (error) {
      console.error("Error fetching grades:", error)
    }
  }

  useEffect(() => {
    applyFiltersAndSort()
  }, [searchQuery, filterGrade, filterYear, sortField, sortDirection, classes])

  const applyFiltersAndSort = () => {
    let filtered = [...classes]

    // Apply search filter
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (classItem) =>
          classItem.name.toLowerCase().includes(query) ||
          (classItem.grades?.name && classItem.grades.name.toLowerCase().includes(query)) ||
          (classItem.teachers?.first_name && classItem.teachers.first_name.toLowerCase().includes(query)) ||
          (classItem.teachers?.last_name && classItem.teachers.last_name.toLowerCase().includes(query)),
      )
    }

    // Apply grade filter
    if (filterGrade !== "all") {
      filtered = filtered.filter((classItem) => classItem.grade_id.toString() === filterGrade)
    }

    // Apply academic year filter
    if (filterYear !== "all") {
      filtered = filtered.filter((classItem) => classItem.academic_year.toString() === filterYear)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let valueA, valueB

      switch (sortField) {
        case "name":
          valueA = a.name.toLowerCase()
          valueB = b.name.toLowerCase()
          break
        case "grade":
          valueA = a.grades?.name?.toLowerCase() || ""
          valueB = b.grades?.name?.toLowerCase() || ""
          break
        case "teacher":
          valueA = a.teachers ? `${a.teachers.first_name} ${a.teachers.last_name}`.toLowerCase() : ""
          valueB = b.teachers ? `${b.teachers.first_name} ${b.teachers.last_name}`.toLowerCase() : ""
          break
        case "students":
          valueA = a.studentCount || 0
          valueB = b.studentCount || 0
          break
        case "year":
          valueA = a.academic_year
          valueB = b.academic_year
          break
        default:
          valueA = a.grade_id
          valueB = b.grade_id
      }

      if (sortDirection === "asc") {
        return valueA > valueB ? 1 : -1
      } else {
        return valueA < valueB ? 1 : -1
      }
    })

    setFilteredClasses(filtered)
  }

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from("classes")
        .select(`
          *,
          grades(name),
          teachers(first_name, last_name)
        `)
        .order("grade_id", { ascending: true })
        .order("name", { ascending: true })

      if (error) {
        throw error
      }

      // For each class, get the count of students
      const classesWithStudentCount = await Promise.all(
        (data || []).map(async (classItem) => {
          const { count, error: countError } = await supabase
            .from("student_classes")
            .select("*", { count: "exact", head: true })
            .eq("class_id", classItem.id)
            .eq("academic_year", classItem.academic_year)

          if (countError) {
            console.error("Error counting students:", countError)
            return { ...classItem, studentCount: 0 }
          }

          return { ...classItem, studentCount: count || 0 }
        }),
      )

      // Extract unique academic years
      const years = Array.from(new Set(classesWithStudentCount.map((c) => c.academic_year))).sort((a, b) => b - a)
      setAcademicYears(years)

      setClasses(classesWithStudentCount)
      setFilteredClasses(classesWithStudentCount)
      setTotalClasses(classesWithStudentCount.length)
    } catch (error) {
      console.error("Error fetching classes:", error)
      toast({
        title: "Error",
        description: "Failed to load classes. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetFilters = () => {
    setSearchQuery("")
    setFilterGrade("all")
    setFilterYear("all")
    setSortField("grade")
    setSortDirection("asc")
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
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 mb-6">
          <div>
            <h1 className="text-2xl font-bold">Manage Classes</h1>
            <p className="text-muted-foreground">View and manage all classes in the school</p>
          </div>
          <Button asChild>
            <Link href="/admin/classes/add">
              <Plus className="h-4 w-4 mr-2" />
              Add Class
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
              <CardDescription>All classes across all grades</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <GraduationCap className="h-8 w-8 mr-3 text-primary" />
                <span className="text-3xl font-bold">{totalClasses}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <CardDescription>Students enrolled in all classes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Users className="h-8 w-8 mr-3 text-primary" />
                <span className="text-3xl font-bold">
                  {classes.reduce((total, classItem) => total + (classItem.studentCount || 0), 0)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Current Academic Year</CardTitle>
              <CardDescription>Active academic year</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 mr-3 text-primary" />
                <span className="text-3xl font-bold">{new Date().getFullYear()}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search & Filter</CardTitle>
            <CardDescription>Find classes by name, grade, or teacher</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-8"
                  placeholder="Search classes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div>
                <Select value={filterGrade} onValueChange={setFilterGrade}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Grades</SelectItem>
                    {grades.map((grade) => (
                      <SelectItem key={grade.id} value={grade.id.toString()}>
                        {grade.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Select value={filterYear} onValueChange={setFilterYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    {academicYears.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Select value={sortField} onValueChange={setSortField}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grade">Grade</SelectItem>
                    <SelectItem value="name">Class Name</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="students">Students</SelectItem>
                    <SelectItem value="year">Academic Year</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
                >
                  <ArrowUpDown className={`h-4 w-4 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                </Button>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <Button variant="outline" size="sm" onClick={resetFilters}>
                Reset Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Class List</CardTitle>
            <CardDescription>
              Showing {filteredClasses.length} of {classes.length} classes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="py-3 px-4 text-left">Class Name</th>
                    <th className="py-3 px-4 text-left">Grade</th>
                    <th className="py-3 px-4 text-left">Class Teacher</th>
                    <th className="py-3 px-4 text-left">Students</th>
                    <th className="py-3 px-4 text-left">Academic Year</th>
                    <th className="py-3 px-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClasses.length > 0 ? (
                    filteredClasses.map((classItem) => (
                      <tr key={classItem.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4 font-medium">{classItem.name}</td>
                        <td className="py-3 px-4">{classItem.grades?.name}</td>
                        <td className="py-3 px-4">
                          {classItem.teachers ? (
                            `${classItem.teachers.first_name} ${classItem.teachers.last_name}`
                          ) : (
                            <Badge variant="outline">Not assigned</Badge>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>{classItem.studentCount}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">{classItem.academic_year}</td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/admin/classes/${classItem.id}`}>
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Link>
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Filter className="h-4 w-4 mr-1" />
                                  Manage
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link href={`/admin/classes/${classItem.id}/subjects`} className="cursor-pointer">
                                    Assign Subjects
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={`/admin/classes/${classItem.id}/add-student`} className="cursor-pointer">
                                    Add Students
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={`/admin/classes/${classItem.id}/edit`} className="cursor-pointer">
                                    Edit Class
                                  </Link>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-muted-foreground">
                        {searchQuery || filterGrade !== "all" || filterYear !== "all"
                          ? "No classes found matching your search"
                          : "No classes found"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
