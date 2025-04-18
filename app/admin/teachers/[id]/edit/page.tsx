"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Save, ArrowLeft } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Form validation schema
const teacherSchema = z.object({
  first_name: z.string().min(2, { message: "First name must be at least 2 characters." }),
  last_name: z.string().min(2, { message: "Last name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  phone: z.string().optional(),
  address: z.string().optional(),
  profile_image_url: z.string().optional(),
  subjects: z.array(z.string()).optional(),
  assigned_class_id: z.string().optional(),
})

export default function EditTeacherPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [subjects, setSubjects] = useState<any[]>([])
  const [teacherData, setTeacherData] = useState<any>(null)
  const [classes, setClasses] = useState<any[]>([])

  const form = useForm<z.infer<typeof teacherSchema>>({
    resolver: zodResolver(teacherSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      address: "",
      profile_image_url: "",
      subjects: [],
      assigned_class_id: "",
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
  }, [router, params])

  const fetchData = async () => {
    try {
      const teacherId = params.id

      // Fetch teacher details
      const { data: teacher, error: teacherError } = await supabase
        .from("teachers")
        .select(`
          *,
          users(email)
        `)
        .eq("id", teacherId)
        .single()

      if (teacherError) throw teacherError

      setTeacherData(teacher)

      // Fetch all subjects
      const { data: subjectsData, error: subjectsError } = await supabase
        .from("subjects")
        .select("*")
        .order("name", { ascending: true })

      if (subjectsError) throw subjectsError

      // Fetch teacher's subjects
      const { data: teacherSubjectsData, error: teacherSubjectsError } = await supabase
        .from("teacher_subjects")
        .select("subject_id")
        .eq("teacher_id", teacherId)

      if (teacherSubjectsError) throw teacherSubjectsError

      const subjectIds = teacherSubjectsData?.map((item) => item.subject_id.toString()) || []

      // Fetch classes
      const { data: classesData, error: classesError } = await supabase
        .from("classes")
        .select(`
          id,
          name,
          grade_id,
          grades(name)
        `)
        .order("grade_id", { ascending: true })
        .order("name", { ascending: true })

      if (classesError) throw classesError
      setClasses(classesData || [])

      // Get the teacher's assigned class
      const { data: teacherClassData, error: teacherClassError } = await supabase
        .from("classes")
        .select("id")
        .eq("teacher_id", teacherId)
        .single()

      // Set form values
      form.reset({
        first_name: teacher.first_name,
        last_name: teacher.last_name,
        email: teacher.users?.email || "",
        phone: teacher.phone || "",
        address: teacher.address || "",
        profile_image_url: teacher.profile_image_url || "",
        subjects: subjectIds,
        assigned_class_id: teacherClassData?.id?.toString() || "",
      })

      setSubjects(subjectsData || [])
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to load teacher data. Please try again.",
        variant: "destructive",
      })
      router.push("/admin/teachers")
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (data: z.infer<typeof teacherSchema>) => {
    setIsSaving(true)
    try {
      const teacherId = params.id

      // Update teacher information
      const { error: updateTeacherError } = await supabase
        .from("teachers")
        .update({
          first_name: data.first_name,
          last_name: data.last_name,
          phone: data.phone || null,
          address: data.address || null,
          profile_image_url: data.profile_image_url || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", teacherId)

      if (updateTeacherError) throw updateTeacherError

      // Update user email if it has changed
      if (teacherData && teacherData.users && teacherData.users.email !== data.email) {
        const { error: updateUserError } = await supabase
          .from("users")
          .update({
            email: data.email,
            updated_at: new Date().toISOString(),
          })
          .eq("id", teacherData.user_id)

        if (updateUserError) throw updateUserError
      }

      // Update teacher subjects
      // First, remove all existing subject associations
      const { error: deleteSubjectsError } = await supabase
        .from("teacher_subjects")
        .delete()
        .eq("teacher_id", teacherId)

      if (deleteSubjectsError) throw deleteSubjectsError

      // Then add the new subject associations
      if (data.subjects && data.subjects.length > 0) {
        const subjectInserts = data.subjects.map((subjectId) => ({
          teacher_id: Number(teacherId),
          subject_id: Number(subjectId),
        }))

        const { error: insertSubjectsError } = await supabase.from("teacher_subjects").insert(subjectInserts)

        if (insertSubjectsError) throw insertSubjectsError
      }

      // Update class assignment
      if (data.assigned_class_id && data.assigned_class_id !== "none") {
        // First, remove teacher from any existing class
        const { error: updateClassError1 } = await supabase
          .from("classes")
          .update({ teacher_id: null })
          .eq("teacher_id", teacherId)

        if (updateClassError1) throw updateClassError1

        // Then assign to the new class
        const { error: updateClassError2 } = await supabase
          .from("classes")
          .update({ teacher_id: Number(teacherId) })
          .eq("id", data.assigned_class_id)

        if (updateClassError2) throw updateClassError2
      } else {
        // Remove teacher from any existing class
        const { error: updateClassError } = await supabase
          .from("classes")
          .update({ teacher_id: null })
          .eq("teacher_id", teacherId)

        if (updateClassError) throw updateClassError
      }

      // Create notification
      await supabase.from("notifications").insert({
        title: "Teacher Information Updated",
        message: `${data.first_name} ${data.last_name}'s information has been updated.`,
        notification_type: "teacher",
        is_read: false,
      })

      toast({
        title: "Success",
        description: "Teacher information has been updated successfully.",
      })

      router.push(`/admin/teachers/${teacherId}`)
    } catch (error) {
      console.error("Error updating teacher:", error)
      toast({
        title: "Error",
        description: "Failed to update teacher information. Please try again.",
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
          <h1 className="text-2xl font-bold">Edit Teacher</h1>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Edit the teacher's personal information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="first_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter first name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="last_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter last name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Enter email address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="profile_image_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profile Image URL (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter profile image URL" {...field} />
                      </FormControl>
                      <FormDescription>Enter a URL for the teacher's profile image</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="assigned_class_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assigned Class (Class Teacher)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "none"}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a class" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {classes.map((classItem) => (
                            <SelectItem key={classItem.id} value={classItem.id.toString()}>
                              {classItem.grades?.name} {classItem.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>Assign this teacher as the main class teacher</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Subjects</CardTitle>
                <CardDescription>Select the subjects this teacher can teach</CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="subjects"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel className="text-base">Assigned Subjects</FormLabel>
                        <FormDescription>Select the subjects that this teacher is qualified to teach</FormDescription>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {subjects.map((subject) => (
                          <FormField
                            key={subject.id}
                            control={form.control}
                            name="subjects"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={subject.id}
                                  className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(subject.id.toString())}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...(field.value || []), subject.id.toString()])
                                          : field.onChange(
                                              field.value?.filter((value) => value !== subject.id.toString()),
                                            )
                                      }}
                                    />
                                  </FormControl>
                                  <div className="space-y-1 leading-none">
                                    <FormLabel className="text-sm font-medium">{subject.name}</FormLabel>
                                    {subject.is_compulsory && (
                                      <p className="text-xs text-muted-foreground">Compulsory</p>
                                    )}
                                  </div>
                                </FormItem>
                              )
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </DashboardLayout>
  )
}
