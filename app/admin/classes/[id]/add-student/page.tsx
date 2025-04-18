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
import { Form } from "@/components/ui/form"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, ArrowLeft, Plus } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"

const addStudentSchema = z.object({
  student_ids: z.array(z.string()).min(1, { message: "Please select at least one student" }),
})

export default function AddStudentToClassPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [classData, setClassData] = useState<any>(null)
  const [availableStudents, setAvailableStudents] = useState<any[]>([])
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])

  const form = useForm<z.infer<typeof addStudentSchema>>({
    resolver: zodResolver(addStudentSchema),
    defaultValues: {
      student_ids: [],
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

      // Get students already in this class
      const { data: existingStudents, error: existingStudentsError } = await supabase
        .from("student_classes")
        .select("student_id")
        .eq("class_id", classId)
        .eq("academic_year", classDetails.academic_year)

      if (existingStudentsError) throw existingStudentsError

      const existingStudentIds = existingStudents.map((s) => s.student_id)

      // Fetch all students not already in this class
      const { data: students, error: studentsError } = await supabase
        .from("students")
        .select("*")
        .not("id", "in", `(${existingStudentIds.join(",")})`)
        .order("last_name", { ascending: true })

      if (studentsError) throw studentsError

      setAvailableStudents(students || [])
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

  const toggleStudent = (studentId: string) => {
    setSelectedStudents((prev) => {
      if (prev.includes(studentId)) {
        return prev.filter((id) => id !== studentId)
      } else {
        return [...prev, studentId]
      }
    })
  }

  useEffect(() => {
    form.setValue("student_ids", selectedStudents)
  }, [selectedStudents, form])

  const onSubmit = async (data: z.infer<typeof addStudentSchema>) => {
    if (data.student_ids.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one student.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      const classId = params.id

      // Prepare student class assignments
      const studentClassAssignments = data.student_ids.map((studentId) => ({
        student_id: Number(studentId),
        class_id: Number(classId),
        grade_id: classData.grade_id,
        academic_year: classData.academic_year,
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }))

      // Insert student class assignments
      const { error: insertError } = await supabase.from("student_classes").insert(studentClassAssignments)

      if (insertError) throw insertError

      // Create notification
      await supabase.from("notifications").insert({
        title: "Students Added to Class",
        message: `${data.student_ids.length} student(s) have been added to ${classData.grades.name} ${classData.name}.`,
        notification_type: "class",
        is_read: false,
        created_at: new Date().toISOString(),
      })

      toast({
        title: "Success",
        description: `${data.student_ids.length} student(s) have been added to the class.`,
      })

      router.push(`/admin/classes/${classId}`)
    } catch (error) {
      console.error("Error adding students:", error)
      toast({
        title: "Error",
        description: "Failed to add students to class. Please try again.",
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
          <h1 className="text-2xl font-bold">Add Students to Class</h1>
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

        {availableStudents.length > 0 ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Available Students</CardTitle>
                      <CardDescription>Select students to add to this class</CardDescription>
                    </div>
                    <div className="flex items-center">
                      <span className="mr-2 text-sm font-medium">
                        Selected: {selectedStudents.length} / {availableStudents.length}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (selectedStudents.length === availableStudents.length) {
                            setSelectedStudents([])
                          } else {
                            setSelectedStudents(availableStudents.map((s) => s.id.toString()))
                          }
                        }}
                      >
                        {selectedStudents.length === availableStudents.length ? "Deselect All" : "Select All"}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="py-3 px-4 text-left w-16">Select</th>
                          <th className="py-3 px-4 text-left">Student ID</th>
                          <th className="py-3 px-4 text-left">Name</th>
                          <th className="py-3 px-4 text-left">Gender</th>
                        </tr>
                      </thead>
                      <tbody>
                        {availableStudents.map((student) => (
                          <tr key={student.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <Checkbox
                                checked={selectedStudents.includes(student.id.toString())}
                                onCheckedChange={() => toggleStudent(student.id.toString())}
                              />
                            </td>
                            <td className="py-3 px-4">{student.student_id}</td>
                            <td className="py-3 px-4">
                              {student.first_name} {student.last_name}
                            </td>
                            <td className="py-3 px-4 capitalize">{student.gender}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <div className="mt-6 flex justify-between">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving || selectedStudents.length === 0}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                  Add {selectedStudents.length} Student{selectedStudents.length !== 1 ? "s" : ""} to Class
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="mb-4 text-gray-500">No available students found.</p>
                <Button asChild>
                  <Link href="/admin/students/add">Add New Student</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
