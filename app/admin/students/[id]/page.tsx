"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Loader2, Mail, MapPin, Calendar, User, BookOpen } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"

export default function StudentDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [student, setStudent] = useState<any>(null)
  const [studentClasses, setStudentClasses] = useState<any[]>([])
  const [studentSubjects, setStudentSubjects] = useState<any[]>([])
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
    fetchStudentData()
  }, [router, params.id])

  const fetchStudentData = async () => {
    try {
      // Fetch student details
      const { data: studentData, error: studentError } = await supabase
        .from("students")
        .select(`
          *,
          users(email)
        `)
        .eq("id", params.id)
        .single()

      if (studentError) throw studentError

      setStudent(studentData)

      // Fetch student classes
      const { data: classesData, error: classesError } = await supabase
        .from("student_classes")
        .select(`
          *,
          classes(
            id,
            name,
            academic_year,
            grades(name),
            teachers(first_name, last_name)
          )
        `)
        .eq("student_id", studentData.student_id)

      if (classesError) throw classesError

      setStudentClasses(classesData || [])

      // Fetch student subjects
      const currentYear = new Date().getFullYear()
      const { data: marksData, error: marksError } = await supabase
        .from("marks")
        .select(`
          *,
          subjects(id, name)
        `)
        .eq("student_id", studentData.student_id)
        .eq("academic_year", currentYear)

      if (marksError) throw marksError

      // Extract unique subjects from marks
      const uniqueSubjects = Array.from(new Set(marksData?.map((mark) => mark.subjects?.id) || [])).map((subjectId) => {
        const subjectMark = marksData?.find((mark) => mark.subjects?.id === subjectId)
        return subjectMark?.subjects
      })

      setStudentSubjects(uniqueSubjects || [])
    } catch (error) {
      console.error("Error fetching student data:", error)
      toast({
        title: "Error",
        description: "Failed to load student details. Please try again.",
        variant: "destructive",
      })
      router.push("/admin/students")
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

  if (!student) {
    return (
      <DashboardLayout user={user}>
        <div className="p-6">
          <div className="flex items-center mb-6">
            <Link href="/admin/students">
              <Button variant="outline" size="sm" className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Students
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Student Not Found</h1>
          </div>
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">The student you are looking for does not exist or has been removed.</p>
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
          <Link href="/admin/students">
            <Button variant="outline" size="sm" className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Students
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Student Profile</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-24 w-24 mb-4">
                    <AvatarImage src={student.profile_image_url || "/placeholder.svg"} />
                    <AvatarFallback className="text-2xl">
                      {student.first_name.charAt(0)}
                      {student.last_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="text-xl font-bold">
                    {student.first_name} {student.last_name}
                  </h2>
                  <p className="text-gray-500 mb-4">Student ID: {student.student_id}</p>

                  <div className="w-full space-y-3 mt-4">
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-gray-500" />
                      <span>{student.users?.email || "No email"}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                      <span>{new Date(student.date_of_birth).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="capitalize">{student.gender}</span>
                    </div>
                    {student.address && (
                      <div className="flex items-start">
                        <MapPin className="h-4 w-4 mr-2 text-gray-500 mt-1" />
                        <span>{student.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Tabs defaultValue="classes">
              <TabsList className="mb-4">
                <TabsTrigger value="classes">Classes</TabsTrigger>
                <TabsTrigger value="subjects">Subjects</TabsTrigger>
                <TabsTrigger value="attendance">Attendance</TabsTrigger>
                <TabsTrigger value="marks">Marks</TabsTrigger>
              </TabsList>

              <TabsContent value="classes">
                <Card>
                  <CardHeader>
                    <CardTitle>Classes</CardTitle>
                    <CardDescription>Classes the student is enrolled in</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {studentClasses.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="border-b">
                              <th className="py-3 px-4 text-left">Class</th>
                              <th className="py-3 px-4 text-left">Grade</th>
                              <th className="py-3 px-4 text-left">Academic Year</th>
                              <th className="py-3 px-4 text-left">Class Teacher</th>
                            </tr>
                          </thead>
                          <tbody>
                            {studentClasses.map((classItem) => (
                              <tr key={classItem.id} className="border-b hover:bg-gray-50">
                                <td className="py-3 px-4">{classItem.classes?.name}</td>
                                <td className="py-3 px-4">{classItem.classes?.grades?.name}</td>
                                <td className="py-3 px-4">{classItem.academic_year}</td>
                                <td className="py-3 px-4">
                                  {classItem.classes?.teachers
                                    ? `${classItem.classes.teachers.first_name} ${classItem.classes.teachers.last_name}`
                                    : "Not assigned"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-center py-4 text-gray-500">No classes found for this student</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="subjects">
                <Card>
                  <CardHeader>
                    <CardTitle>Subjects</CardTitle>
                    <CardDescription>Subjects the student is taking</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {studentSubjects.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {studentSubjects.map((subject) => (
                          <div key={subject.id} className="flex items-center p-3 border rounded-md hover:bg-gray-50">
                            <BookOpen className="h-5 w-5 mr-3 text-primary" />
                            <span>{subject.name}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center py-4 text-gray-500">No subjects found for this student</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="attendance">
                <Card>
                  <CardHeader>
                    <CardTitle>Attendance</CardTitle>
                    <CardDescription>Student's attendance record</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-center py-4 text-gray-500">Attendance records will be displayed here</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="marks">
                <Card>
                  <CardHeader>
                    <CardTitle>Marks</CardTitle>
                    <CardDescription>Student's academic performance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-center py-4 text-gray-500">Marks will be displayed here</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
