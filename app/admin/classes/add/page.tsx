"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Save } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"

const classSchema = z.object({
  name: z.string().min(1, { message: "Please enter a class name" }),
  grade_id: z.string().min(1, { message: "Please select a grade" }),
  teacher_id: z.string().min(1, { message: "Please select a class teacher" }),
  academic_year: z.string().min(1, { message: "Please enter the academic year" }),
})

export default function AddClassPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [grades, setGrades] = useState<any[]>([])
  const [teachers, setTeachers] = useState<any[]>([])

  const form = useForm<z.infer<typeof classSchema>>({
    resolver: zodResolver(classSchema),
    defaultValues: {
      name: "",
      grade_id: "",
      teacher_id: "",
      academic_year: new Date().getFullYear().toString(),
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

    // Check if user is admin
    if (parsedUser.role !== "admin" && parsedUser.role !== "principal") {
      router.push("/dashboard")
      return
    }

    setUser(parsedUser)
    fetchData()
  }, [router])

  const fetchData = async () => {
    try {
      // Fetch grades
      const { data: gradesData, error: gradesError } = await supabase.from("grades").select("*").order("name")

      if (gradesError) throw gradesError

      // Fetch teachers
      const { data: teachersData, error: teachersError } = await supabase
        .from("teachers")
        .select("*")
        .order("last_name", { ascending: true })

      if (teachersError) throw teachersError

      setGrades(gradesData || [])
      setTeachers(teachersData || [])
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to load data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (data: z.infer<typeof classSchema>) => {
    setIsSaving(true)
    try {
      // Check if class already exists
      const { count, error: checkError } = await supabase
        .from("classes")
        .select("*", { count: "exact", head: true })
        .eq("name", data.name)
        .eq("grade_id", data.grade_id)
        .eq("academic_year", data.academic_year)

      if (checkError) throw checkError

      if (count && count > 0) {
        toast({
          title: "Class Already Exists",
          description: "A class with this name already exists for the selected grade and academic year.",
          variant: "destructive",
        })
        setIsSaving(false)
        return
      }

      // Create new class
      const { error: insertError } = await supabase.from("classes").insert({
        name: data.name,
        grade_id: Number.parseInt(data.grade_id),
        teacher_id: Number.parseInt(data.teacher_id),
        academic_year: Number.parseInt(data.academic_year),
      })

      if (insertError) throw insertError

      // Create notification
      const selectedGrade = grades.find((g) => g.id.toString() === data.grade_id)
      const selectedTeacher = teachers.find((t) => t.id.toString() === data.teacher_id)
      const gradeName = selectedGrade ? selectedGrade.name : "a grade"
      const teacherName = selectedTeacher ? `${selectedTeacher.first_name} ${selectedTeacher.last_name}` : "a teacher"

      await supabase.from("notifications").insert({
        title: "New Class Created",
        message: `A new class ${data.name} has been created for ${gradeName} with ${teacherName} as the class teacher.`,
        notification_type: "class",
        is_read: false,
      })

      toast({
        title: "Success",
        description: "Class has been created successfully.",
      })

      router.push("/admin/classes")
    } catch (error) {
      console.error("Error creating class:", error)
      toast({
        title: "Error",
        description: "Failed to create class. Please try again.",
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Add New Class</h1>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Card>
              <CardHeader>
                <CardTitle>Class Details</CardTitle>
                <CardDescription>Enter the details for the new class</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Class Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. A, B, C, etc." {...field} />
                      </FormControl>
                      <FormDescription>Enter a unique identifier for this class</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="grade_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grade</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a grade" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {grades.map((grade) => (
                            <SelectItem key={grade.id} value={grade.id.toString()}>
                              {grade.name}
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
                  name="teacher_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Class Teacher</FormLabel>
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

                <FormField
                  control={form.control}
                  name="academic_year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Academic Year</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
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
                Create Class
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </DashboardLayout>
  )
}
