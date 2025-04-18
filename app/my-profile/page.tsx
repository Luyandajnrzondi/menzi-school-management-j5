"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase/client"

const profileSchema = z.object({
  firstName: z.string().min(2, { message: "First name must be at least 2 characters." }),
  lastName: z.string().min(2, { message: "Last name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  bio: z.string().max(500, { message: "Bio must not exceed 500 characters." }).optional(),
  quote: z.string().max(200, { message: "Quote must not exceed 200 characters." }).optional(),
})

type ProfileFormValues = z.infer<typeof profileSchema>

export default function MyProfilePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)

  // Mock user for demo
  const mockUser = {
    name: "John Doe",
    email: "john.doe@example.com",
    role: "student",
    avatar: "",
    studentId: "202500001",
    grade: "Grade 8",
    class: "8A",
  }

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      phone: "",
      address: "",
      bio: "",
      quote: "",
    },
  })

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setFileError(null)

    if (!file) {
      setProfileImage(null)
      setImagePreview(null)
      return
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      setFileError("Please upload an image file.")
      setProfileImage(null)
      setImagePreview(null)
      return
    }

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setFileError("Image size should not exceed 2MB.")
      setProfileImage(null)
      setImagePreview(null)
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

  const onSubmit = async (data: ProfileFormValues) => {
    setIsSubmitting(true)

    try {
      // Upload profile image if selected
      let profileImageUrl = null

      if (profileImage) {
        const timestamp = Date.now()
        const fileExt = profileImage.name.split(".").pop()
        const fileName = `${data.lastName.toLowerCase()}_${data.firstName.toLowerCase()}_${timestamp}.${fileExt}`
        const filePath = `profile_images/${fileName}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("images")
          .upload(filePath, profileImage)

        if (uploadError) {
          throw new Error(uploadError.message)
        }

        // Get the public URL for the uploaded file
        const { data: urlData } = supabase.storage.from("images").getPublicUrl(filePath)

        profileImageUrl = urlData.publicUrl
      }

      // Update student profile in the database
      // In a real application, you would use the actual student ID
      const { error: updateError } = await supabase
        .from("students")
        .update({
          first_name: data.firstName,
          last_name: data.lastName,
          address: data.address || null,
          profile_image_url: profileImageUrl || null,
          // Add bio and quote to the database if those fields exist
        })
        .eq("student_id", mockUser.studentId)

      if (updateError) {
        throw new Error(updateError.message)
      }

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      })
    } catch (error) {
      console.error("Profile update error:", error)
      toast({
        title: "Update Failed",
        description: "There was an error updating your profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DashboardLayout user={mockUser}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">My Profile</h1>

        <Tabs defaultValue="profile">
          <TabsList className="mb-6">
            <TabsTrigger value="profile">Profile Information</TabsTrigger>
            <TabsTrigger value="account">Account Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle>Profile Picture</CardTitle>
                  <CardDescription>Upload a profile picture for your account</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  <Avatar className="h-32 w-32 mb-4">
                    <AvatarImage src={imagePreview || mockUser.avatar} />
                    <AvatarFallback className="text-2xl">{mockUser.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="w-full">
                    <Input id="profile-image" type="file" accept="image/*" onChange={handleImageChange} />
                    {fileError && <p className="text-sm font-medium text-destructive mt-1">{fileError}</p>}
                    <p className="text-xs text-gray-500 mt-2">Recommended: Square image, max 2MB</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Update your personal details</CardDescription>
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
                                <Input placeholder="Enter your first name" {...field} />
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
                                <Input placeholder="Enter your last name" {...field} />
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
                                <Input type="email" placeholder="Enter your email" {...field} disabled />
                              </FormControl>
                              <FormDescription>Contact admin to change your email</FormDescription>
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
                                <Input placeholder="Enter your phone number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address (Optional)</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Enter your address" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="bio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bio (Optional)</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Tell us a bit about yourself"
                                {...field}
                                className="min-h-[100px]"
                              />
                            </FormControl>
                            <FormDescription>Max 500 characters</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="quote"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Favorite Quote (Optional)</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Share your favorite quote or motto" {...field} />
                            </FormControl>
                            <FormDescription>Max 200 characters</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? "Saving..." : "Save Changes"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="account">
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                  <CardDescription>View your account details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Student ID</h3>
                      <p className="mt-1 font-medium">{mockUser.studentId}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Role</h3>
                      <p className="mt-1 font-medium capitalize">{mockUser.role}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Grade</h3>
                      <p className="mt-1 font-medium">{mockUser.grade}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Class</h3>
                      <p className="mt-1 font-medium">{mockUser.class}</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full">
                    Change Password
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
