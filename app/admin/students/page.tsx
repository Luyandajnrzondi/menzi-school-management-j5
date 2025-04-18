"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Search, Plus, UserPlus, ArrowUpDown, Trash2, Edit } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"

export default function StudentsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [students, setStudents] = useState<any[]>([])
  const [filteredStudents, setFilteredStudents] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  // Filtering and sorting states
  const [filterGender, setFilterGender] = useState<string>("all")
  const [filterClass, setFilterClass] = useState<string>("all")
  const [sortField, setSortField] = useState<string>("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [classes, setClasses] = useState<any[]>([])

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem("user")

    if (!storedUser) {
      router.push("/login")
      return
    }

    const parsedUser = JSON.parse(storedUser)

    // Check if user is admin or principal
    if (parsedUser.role !== "admin" && parsedUser.role !== "principal") {
      router.push("/dashboard")
      return
    }

    setUser(parsedUser)
    fetchClasses()
    fetchStudents()
  }, [router])

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from("classes")
        .select(`
          id,
          name,
          grades(id, name)
        `)
        .order("grade_id", { ascending: true })

      if (error) throw error
      setClasses(data || [])
    } catch (error) {
      console.error("Error fetching classes:", error)
    }
  }

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from("students")
        .select(`
          *,
          student_classes(
            id,
            class_id,
            classes(
              id,
              name,
              grades(id, name)
            )
          )
        `)
        .order("last_name", { ascending: true })

      if (error) throw error

      setStudents(data || [])
      setFilteredStudents(data || [])
    } catch (error) {
      console.error("Error fetching students:", error)
      toast({
        title: "Error",
        description: "Failed to load students. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    applyFiltersAndSort()
  }, [searchQuery, filterGender, filterClass, sortField, sortDirection, students])

  const applyFiltersAndSort = () => {
    let filtered = [...students]

    // Apply search filter
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (student) =>
          student.first_name.toLowerCase().includes(query) ||
          student.last_name.toLowerCase().includes(query) ||
          student.student_id.toLowerCase().includes(query),
      )
    }

    // Apply gender filter
    if (filterGender !== "all") {
      filtered = filtered.filter((student) => student.gender === filterGender)
    }

    // Apply class filter
    if (filterClass !== "all") {
      filtered = filtered.filter((student) => {
        if (!student.student_classes || student.student_classes.length === 0) return false
        return student.student_classes.some((sc: any) => sc.class_id.toString() === filterClass)
      })
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let valueA, valueB

      switch (sortField) {
        case "name":
          valueA = `${a.last_name} ${a.first_name}`.toLowerCase()
          valueB = `${b.last_name} ${b.first_name}`.toLowerCase()
          break
        case "id":
          valueA = a.student_id.toLowerCase()
          valueB = b.student_id.toLowerCase()
          break
        case "gender":
          valueA = a.gender.toLowerCase()
          valueB = b.gender.toLowerCase()
          break
        case "class":
          const classA = getCurrentClass(a)
          const classB = getCurrentClass(b)
          valueA = classA.toLowerCase()
          valueB = classB.toLowerCase()
          break
        default:
          valueA = a.last_name.toLowerCase()
          valueB = b.last_name.toLowerCase()
      }

      if (sortDirection === "asc") {
        return valueA > valueB ? 1 : -1
      } else {
        return valueA < valueB ? 1 : -1
      }
    })

    setFilteredStudents(filtered)
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const handleDeleteStudent = async (id: number) => {
    setIsDeleting(true)
    try {
      // First get the student to find the user_id
      const { data: studentData, error: fetchError } = await supabase
        .from("students")
        .select("user_id")
        .eq("id", id)
        .single()

      if (fetchError) throw fetchError

      // Delete student's class assignments
      const { error: classError } = await supabase.from("student_classes").delete().eq("student_id", id)

      if (classError) throw classError

      // Delete student record
      const { error: studentError } = await supabase.from("students").delete().eq("id", id)

      if (studentError) throw studentError

      // Delete user account if exists
      if (studentData?.user_id) {
        const { error: userError } = await supabase.from("users").delete().eq("id", studentData.user_id)

        if (userError) throw userError
      }

      toast({
        title: "Success",
        description: "Student has been deleted successfully",
      })

      // Refresh student list
      fetchStudents()
    } catch (error) {
      console.error("Error deleting student:", error)
      toast({
        title: "Error",
        description: "Failed to delete student. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setDeleteId(null)
    }
  }

  const getCurrentClass = (student: any) => {
    if (!student.student_classes || student.student_classes.length === 0) {
      return "Not Assigned"
    }

    // Sort by most recent academic year
    const sortedClasses = [...student.student_classes].sort((a, b) => {
      if (!a.classes || !b.classes) return 0
      return b.classes.academic_year - a.classes.academic_year
    })

    const currentClass = sortedClasses[0]
    if (!currentClass.classes || !currentClass.classes.grades) {
      return "Unknown Class"
    }

    return `${currentClass.classes.grades.name} ${currentClass.classes.name}`
  }

  const resetFilters = () => {
    setSearchQuery("")
    setFilterGender("all")
    setFilterClass("all")
    setSortField("name")
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
            <h1 className="text-2xl font-bold">Students</h1>
            <p className="text-muted-foreground">Manage and view all students in the school</p>
          </div>
          <Button asChild>
            <Link href="/admin/students/add">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Student
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{students.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Male Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{students.filter((s) => s.gender === "male").length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Female Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{students.filter((s) => s.gender === "female").length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Unassigned Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {students.filter((s) => !s.student_classes || s.student_classes.length === 0).length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search & Filter</CardTitle>
            <CardDescription>Find students by name, ID, gender, or class</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search students..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={handleSearch}
                />
              </div>

              <div>
                <Select value={filterGender} onValueChange={setFilterGender}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Genders</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Select value={filterClass} onValueChange={setFilterClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.grades?.name} {c.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Select value={sortField} onValueChange={setSortField}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="id">Student ID</SelectItem>
                    <SelectItem value="gender">Gender</SelectItem>
                    <SelectItem value="class">Class</SelectItem>
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
            <CardTitle>All Students</CardTitle>
            <CardDescription>
              Showing {filteredStudents.length} of {students.length} students
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredStudents.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="py-3 px-4 text-left">Student ID</th>
                      <th className="py-3 px-4 text-left">Name</th>
                      <th className="py-3 px-4 text-left">Gender</th>
                      <th className="py-3 px-4 text-left">Current Class</th>
                      <th className="py-3 px-4 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student) => (
                      <tr key={student.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4">{student.student_id}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={student.profile_image_url || "/placeholder.svg"} />
                              <AvatarFallback>
                                {student.first_name.charAt(0)}
                                {student.last_name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">
                              {student.first_name} {student.last_name}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 capitalize">{student.gender}</td>
                        <td className="py-3 px-4">
                          <Badge variant={getCurrentClass(student) === "Not Assigned" ? "outline" : "secondary"}>
                            {getCurrentClass(student)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/admin/students/${student.id}`}>View</Link>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/admin/students/${student.id}/edit`}>
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Link>
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="text-destructive">
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the student and remove
                                    their data from our servers.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteStudent(student.id)}
                                    disabled={isDeleting}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    {isDeleting && deleteId === student.id ? (
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="mr-2 h-4 w-4" />
                                    )}
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-4">
                  {searchQuery || filterGender !== "all" || filterClass !== "all"
                    ? "No students match your search criteria."
                    : "No students found."}
                </p>
                <Button asChild>
                  <Link href="/admin/students/add">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Student
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
