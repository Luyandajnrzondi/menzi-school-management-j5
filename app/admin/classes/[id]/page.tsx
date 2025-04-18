"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Loader2, Users, BookOpen, Calendar, Plus, UserPlus, Award } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"

export default function ClassDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [classData, setClassData] = useState<any>(null)
  const [students, setStudents] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [representatives, setRepresentatives] = useState<any[]>([])
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
          grades(id, name)
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
            id, student_id, first_name, last_name, gender, profile_image_url
          )
        `)
        .eq("class_id", params.id)
        .eq("academic_year", classDetails.academic_year)

      if (studentsError) throw studentsError

      setStudents(studentsData || [])

      // Fetch subjects for this grade
      const { data: subjectsData, error: subjectsError } = await supabase
        .from("subjects")
        .select(`
          *,
          class_subject_teachers(
            id,
            teacher_id,
            teachers(id, first_name, last_name)
          )
        `)
        .contains("applicable_grades", [classDetails.grade_id])

      if (subjectsError) throw subjectsError

      // Filter subjects to only include those with class_subject_teachers for this class
      const filteredSubjects = subjectsData.map((subject) => {
        const teacherForClass = subject.class_subject_teachers.find((cst: any) => cst.teacher_id && cst.teachers)
        return {
          ...subject,
          teacher: teacherForClass ? teacherForClass.teachers : null,
        }
      })

      setSubjects(filteredSubjects || [])

      // Fetch class representatives
      const { data: repsData, error: repsError } = await supabase
        .from("class_representatives")
        .select(`
          *,
          students(id, first_name, last_name, profile_image_url)
        `)
        .eq("class_id", params.id)

      if (repsError && repsError.code !== "PGSQL_ERROR") throw repsError

      setRepresentatives(repsData || [])
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

  const getRoleName = (roleId: string) => {
    const roles: { [key: string]: string } = {
      class_monitor: "Class Monitor",
      assistant_monitor: "Assistant Monitor",
      time_keeper: "Time Keeper",
      health_prefect: "Health Prefect",
      sports_prefect: "Sports Prefect",
      library_prefect: "Library Prefect",
      environment_prefect: "Environment Prefect",
    }
    return roles[roleId] || roleId
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
            {classData.grades?.name} {classData.name}
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Users className="h-8 w-8 mr-3 text-primary" />
                <span className="text-3xl font-bold">{students.length}</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" asChild className="w-full">
                <Link href={`/admin/classes/${params.id}/add-student`}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Student
                </Link>
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Subjects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 mr-3 text-primary" />
                <span className="text-3xl font-bold">{subjects.length}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Academic Year</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Calendar className="h-8 w-8 mr-3 text-primary" />
                <span className="text-3xl font-bold">{classData.academic_year}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="students">
          <TabsList className="mb-4">
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="subjects">Subjects</TabsTrigger>
            <TabsTrigger value="representatives">Class Representatives</TabsTrigger>
          </TabsList>

          <TabsContent value="students">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Students</CardTitle>
                    <CardDescription>Students enrolled in this class</CardDescription>
                  </div>
                  <Button asChild>
                    <Link href={`/admin/classes/${params.id}/add-student`}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Student
                    </Link>
                  </Button>
                </div>
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
                            <td className="py-3 px-4">
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/admin/students/${student.students?.id}`}>View</Link>
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-500 mb-4">No students enrolled in this class yet.</p>
                    <Button asChild>
                      <Link href={`/admin/classes/${params.id}/add-student`}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Student
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subjects">
            <Card>
              <CardHeader>
                <CardTitle>Subjects</CardTitle>
                <CardDescription>Subjects taught in this class</CardDescription>
              </CardHeader>
              <CardContent>
                {subjects.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="py-3 px-4 text-left">Subject</th>
                          <th className="py-3 px-4 text-left">Subject Code</th>
                          <th className="py-3 px-4 text-left">Teacher</th>
                          <th className="py-3 px-4 text-left">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subjects.map((subject) => (
                          <tr key={subject.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4">{subject.name}</td>
                            <td className="py-3 px-4">{subject.subject_code}</td>
                            <td className="py-3 px-4">
                              {subject.teacher ? (
                                <span>
                                  {subject.teacher.first_name} {subject.teacher.last_name}
                                </span>
                              ) : (
                                <Badge variant="outline" className="text-red-500 border-red-200 bg-red-50">
                                  Not Assigned
                                </Badge>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/admin/classes/${params.id}/assign-teacher/${subject.id}`}>
                                  {subject.teacher ? "Change Teacher" : "Assign Teacher"}
                                </Link>
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center py-4 text-gray-500">No subjects found for this class</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="representatives">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Class Representatives</CardTitle>
                    <CardDescription>Student leaders for this class</CardDescription>
                  </div>
                  <Button asChild>
                    <Link href={`/admin/classes/${params.id}/add-representative`}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Representative
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {representatives.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {representatives.map((rep) => (
                      <Card key={rep.id} className="overflow-hidden">
                        <CardContent className="p-0">
                          <div className="bg-primary/10 p-4 flex items-center space-x-4">
                            <Avatar className="h-12 w-12 border-2 border-white">
                              <AvatarImage src={rep.students?.profile_image_url || "/placeholder.svg"} />
                              <AvatarFallback>
                                {rep.students?.first_name.charAt(0)}
                                {rep.students?.last_name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">
                                {rep.students?.first_name} {rep.students?.last_name}
                              </p>
                              <div className="flex items-center mt-1">
                                <Award className="h-4 w-4 mr-1 text-primary" />
                                <span className="text-sm">{getRoleName(rep.role)}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-500 mb-4">No class representatives assigned yet.</p>
                    <Button asChild>
                      <Link href={`/admin/classes/${params.id}/add-representative`}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Representative
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
