"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Loader2, Mail, Phone, MapPin, Edit, ArrowLeft, BookOpen, Users } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"

export default function TeacherProfilePage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [teacher, setTeacher] = useState<any>(null)
  const [teacherClasses, setTeacherClasses] = useState<any[]>([])
  const [teacherSubjects, setTeacherSubjects] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

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
    fetchTeacherData()
  }, [router, params])

  const fetchTeacherData = async () => {
    try {
      const teacherId = params.id

      // Fetch teacher details
      const { data: teacherData, error: teacherError } = await supabase
        .from("teachers")
        .select(`
          *,
          users(email, role_id)
        `)
        .eq("id", teacherId)
        .single()

      if (teacherError) throw teacherError

      // Fetch classes taught by this teacher
      const { data: classesData, error: classesError } = await supabase
        .from("classes")
        .select(`
          *,
          grades(name)
        `)
        .eq("teacher_id", teacherId)
        .order("academic_year", { ascending: false })
        .order("grade_id", { ascending: true })

      if (classesError) throw classesError

      // Fetch subjects taught by this teacher
      const { data: subjectsData, error: subjectsError } = await supabase
        .from("teacher_subjects")
        .select(`
          *,
          subjects(id, name, is_compulsory)
        `)
        .eq("teacher_id", teacherId)

      if (subjectsError) throw subjectsError

      setTeacher(teacherData)
      setTeacherClasses(classesData || [])
      setTeacherSubjects(subjectsData || [])
    } catch (error) {
      console.error("Error fetching teacher data:", error)
      toast({
        title: "Error",
        description: "Failed to load teacher data. Please try again.",
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

  if (!teacher) {
    return (
      <DashboardLayout user={user}>
        <div className="p-6">
          <div className="flex items-center mb-6">
            <Button variant="outline" size="sm" onClick={() => router.back()} className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">Teacher Not Found</h1>
          </div>
          <Card>
            <CardContent className="p-6 text-center">
              <p className="mb-4">The teacher you are looking for does not exist or has been removed.</p>
              <Button asChild>
                <Link href="/admin/teachers">Return to Teachers List</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout user={user}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button variant="outline" size="sm" onClick={() => router.back()} className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">Teacher Profile</h1>
          </div>
          <Button asChild>
            <Link href={`/admin/teachers/${teacher.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-32 w-32 mb-4">
                  <AvatarImage src={teacher.profile_image_url || "/placeholder.svg"} />
                  <AvatarFallback className="text-2xl">
                    {teacher.first_name.charAt(0)}
                    {teacher.last_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-bold">
                  {teacher.first_name} {teacher.last_name}
                </h2>
                <p className="text-gray-500 mt-1">Teacher</p>

                <div className="w-full mt-6 space-y-4">
                  <div className="flex items-center">
                    <Mail className="h-5 w-5 text-gray-500 mr-3" />
                    <span>{teacher.users?.email || "No email provided"}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="h-5 w-5 text-gray-500 mr-3" />
                    <span>{teacher.phone || "No phone provided"}</span>
                  </div>
                  {teacher.address && (
                    <div className="flex items-center">
                      <MapPin className="h-5 w-5 text-gray-500 mr-3" />
                      <span>{teacher.address}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Teacher Information</CardTitle>
              <CardDescription>View detailed information about this teacher</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="classes">
                <TabsList className="mb-4">
                  <TabsTrigger value="classes">Classes</TabsTrigger>
                  <TabsTrigger value="subjects">Subjects</TabsTrigger>
                </TabsList>

                <TabsContent value="classes">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Classes Assigned</h3>
                    {teacherClasses.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="border-b">
                              <th className="py-3 px-4 text-left">Class</th>
                              <th className="py-3 px-4 text-left">Grade</th>
                              <th className="py-3 px-4 text-left">Academic Year</th>
                              <th className="py-3 px-4 text-left">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {teacherClasses.map((classItem) => (
                              <tr key={classItem.id} className="border-b hover:bg-gray-50">
                                <td className="py-3 px-4 font-medium">{classItem.name}</td>
                                <td className="py-3 px-4">{classItem.grades?.name}</td>
                                <td className="py-3 px-4">{classItem.academic_year}</td>
                                <td className="py-3 px-4">
                                  <Button variant="outline" size="sm" asChild>
                                    <Link href={`/admin/classes/${classItem.id}`}>
                                      <Users className="h-4 w-4 mr-1" />
                                      View Students
                                    </Link>
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-gray-500">No classes assigned to this teacher.</p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="subjects">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Subjects Taught</h3>
                    {teacherSubjects.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {teacherSubjects.map((item) => (
                          <Card key={item.id} className="overflow-hidden">
                            <CardContent className="p-4 flex items-center">
                              <BookOpen className="h-10 w-10 text-primary mr-4" />
                              <div>
                                <h4 className="font-medium">{item.subjects.name}</h4>
                                <Badge variant={item.subjects.is_compulsory ? "default" : "outline"} className="mt-1">
                                  {item.subjects.is_compulsory ? "Compulsory" : "Optional"}
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No subjects assigned to this teacher.</p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
