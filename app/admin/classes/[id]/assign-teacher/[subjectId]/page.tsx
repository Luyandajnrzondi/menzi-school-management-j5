"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Save, ArrowLeft } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"

const assignTeacherSchema = z.object({
  teacher_id: z.string().min(1, { message: "Please select a teacher" }),
})

export default function AssignTeacherPage({ params }: { params: { id: string; subjectId: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [classData, setClassData] = useState<any>(null)
  const [subject, setSubject] = useState<any>(null)
  const [teachers, setTeachers] = useState<any[]>([])
  const [currentTeacher, setCurrentTeacher] = useState<any>(null)

  const form = useForm<z.infer<typeof assignTeacherSchema>>({
    resolver: zodResolver(assignTeacherSchema),
    defaultValues: {
      teacher_id: "",
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

    // Check if user is admin or principal
    if (parsedUser.role !== "admin" && parsedUser.role !== "principal") {
      router.push("/dashboard")
      return
    }

    setUser(parsedUser)
    fetchData()
  }, [router, params])

  const fetchData = async () => {
    try {
      const classId = params.id
      const subjectId = params.subjectId

      // Fetch class details
      const { data: classDetails, error: classError } = await supabase
        .from("classes")
        .select(`
          *,
          grades(id, name)
        `)
        .eq("id", classId)
        .single()

      if (classError) throw classError

      setClassData(classDetails)

      // Fetch subject details
      const { data: subjectDetails, error: subjectError } = await supabase
        .from("subjects")
        .select("*")
        .eq("id", subjectId)
        .single()

      if (subjectError) throw subjectError

      setSubject(subjectDetails)

      // Fetch teachers who can teach this subject
      const { data: teacherSubjects, error: teacherSubjectsError } = await supabase
        .from("teacher_subjects")
        .select(`
          teacher_id,
          teachers(
            id,
            first_name,
            last_name
          )
        `)
        .eq("subject_id", subjectId)

      if (teacherSubjectsError) throw teacherSubjectsError

      const teachersList = teacherSubjects.map((ts) => ({
        id: ts.teacher_id,
        first_name: ts.teachers.first_name,
        last_name: ts.teachers.last_name,
      }))

      setTeachers(teachersList || [])

      // Check if there's already a teacher assigned
      const { data: existingAssignment, error: existingAssignmentError } = await supabase
        .from("class_subject_teachers")
        .select(`
          id,
          teacher_id,
          teachers(id, first_name, last_name)
        `)
        .eq("class_id", classId)
        .eq("subject_id", subjectId)
        .single()

      if (existingAssignment) {
        setCurrentTeacher(existingAssignment.teachers)
        form.setValue("teacher_id", existingAssignment.teacher_id.toString())
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to load data. Please try again.",
        variant: "destructive",
      })
      router.push(`/admin/classes/${params.id}`)
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (data: z.infer<typeof assignTeacherSchema>) => {
    setIsSaving(true)
    try {
      const classId = params.id
      const subjectId = params.subjectId

      // Check if there's already a teacher assigned
      const { data: existingAssignment, error: existingAssignmentError } = await supabase
        .from("class_subject_teachers")
        .select("id")
        .eq("class_id", classId)
        .eq("subject_id", subjectId)
        .single()

      if (existingAssignment) {
        // Update existing assignment
        const { error: updateError } = await supabase
          .from("class_subject_teachers")
          .update({
            teacher_id: Number(data.teacher_id),
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingAssignment.id)

        if (updateError) throw updateError
      } else {
        // Create new assignment
        const { error: insertError } = await supabase.from("class_subject_teachers").insert({
          class_id: Number(classId),
          subject_id: Number(subjectId),
          teacher_id: Number(data.teacher_id),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

        if (insertError) throw insertError
      }

      // Get teacher name
      const selectedTeacher = teachers.find((t) => t.id.toString() === data.teacher_id)
      const teacherName = selectedTeacher ? `${selectedTeacher.first_name} ${selectedTeacher.last_name}` : "A teacher"

      // Create notification
      await supabase.from("notifications").insert({
        title: "Subject Teacher Assigned",
        message: `${teacherName} has been assigned to teach ${subject.name} for ${classData.grades.name} ${classData.name}.`,
        notification_type: "class",
        is_read: false,
        created_at: new Date().toISOString(),
      })

      toast({
        title: "Success",
        description: "Teacher has been assigned successfully.",
      })

      router.push(`/admin/classes/${classId}`)
    } catch (error) {
      console.error("Error assigning teacher:", error)
      toast({
        title: "Error",
        description: "Failed to assign teacher. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
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
        <div className="flex items-center mb-6">
          <Button variant="outline" size="sm" onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Assign Teacher for {subject?.name}</h1>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Class Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Class</p>
                <p className="font-medium">
                  {classData?.grades?.name} {classData?.name}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Subject</p>
                <p className="font-medium">{subject?.name}</p>
              </div>
              {currentTeacher && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Current Teacher</p>
                  <p className="font-medium">
                    {currentTeacher.first_name} {currentTeacher.last_name}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {teachers.length > 0 ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <Card>
                <CardHeader>
                  <CardTitle>Assign Teacher</CardTitle>
                  <CardDescription>Select a teacher to teach this subject</CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="teacher_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teacher</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a teacher" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {teachers.map((teacher) => (
                              <SelectItem key={teacher.id} value={teacher.id.toString()}>
                                {teacher.first_name} {teacher.last_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <div className="mt-6 flex justify-end">
                <Button type="button" variant="outline" className="mr-2" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {currentTeacher ? "Update Teacher" : "Assign Teacher"}
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="mb-4 text-gray-500">No teachers are qualified to teach this subject.</p>
                <Button asChild>
                  <Link href={`/admin/teachers/add`}>Add New Teacher</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
