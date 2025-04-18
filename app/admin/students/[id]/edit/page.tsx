"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Save, ArrowLeft } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const studentSchema = z.object({
  first_name: z.string().min(2, { message: "First name must be at least 2 characters" }),
  last_name: z.string().min(2, { message: "Last name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  gender: z.string().min(1, { message: "Please select a gender" }),
  date_of_birth: z.string().min(1, { message: "Please enter date of birth" }),
  address: z.string().optional(),
  parent_name: z.string().min(2, { message: "Parent name must be at least 2 characters" }),
  parent_phone: z.string().min(5, { message: "Please enter a valid phone number" }),
  parent_email: z.string().email({ message: "Please enter a valid email address" }),
  class_id: z.string().optional(),
  profile_image_url: z.string().optional(),
})

export default function EditStudentPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [classes, setClasses] = useState<any[]>([])
  const [studentData, setStudentData] = useState<any>(null)
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)

  const form = useForm<z.infer<typeof studentSchema>>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      gender: "",
      date_of_birth: "",
      address: "",
      parent_name: "",
      parent_phone: "",
      parent_email: "",
      class_id: "",
      profile_image_url: "",
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
      const studentId = params.id

      // Fetch student details
      const { data: student, error: studentError } = await supabase
        .from("students")
        .select(`
          *,
          users(email),
          student_classes(
            id,
            class_id,
            classes(
              id,
              name,
              grades(id, name)
            )
          )
        `)
        .eq("id", studentId)
        .single()

      if (studentError) throw studentError

      setStudentData(student)
      setImagePreview(student.profile_image_url || null)

      // Fetch classes
      const { data: classesData, error: classesError } = await supabase
        .from("classes")
        .select(`
          id,
          name,
          academic_year,
          grades(id, name)
        `)
        .order("academic_year", { ascending: false })
        .order("name", { ascending: true })

      if (classesError) throw classesError

      setClasses(classesData || [])

      // Get current class
      let currentClassId = ""
      if (student.student_classes && student.student_classes.length > 0) {
        // Sort by most recent academic year
        const sortedClasses = [...student.student_classes].sort((a, b) => {
          if (!a.classes || !b.classes) return 0
          return b.classes.academic_year - a.classes.academic_year
        })

        if (sortedClasses[0].classes) {
          currentClassId = sortedClasses[0].class_id.toString()
        }
      }

      // Set form values
      form.reset({
        first_name: student.first_name,
        last_name: student.last_name,
        email: student.users?.email || "",
        gender: student.gender,
        date_of_birth: student.date_of_birth ? new Date(student.date_of_birth).toISOString().split("T")[0] : "",
        address: student.address || "",
        parent_name: student.parent_name || "",
        parent_phone: student.parent_phone || "",
        parent_email: student.parent_email || "",
        class_id: currentClassId,
        profile_image_url: student.profile_image_url || "",
      })
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to load student data. Please try again.",
        variant: "destructive",
      })
      router.push("/admin/students")
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setFileError(null)

    if (!file) {
      setProfileImage(null)
      setImagePreview(studentData?.profile_image_url || null)
      return
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      setFileError("Please upload an image file.")
      setProfileImage(null)
      return
    }

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setFileError("Image size should not exceed 2MB.")
      setProfileImage(null)
      return
    }

    setProfileImage(file)

    // Create a preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const onSubmit = async (data: z.infer<typeof studentSchema>) => {
    setIsSaving(true)
    try {
      const studentId = params.id

      // Upload profile image if selected
      let profileImageUrl = data.profile_image_url

      if (profileImage) {
        const timestamp = Date.now()
        const fileExt = profileImage.name.split(".").pop()
        const fileName = `${data.last_name.toLowerCase()}_${data.first_name.toLowerCase()}_${timestamp}.${fileExt}`
        const filePath = `profile_images/${fileName}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("images")
          .upload(filePath, profileImage)

        if (uploadError) throw uploadError

        // Get the public URL for the uploaded file
        const { data: urlData } = supabase.storage.from("images").getPublicUrl(filePath)

        profileImageUrl = urlData.publicUrl
      }

      // Update student information
      const { error: updateStudentError } = await supabase
        .from("students")
        .update({
          first_name: data.first_name,
          last_name: data.last_name,
          gender: data.gender,
          date_of_birth: data.date_of_birth,
          address: data.address || null,
          parent_name: data.parent_name,
          parent_phone: data.parent_phone,
          parent_email: data.parent_email,
          profile_image_url: profileImageUrl || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", studentId)

      if (updateStudentError) throw updateStudentError

      // Update user email if it has changed
      if (studentData && studentData.users && studentData.users.email !== data.email) {
        const { error: updateUserError } = await supabase
          .from("users")
          .update({
            email: data.email,
            updated_at: new Date().toISOString(),
          })
          .eq("id", studentData.user_id)

        if (updateUserError) throw updateUserError
      }

      // Update class assignment if changed
      if (data.class_id) {
        // Check if student is already in this class
        const isAlreadyInClass = studentData.student_classes?.some(
          (sc: any) => sc.class_id.toString() === data.class_id,
        )

        if (!isAlreadyInClass) {
          // Get class details
          const selectedClass = classes.find((c) => c.id.toString() === data.class_id)

          // Add student to new class
          const { error: classAssignmentError } = await supabase.from("student_classes").insert({
            student_id: Number(studentId),
            class_id: Number(data.class_id),
            grade_id: selectedClass.grades.id,
            academic_year: selectedClass.academic_year,
            status: "active",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

          if (classAssignmentError) throw classAssignmentError
        }
      }

      toast({
        title: "Success",
        description: "Student information has been updated successfully.",
      })

      router.push(`/admin/students/${studentId}`)
    } catch (error) {
      console.error("Error updating student:", error)
      toast({
        title: "Error",
        description: "Failed to update student information. Please try again.",
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
          <h1 className="text-2xl font-bold">Edit Student</h1>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="personal">
              <TabsList className="mb-4">
                <TabsTrigger value="personal">Personal Information</TabsTrigger>
                <TabsTrigger value="parent">Parent/Guardian</TabsTrigger>
                <TabsTrigger value="class">Class Assignment</TabsTrigger>
              </TabsList>

              <TabsContent value="personal">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="md:col-span-1">
                    <CardHeader>
                      <CardTitle>Profile Picture</CardTitle>
                      <CardDescription>Upload a profile picture for the student</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center">
                      <Avatar className="h-32 w-32 mb-4">
                        <AvatarImage src={imagePreview || "/placeholder.svg"} />
                        <AvatarFallback className="text-2xl">
                          {studentData?.first_name.charAt(0)}
                          {studentData?.last_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="w-full">
                        <Input id="profile-image" type="file" accept="image/*" onChange={handleImageChange} />
                        {fileError && <p className="text-sm font-medium text-destructive mt-1">{fileError}</p>}
                        <p className="text-xs text-muted-foreground mt-2">Recommended: Square image, max 2MB</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle>Personal Information</CardTitle>
                      <CardDescription>Edit the student's personal details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          name="gender"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Gender</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select gender" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="male">Male</SelectItem>
                                  <SelectItem value="female">Female</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="date_of_birth"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Date of Birth</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="student_id"
                          render={() => (
                            <FormItem>
                              <FormLabel>Student ID</FormLabel>
                              <FormControl>
                                <Input value={studentData?.student_id || ""} disabled />
                              </FormControl>
                              <FormDescription>Student ID cannot be changed</FormDescription>
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Enter address" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="parent">
                <Card>
                  <CardHeader>
                    <CardTitle>Parent/Guardian Information</CardTitle>
                    <CardDescription>Edit the parent or guardian details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="parent_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Parent/Guardian Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter parent/guardian name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="parent_phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Parent/Guardian Phone</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter phone number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="parent_email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Parent/Guardian Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="Enter email address" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="class">
                <Card>
                  <CardHeader>
                    <CardTitle>Class Assignment</CardTitle>
                    <CardDescription>Assign the student to a class</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="class_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Class</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a class" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">Not Assigned</SelectItem>
                              {classes.map((classItem) => (
                                <SelectItem key={classItem.id} value={classItem.id.toString()}>
                                  {classItem.grades.name} {classItem.name} ({classItem.academic_year})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Changing the class will add the student to the new class while maintaining their history
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {studentData?.student_classes && studentData.student_classes.length > 0 && (
                      <div className="mt-6">
                        <h3 className="text-sm font-medium mb-2">Class History</h3>
                        <div className="border rounded-md overflow-hidden">
                          <table className="w-full">
                            <thead className="bg-muted">
                              <tr>
                                <th className="py-2 px-4 text-left text-xs font-medium">Class</th>
                                <th className="py-2 px-4 text-left text-xs font-medium">Academic Year</th>
                                <th className="py-2 px-4 text-left text-xs font-medium">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {studentData.student_classes
                                .sort((a: any, b: any) => b.academic_year - a.academic_year)
                                .map((sc: any) => (
                                  <tr key={sc.id} className="border-t">
                                    <td className="py-2 px-4 text-sm">
                                      {sc.classes?.grades?.name} {sc.classes?.name}
                                    </td>
                                    <td className="py-2 px-4 text-sm">{sc.academic_year}</td>
                                    <td className="py-2 px-4 text-sm capitalize">{sc.status}</td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

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
