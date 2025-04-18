"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"

export default function SubjectDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [subject, setSubject] = useState<any>(null)
  const [teachers, setTeachers] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
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
    fetchSubjectData()
  }, [router, params.id])

  const fetchSubjectData = async () => {
    try {
      // Fetch subject details
      const { data: subjectData, error: subjectError } = await supabase
        .from("subjects")
        .select("*")
        .eq("id", params.id)
        .single()

      if (subjectError) throw subjectError

      setSubject(subjectData)

      // Fetch teachers who teach this subject
      const { data: teachersData, error: teachersError } = await supabase
        .from("teacher_subjects")
        .select(`
          *,
          teachers(
            id, first_name, last_name, phone, profile_image_url,
            users(email)
          )
        `)
        .eq("subject_id", params.id)

      if (teachersError) throw teachersError

      setTeachers(teachersData || [])

      // Fetch students taking this subject (from marks table)
      const currentYear = new Date().getFullYear()
      const { data: marksData, error: marksError } = await supabase
        .from("marks")
        .select(`
          *,
          students(
            id, student_id, first_name, last_name, gender, profile_image_url,
            users(email)
          )
        `)
        .eq("subject_id", params.id)
        .eq("academic_year", currentYear)

      if (marksError) throw marksError

      // Extract unique students
      const uniqueStudentIds = new Set()
      const uniqueStudents = []

      for (const mark of marksData || []) {
        if (mark.students && !uniqueStudentIds.has(mark.students.id)) {
          uniqueStudentIds.add(mark.students.id)
          uniqueStudents.push(mark)
        }
      }

      setStudents(uniqueStudents)
    } catch (error) {
      console.error("Error fetching subject data:", error)
      toast({
        title: "Error",
        description: "Failed to load subject details. Please try again.",
        variant: "destructive",
      })
      router.push("/admin/subjects")
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

  if (!subject) {
    return (
      <DashboardLayout user={user}>
        <div className="p-6">
          <div className="flex items-center mb-6">
            <Link href="/admin/subjects">
              <Button variant="outline" size="sm" className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Subjects
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Subject Not Found</h1>
          </div>
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">The subject you are looking for does not exist or has been removed.</p>
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
          <Link href="/admin/subjects">
            <Button variant="outline" size="sm" className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Subjects
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">{subject.name}</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Subject Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Subject Name</h3>
                  <p className="mt-1 font-medium">{subject.name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Type</h3>
                  <p className="mt-1">{subject.is_compulsory ? "Compulsory" : "Optional"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Number of Teachers</h3>
                  <p className="mt-1">{teachers.length}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Number of Students</h3>
                  <p className="mt-1">{students.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="teachers">
          <TabsList className="mb-4">
            <TabsTrigger value="teachers">Teachers</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
          </TabsList>

          <TabsContent value="teachers">
            <Card>
              <CardHeader>
                <CardTitle>Teachers</CardTitle>
                <CardDescription>Teachers who teach {subject.name}</CardDescription>
              </CardHeader>
              <CardContent>
                {teachers.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="py-3 px-4 text-left">Name</th>
                          <th className="py-3 px-4 text-left">Email</th>
                          <th className="py-3 px-4 text-left">Phone</th>
                          <th className="py-3 px-4 text-left">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teachers.map((teacher) => (
                          <tr key={teacher.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={teacher.teachers?.profile_image_url || "/placeholder.svg"} />
                                  <AvatarFallback>
                                    {teacher.teachers?.first_name.charAt(0)}
                                    {teacher.teachers?.last_name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium">
                                  {teacher.teachers?.first_name} {teacher.teachers?.last_name}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4">{teacher.teachers?.users?.email || "N/A"}</td>
                            <td className="py-3 px-4">{teacher.teachers?.phone || "N/A"}</td>
                            <td className="py-3 px-4">
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/admin/teachers/${teacher.teachers?.id}`}>View Profile</Link>
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center py-4 text-gray-500">No teachers assigned to this subject yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="students">
            <Card>
              <CardHeader>
                <CardTitle>Students</CardTitle>
                <CardDescription>Students taking {subject.name}</CardDescription>
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
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/admin/students/${student.students?.id}`}>View Profile</Link>
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center py-4 text-gray-500">No students taking this subject yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
