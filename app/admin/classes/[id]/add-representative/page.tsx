"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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

const representativeSchema = z.object({
  student_id: z.string().min(1, { message: "Please select a student" }),
  role: z.string().min(1, { message: "Please select a role" }),
})

const representativeRoles = [
  { id: "class_monitor", name: "Class Monitor" },
  { id: "assistant_monitor", name: "Assistant Monitor" },
  { id: "time_keeper", name: "Time Keeper" },
  { id: "health_prefect", name: "Health Prefect" },
  { id: 'sports_pref  name: "Time Keeper' },
  { id: "health_prefect", name: "Health Prefect" },
  { id: "sports_prefect", name: "Sports Prefect" },
  { id: "library_prefect", name: "Library Prefect" },
  { id: "environment_prefect", name: "Environment Prefect" },
]

export default function AddRepresentativePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [classData, setClassData] = useState<any>(null)
  const [students, setStudents] = useState<any[]>([])
  const [existingRoles, setExistingRoles] = useState<string[]>([])

  const form = useForm<z.infer<typeof representativeSchema>>({
    resolver: zodResolver(representativeSchema),
    defaultValues: {
      student_id: "",
      role: "",
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

      // Fetch students in this class
      const { data: studentsData, error: studentsError } = await supabase
        .from("student_classes")
        .select(`
          *,
          students(
            id, student_id, first_name, last_name
          )
        `)
        .eq("class_id", classId)
        .eq("academic_year", classDetails.academic_year)

      if (studentsError) throw studentsError

      const studentsList = studentsData.map((sc) => ({
        id: sc.students.id,
        student_id: sc.students.student_id,
        name: `${sc.students.first_name} ${sc.students.last_name}`,
      }))

      setStudents(studentsList || [])

      // Fetch existing representatives
      const { data: existingReps, error: existingRepsError } = await supabase
        .from("class_representatives")
        .select("role")
        .eq("class_id", classId)

      if (existingRepsError && existingRepsError.code !== "PGSQL_ERROR") throw existingRepsError

      setExistingRoles(existingReps?.map((rep) => rep.role) || [])
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

  const onSubmit = async (data: z.infer<typeof representativeSchema>) => {
    setIsSaving(true)
    try {
      const classId = params.id

      // Check if role already exists
      if (existingRoles.includes(data.role)) {
        // Update existing representative
        const { error: updateError } = await supabase
          .from("class_representatives")
          .update({
            student_id: Number(data.student_id),
            updated_at: new Date().toISOString(),
          })
          .eq("class_id", classId)
          .eq("role", data.role)

        if (updateError) throw updateError
      } else {
        // Create new representative
        const { error: insertError } = await supabase.from("class_representatives").insert({
          class_id: Number(classId),
          student_id: Number(data.student_id),
          role: data.role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

        if (insertError) throw insertError
      }

      // Get student name
      const selectedStudent = students.find((s) => s.id.toString() === data.student_id)
      const studentName = selectedStudent ? selectedStudent.name : "A student"

      // Get role name
      const roleName = representativeRoles.find((r) => r.id === data.role)?.name || data.role

      // Create notification
      await supabase.from("notifications").insert({
        title: "Class Representative Assigned",
        message: `${studentName} has been assigned as ${roleName} for ${classData.grades.name} ${classData.name}.`,
        notification_type: "class",
        is_read: false,
        created_at: new Date().toISOString(),
      })

      toast({
        title: "Success",
        description: "Class representative has been assigned successfully.",
      })

      router.push(`/admin/classes/${classId}`)
    } catch (error) {
      console.error("Error assigning representative:", error)
      toast({
        title: "Error",
        description: "Failed to assign representative. Please try again.",
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
          <h1 className="text-2xl font-bold">Add Class Representative</h1>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Class Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <p className="text-sm font-medium text-gray-500">Class</p>
              <p className="font-medium">
                {classData?.grades?.name} {classData?.name}
              </p>
            </div>
          </CardContent>
        </Card>

        {students.length > 0 ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <Card>
                <CardHeader>
                  <CardTitle>Assign Representative</CardTitle>
                  <CardDescription>Select a student and role</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {representativeRoles.map((role) => (
                              <SelectItem key={role.id} value={role.id} disabled={existingRoles.includes(role.id)}>
                                {role.name} {existingRoles.includes(role.id) ? "(Already Assigned)" : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="student_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Student</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a student" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {students.map((student) => (
                              <SelectItem key={student.id} value={student.id.toString()}>
                                {student.name} ({student.student_id})
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
                  Assign Representative
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="mb-4 text-gray-500">No students are enrolled in this class.</p>
                <Button asChild>
                  <Link href={`/admin/classes/${params.id}/add-student`}>Add Students to Class</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
