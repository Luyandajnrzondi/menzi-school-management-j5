"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Loader2, Users, User, BookOpen, Eye } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"

export default function ClassDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [classData, setClassData] = useState<any>(null)
  const [students, setStudents] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

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
    fetchClassData()
  }, [router, params.id])

  const fetchClassData = async () => {
    try {
      // Fetch class details
      const { data: classDetails, error: classError } = await supabase
        .from("classes")
        .select(`
          *,
          grades(id, name),
          teachers(id, first_name, last_name, phone, profile_image_url, users(email))
        `)
        .eq("id", params.id)
        .single()

      if (classError) throw classError

      setClassData(classDetails)

      // Fetch students in this class
      const { data: studentsData, error: studentsError } = await supabase
        .from("student_classes")
        .select(`
          *,
          students(
            id, student_id, first_name, last_name, gender, profile_image_url,
            users(email)
        `)
        .eq("class_id", params.id)
        .eq("academic_year", classDetails.academic_year)

      if (studentsError) throw studentsError

      setStudents(studentsData || [])

      // Fetch subjects for this grade
      const { data: subjectsData, error: subjectsError } = await supabase.from("subjects").select("*").order("name")

      if (subjectsError) throw subjectsError

      setSubjects(subjectsData || [])
    } catch (error) {
      console.error("Error fetching class data:", error)
      toast({
        title: "Error",
        description: "Failed to load class details. Please try again.",
        variant: "destructive",
      })
      router.push("/admin/classes")
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

  if (!classData) {
    return (
      <DashboardLayout user={user}>
        <div className="p-6">
          <div className="flex items-center mb-6">
            <Link href="/admin/classes">
              <Button variant="outline" size="sm" className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Classes
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Class Not Found</h1>
          </div>
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">The class you are looking for does not exist or has been removed.</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout user={user}>
      <div className="p-6">
        <div className="flex items-center mb-6">
          <Link href="/admin/classes">
            <Button variant="outline" size="sm" className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Classes
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">
            Class {classData.name} - {classData.grades?.name}
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Class Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Class Name</h3>
                  <p className="mt-1 font-medium">{classData.name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Grade</h3>
                  <p className="mt-1">{classData.grades?.name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Academic Year</h3>
                  <p className="mt-1">{classData.academic_year}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Number of Students</h3>
                  <p className="mt-1">{students.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Class Teacher</CardTitle>
            </CardHeader>
            <CardContent>
              {classData.teachers ? (
                <div className="flex items-center space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={classData.teachers.profile_image_url || "/placeholder.svg"} />
                    <AvatarFallback>
                      {classData.teachers.first_name.charAt(0)}
                      {classData.teachers.last_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {classData.teachers.first_name} {classData.teachers.last_name}
                    </p>
                    <p className="text-sm text-gray-500">{classData.teachers.users?.email}</p>
                    {classData.teachers.phone && <p className="text-sm text-gray-500">{classData.teachers.phone}</p>}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No class teacher assigned</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start text-blue-600 border-blue-600 hover:bg-blue-50"
                asChild
              >
                <Link href={`/admin/classes/${params.id}/add-student`}>
                  <User className="h-4 w-4 mr-2" />
                  Add Student to Class
                </Link>
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start text-blue-600 border-blue-600 hover:bg-blue-50"
                asChild
              >
                <Link href={`/admin/classes/${params.id}/attendance`}>
                  <Users className="h-4 w-4 mr-2" />
                  View Attendance
                </Link>
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start text-blue-600 border-blue-600 hover:bg-blue-50"
                asChild
              >
                <Link href={`/admin/classes/${params.id}/timetable`}>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Class Timetable
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="students">
          <TabsList className="mb-4">
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="subjects">Subjects</TabsTrigger>
          </TabsList>

          <TabsContent value="students">
            <Card>
              <CardHeader>
                <CardTitle>Students in Class {classData.name}</CardTitle>
                <CardDescription>
                  {students.length} student{students.length !== 1 ? "s" : ""} enrolled
                </CardDescription>
              </CardHeader>
              <CardContent>
                {students.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="py-3 px-4 text-left">Student ID</th>
                          <th className="py-3 px-4 text-left">Name</th>
                          <th className="py-3 px-4 text-left">Gender</th>
                          <th className="py-3 px-4 text-left">Email</th>
                          <th className="py-3 px-4 text-left">Status</th>
                          <th className="py-3 px-4 text-left">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((student) => (
                          <tr key={student.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4">{student.students?.student_id}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={student.students?.profile_image_url || "/placeholder.svg"} />
                                  <AvatarFallback>
                                    {student.students?.first_name.charAt(0)}
                                    {student.students?.last_name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium">
                                  {student.students?.first_name} {student.students?.last_name}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4 capitalize">{student.students?.gender}</td>
                            <td className="py-3 px-4">{student.students?.users?.email || "N/A"}</td>
                            <td className="py-3 px-4">
                              <Badge
                                className={
                                  student.status === "active"
                                    ? "bg-green-500 hover:bg-green-600 text-white"
                                    : student.status === "pending"
                                      ? "bg-orange-500 hover:bg-orange-600 text-white"
                                      : "bg-red-500 hover:bg-red-600 text-white"
                                }
                              >
                                {student.status ? 
                                  student.status.charAt(0).toUpperCase() + student.status.slice(1) : 
                                  "Active"}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-blue-600 border-blue-600 hover:bg-blue-50"
                                asChild
                              >
                                <Link href={`/admin/students/${student.students?.id}`}>
                                  <Eye className="h-4 w-4 mr-1" />
                                  View Profile
                                </Link>
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center py-4 text-gray-500">No students enrolled in this class yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subjects">
            <Card>
              <CardHeader>
                <CardTitle>Subjects for {classData.grades?.name}</CardTitle>
                <CardDescription>Subjects taught in this class</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {subjects.map((subject) => (
                    <Card key={subject.id} className="hover:bg-gray-50">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <BookOpen className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium">{subject.name}</p>
                            <Badge
                              variant={subject.is_compulsory ? "default" : "outline"}
                              className={
                                subject.is_compulsory 
                                  ? "bg-blue-500 hover:bg-blue-600 text-white"
                                  : "text-gray-600"
                              }
                            >
                              {subject.is_compulsory ? "Compulsory" : "Optional"}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
