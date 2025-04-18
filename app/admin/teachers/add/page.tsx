"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase/client"

const teacherSchema = z.object({
  firstName: z.string().min(2, { message: "First name must be at least 2 characters." }),
  lastName: z.string().min(2, { message: "Last name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  phone: z.string().min(10, { message: "Phone number must be at least 10 digits." }).optional(),
  subjects: z.array(z.string()).min(1, { message: "Please select at least one subject." }),
  grades: z.array(z.string()).min(1, { message: "Please select at least one grade." }),
  isClassTeacher: z.boolean().default(false),
  classGrade: z.string().optional(),
  className: z.string().optional(),
})

type TeacherFormValues = z.infer<typeof teacherSchema>

export default function AddTeacherPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [subjects, setSubjects] = useState<any[]>([])
  const [grades, setGrades] = useState<any[]>([])

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem("user")

    if (!storedUser) {
      router.push("/login")
      return
    }

    const parsedUser = JSON.parse(storedUser)

    // Check if user is admin
    if (parsedUser.role !== "admin") {
      router.push("/dashboard")
      return
    }

    setUser(parsedUser)
    fetchSubjectsAndGrades()
  }, [router])

  const fetchSubjectsAndGrades = async () => {
    try {
      // Fetch subjects
      const { data: subjectsData, error: subjectsError } = await supabase.from("subjects").select("*").order("name")

      if (subjectsError) throw subjectsError

      // Fetch grades
      const { data: gradesData, error: gradesError } = await supabase.from("grades").select("*").order("id")

      if (gradesError) throw gradesError

      setSubjects(subjectsData || [])
      setGrades(gradesData || [])
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to load subjects and grades. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const form = useForm<TeacherFormValues>({
    resolver: zodResolver(teacherSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      subjects: [],
      grades: [],
      isClassTeacher: false,
      classGrade: "",
      className: "",
    },
  })

  const isClassTeacher = form.watch("isClassTeacher")
  const selectedGrades = form.watch("grades")

  const onSubmit = async (data: TeacherFormValues) => {
    setIsSubmitting(true)

    try {
      // 1. Create a user in the users table
      const { data: userData, error: userError } = await supabase
        .from("users")
        .insert({
          email: data.email,
          password_hash: `${data.lastName.toLowerCase()}123`, // Default password (in a real app, this would be hashed)
          role_id: 2, // Teacher role
        })
        .select()

      if (userError) throw userError

      // 2. Create a teacher record
      const { data: teacherData, error: teacherError } = await supabase
        .from("teachers")
        .insert({
          user_id: userData[0].id,
          first_name: data.firstName,
          last_name: data.lastName,
          phone: data.phone || null,
        })
        .select()

      if (teacherError) throw teacherError

      // 3. Link the teacher to subjects
      const teacherId = teacherData[0].id

      // Create teacher-subject relationships
      const teacherSubjects = data.subjects.map((subjectId) => ({
        teacher_id: teacherId,
        subject_id: Number.parseInt(subjectId),
      }))

      const { error: subjectsError } = await supabase.from("teacher_subjects").insert(teacherSubjects)

      if (subjectsError) throw subjectsError

      // 4. If class teacher, assign to class
      if (data.isClassTeacher && data.classGrade && data.className) {
        const { error: classError } = await supabase.from("classes").insert({
          name: data.className,
          grade_id: Number.parseInt(data.classGrade),
          teacher_id: teacherId,
          academic_year: new Date().getFullYear(),
        })

        if (classError) throw classError
      }

      // 5. Create a notification
      await supabase.from("notifications").insert({
        user_id: null, // System notification
        title: "New Teacher Added",
        message: `${data.firstName} ${data.lastName} has been added as a teacher.`,
        notification_type: "teacher",
      })

      toast({
        title: "Teacher Added",
        description: `${data.firstName} ${data.lastName} has been added as a teacher.`,
      })

      // Redirect to teachers list
      router.push("/admin/teachers")
    } catch (error) {
      console.error("Error adding teacher:", error)
      toast({
        title: "Error",
        description: "There was an error adding the teacher. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
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
          <Link href="/admin/teachers">
            <Button variant="outline" size="sm" className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Teachers
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Add New Teacher</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Teacher Information</CardTitle>
            <CardDescription>Add a new teacher to the system</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="firstName"
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
                    name="lastName"
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Enter email address" {...field} />
                        </FormControl>
                        <FormDescription>This will be used as the login username for the teacher.</FormDescription>
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
                </div>

                <FormField
                  control={form.control}
                  name="subjects"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel>Subjects</FormLabel>
                        <FormDescription>Select the subjects this teacher will teach.</FormDescription>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {subjects.map((subject) => (
                          <FormField
                            key={subject.id}
                            control={form.control}
                            name="subjects"
                            render={({ field }) => {
                              return (
                                <FormItem key={subject.id} className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(subject.id.toString())}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, subject.id.toString()])
                                          : field.onChange(
                                              field.value?.filter((value) => value !== subject.id.toString()),
                                            )
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal">{subject.name}</FormLabel>
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

                <FormField
                  control={form.control}
                  name="grades"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel>Grades</FormLabel>
                        <FormDescription>Select the grades this teacher will teach.</FormDescription>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                        {grades.map((grade) => (
                          <FormField
                            key={grade.id}
                            control={form.control}
                            name="grades"
                            render={({ field }) => {
                              return (
                                <FormItem key={grade.id} className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(grade.id.toString())}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, grade.id.toString()])
                                          : field.onChange(
                                              field.value?.filter((value) => value !== grade.id.toString()),
                                            )
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal">{grade.name}</FormLabel>
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

                <FormField
                  control={form.control}
                  name="isClassTeacher"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Assign as Class Teacher</FormLabel>
                        <FormDescription>
                          Class teachers are responsible for a specific class and its students.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                {isClassTeacher && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="classGrade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Class Grade</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select grade" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {selectedGrades.map((gradeId) => {
                                const grade = grades.find((g) => g.id.toString() === gradeId)
                                return (
                                  <SelectItem key={gradeId} value={gradeId}>
                                    {grade?.name}
                                  </SelectItem>
                                )
                              })}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="className"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Class Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. 8A, 9B, etc." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding Teacher...
                    </>
                  ) : (
                    "Add Teacher"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
