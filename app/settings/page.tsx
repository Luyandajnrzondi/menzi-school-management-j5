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
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Save } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { useTheme } from "next-themes"

const profileSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  phone: z.string().optional(),
})

const securitySchema = z
  .object({
    currentPassword: z.string().min(6, { message: "Current password is required" }),
    newPassword: z.string().min(6, { message: "Password must be at least 6 characters" }),
    confirmPassword: z.string().min(6, { message: "Confirm password is required" }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

const notificationSchema = z.object({
  emailNotifications: z.boolean().default(true),
  applicationUpdates: z.boolean().default(true),
  studentUpdates: z.boolean().default(true),
  teacherUpdates: z.boolean().default(true),
  systemAnnouncements: z.boolean().default(true),
})

export default function SettingsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isSavingPassword, setIsSavingPassword] = useState(false)
  const [isSavingNotifications, setIsSavingNotifications] = useState(false)
  const { theme, setTheme } = useTheme()

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      email: "",
      name: "",
      phone: "",
    },
  })

  const securityForm = useForm<z.infer<typeof securitySchema>>({
    resolver: zodResolver(securitySchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  const notificationForm = useForm<z.infer<typeof notificationSchema>>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      emailNotifications: true,
      applicationUpdates: true,
      studentUpdates: true,
      teacherUpdates: true,
      systemAnnouncements: true,
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
    setUser(parsedUser)
    fetchUserData(parsedUser)
  }, [router])

  const fetchUserData = async (userData: any) => {
    try {
      // Fetch user details based on role
      let userDetails

      if (userData.role === "admin") {
        const { data, error } = await supabase.from("admins").select("*").eq("user_id", userData.id).single()

        if (error) throw error
        userDetails = data
      } else if (userData.role === "teacher") {
        const { data, error } = await supabase.from("teachers").select("*").eq("user_id", userData.id).single()

        if (error) throw error
        userDetails = data
      } else if (userData.role === "student") {
        const { data, error } = await supabase.from("students").select("*").eq("user_id", userData.id).single()

        if (error) throw error
        userDetails = data
      }

      // Fetch user notification settings
      const { data: notificationData, error: notificationError } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", userData.id)
        .single()

      // Set form values
      profileForm.reset({
        email: userData.email || "",
        name: userDetails ? `${userDetails.first_name} ${userDetails.last_name}` : "",
        phone: userDetails?.phone || "",
      })

      if (notificationData) {
        notificationForm.reset({
          emailNotifications: notificationData.email_notifications || true,
          applicationUpdates: notificationData.application_updates || true,
          studentUpdates: notificationData.student_updates || true,
          teacherUpdates: notificationData.teacher_updates || true,
          systemAnnouncements: notificationData.system_announcements || true,
        })
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
      toast({
        title: "Error",
        description: "Failed to load user data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const onProfileSubmit = async (data: z.infer<typeof profileSchema>) => {
    setIsSavingProfile(true)
    try {
      // Split name into first and last name
      const nameParts = data.name.split(" ")
      const firstName = nameParts[0]
      const lastName = nameParts.slice(1).join(" ")

      // Update user details based on role
      if (user.role === "admin") {
        const { error } = await supabase
          .from("admins")
          .update({
            first_name: firstName,
            last_name: lastName,
            phone: data.phone || null,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)

        if (error) throw error
      } else if (user.role === "teacher") {
        const { error } = await supabase
          .from("teachers")
          .update({
            first_name: firstName,
            last_name: lastName,
            phone: data.phone || null,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)

        if (error) throw error
      } else if (user.role === "student") {
        const { error } = await supabase
          .from("students")
          .update({
            first_name: firstName,
            last_name: lastName,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)

        if (error) throw error
      }

      // Update email if changed
      if (data.email !== user.email) {
        // In a real app, you would use Supabase Auth to update email
        // For this demo, we'll just update the user object
        const updatedUser = { ...user, email: data.email }
        localStorage.setItem("user", JSON.stringify(updatedUser))
        setUser(updatedUser)
      }

      toast({
        title: "Profile Updated",
        description: "Your profile information has been updated successfully.",
      })
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSavingProfile(false)
    }
  }

  const onSecuritySubmit = async (data: z.infer<typeof securitySchema>) => {
    setIsSavingPassword(true)
    try {
      // In a real app, you would use Supabase Auth to update password
      // For this demo, we'll just show a success message
      toast({
        title: "Password Updated",
        description: "Your password has been updated successfully.",
      })

      securityForm.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    } catch (error) {
      console.error("Error updating password:", error)
      toast({
        title: "Error",
        description: "Failed to update password. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSavingPassword(false)
    }
  }

  const onNotificationSubmit = async (data: z.infer<typeof notificationSchema>) => {
    setIsSavingNotifications(true)
    try {
      // Check if user settings exist
      const { data: existingSettings, error: checkError } = await supabase
        .from("user_settings")
        .select("id")
        .eq("user_id", user.id)
        .single()

      if (checkError && checkError.code !== "PGSQL_ERROR") {
        throw checkError
      }

      if (existingSettings) {
        // Update existing settings
        const { error } = await supabase
          .from("user_settings")
          .update({
            email_notifications: data.emailNotifications,
            application_updates: data.applicationUpdates,
            student_updates: data.studentUpdates,
            teacher_updates: data.teacherUpdates,
            system_announcements: data.systemAnnouncements,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingSettings.id)

        if (error) throw error
      } else {
        // Create new settings
        const { error } = await supabase.from("user_settings").insert({
          user_id: user.id,
          email_notifications: data.emailNotifications,
          application_updates: data.applicationUpdates,
          student_updates: data.studentUpdates,
          teacher_updates: data.teacherUpdates,
          system_announcements: data.systemAnnouncements,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

        if (error) throw error
      }

      toast({
        title: "Notification Settings Updated",
        description: "Your notification preferences have been updated successfully.",
      })
    } catch (error) {
      console.error("Error updating notification settings:", error)
      toast({
        title: "Error",
        description: "Failed to update notification settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSavingNotifications(false)
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
        <h1 className="text-2xl font-bold mb-6">Settings</h1>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal information</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                    <FormField
                      control={profileForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
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

                    <Button type="submit" disabled={isSavingProfile}>
                      {isSavingProfile ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Update your password and security preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...securityForm}>
                  <form onSubmit={securityForm.handleSubmit(onSecuritySubmit)} className="space-y-4">
                    <FormField
                      control={securityForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter your current password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={securityForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter your new password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={securityForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Confirm your new password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" disabled={isSavingPassword}>
                      {isSavingPassword ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Update Password
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Manage how you receive notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...notificationForm}>
                  <form onSubmit={notificationForm.handleSubmit(onNotificationSubmit)} className="space-y-4">
                    <FormField
                      control={notificationForm.control}
                      name="emailNotifications"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Email Notifications</FormLabel>
                            <FormDescription>Receive notifications via email</FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={notificationForm.control}
                      name="applicationUpdates"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Application Updates</FormLabel>
                            <FormDescription>Receive notifications about new applications</FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={notificationForm.control}
                      name="studentUpdates"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Student Updates</FormLabel>
                            <FormDescription>Receive notifications about student activities</FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={notificationForm.control}
                      name="teacherUpdates"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Teacher Updates</FormLabel>
                            <FormDescription>Receive notifications about teacher activities</FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={notificationForm.control}
                      name="systemAnnouncements"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">System Announcements</FormLabel>
                            <FormDescription>Receive important system announcements</FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <Button type="submit" disabled={isSavingNotifications}>
                      {isSavingNotifications ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Preferences
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize the appearance of the application</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Theme</h3>
                  <p className="text-sm text-muted-foreground">Select your preferred theme</p>
                  <div className="flex flex-col space-y-4 pt-2">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant={theme === "light" ? "default" : "outline"}
                        className="w-full justify-start"
                        onClick={() => setTheme("light")}
                      >
                        Light
                      </Button>
                      <Button
                        variant={theme === "dark" ? "default" : "outline"}
                        className="w-full justify-start"
                        onClick={() => setTheme("dark")}
                      >
                        Dark
                      </Button>
                      <Button
                        variant={theme === "system" ? "default" : "outline"}
                        className="w-full justify-start"
                        onClick={() => setTheme("system")}
                      >
                        System
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
