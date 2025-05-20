"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, Users, Loader2, Eye } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"

export default function AdminClassesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [classes, setClasses] = useState<any[]>([])
  const [filteredClasses, setFilteredClasses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [totalClasses, setTotalClasses] = useState(0)

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
    fetchClasses()
  }, [router])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredClasses(classes)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = classes.filter(
        (classItem) =>
          classItem.name.toLowerCase().includes(query) ||
          classItem.grades?.name.toLowerCase().includes(query) ||
          (classItem.teachers?.first_name && classItem.teachers.first_name.toLowerCase().includes(query)) ||
          (classItem.teachers?.last_name && classItem.teachers.last_name.toLowerCase().includes(query)),
      )
      setFilteredClasses(filtered)
    }
  }, [searchQuery, classes])

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
          <h1 className="text-2xl font-bold">Manage Classes</h1>
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
              <CardTitle className="text-lg">Total Classes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totalClasses}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              <Input
                className="pl-10"
                placeholder="Search classes by name, grade, or teacher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Class List</CardTitle>
            <CardDescription>View and manage all classes in the school</CardDescription>
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
                      <tr key={classItem.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{classItem.name}</td>
                        <td className="py-3 px-4">{classItem.grades?.name}</td>
                        <td className="py-3 px-4">
                          {classItem.teachers
                            ? `${classItem.teachers.first_name} ${classItem.teachers.last_name}`
                            : "Not assigned"}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-2 text-gray-500" />
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
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-gray-500">
                        {searchQuery ? "No classes found matching your search" : "No classes found"}
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
