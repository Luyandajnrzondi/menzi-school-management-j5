"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { GraduationCap, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true)

    try {
      // For demo purposes, we'll use hardcoded credentials
      const credentials = {
        admin: { email: "luyanda@menzi.edu", password: "Luyanda#@19", role: "admin" },
        principal: { email: "zondi@menzi.edu", password: "Zondi#@19", role: "principal" },
        teacher: { email: "teacher@menzi.edu", password: "Teacher#@19", role: "teacher" },
        student: { email: "student@menzi.edu", password: "Student#@19", role: "student" },
      }

      // Check if the email and password match any of our demo accounts
      let userRole = null

      if (data.email === credentials.admin.email && data.password === credentials.admin.password) {
        userRole = "admin"
      } else if (data.email === credentials.principal.email && data.password === credentials.principal.password) {
        userRole = "principal"
      } else if (data.email === credentials.teacher.email && data.password === credentials.teacher.password) {
        userRole = "teacher"
      } else if (data.email === credentials.student.email && data.password === credentials.student.password) {
        userRole = "student"
      }

      if (!userRole) {
        throw new Error("Invalid credentials")
      }

      // Store user info in localStorage for demo purposes
      localStorage.setItem(
        "user",
        JSON.stringify({
          email: data.email,
          role: userRole,
          name: userRole.charAt(0).toUpperCase() + userRole.slice(1) + " User",
        }),
      )

      // Show success message
      toast({
        title: "Login Successful",
        description: `Welcome back, ${userRole} user!`,
      })

      // Redirect based on user role
      switch (userRole) {
        case "admin":
          router.push("/admin/dashboard")
          break
        case "principal":
          router.push("/principal/dashboard")
          break
        case "teacher":
          router.push("/teacher/dashboard")
          break
        case "student":
          router.push("/dashboard")
          break
        default:
          router.push("/dashboard")
      }
    } catch (error) {
      console.error("Login error:", error)
      toast({
        title: "Login Failed",
        description: "Invalid email or password. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // For demo purposes, let's add some test accounts
  const fillTestAccount = (role: string) => {
    switch (role) {
      case "admin":
        form.setValue("email", "luyanda@menzi.edu")
        form.setValue("password", "Luyanda#@19")
        break
      case "principal":
        form.setValue("email", "zondi@menzi.edu")
        form.setValue("password", "Zondi#@19")
        break
      case "teacher":
        form.setValue("email", "teacher@menzi.edu")
        form.setValue("password", "Teacher#@19")
        break
      case "student":
        form.setValue("email", "student@menzi.edu")
        form.setValue("password", "Student#@19")
        break
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-black text-white p-4">
        <div className="container mx-auto">
          <Link href="/" className="flex items-center space-x-2">
            <GraduationCap className="h-6 w-6" />
            <h1 className="text-xl font-bold">School Management System</h1>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Login</CardTitle>
            <CardDescription className="text-center">Enter your credentials to access your account</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
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
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter your password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    "Login"
                  )}
                </Button>
              </form>
            </Form>

            {/* Demo accounts section */}
            <div className="mt-6 border-t pt-4">
              <p className="text-sm text-center text-gray-500 mb-2">Demo Accounts (For Testing)</p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={() => fillTestAccount("admin")}>
                  Admin
                </Button>
                <Button variant="outline" size="sm" onClick={() => fillTestAccount("principal")}>
                  Principal
                </Button>
                <Button variant="outline" size="sm" onClick={() => fillTestAccount("teacher")}>
                  Teacher
                </Button>
                <Button variant="outline" size="sm" onClick={() => fillTestAccount("student")}>
                  Student
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-center text-gray-500">
              <Link href="/forgot-password" className="text-primary hover:underline">
                Forgot your password?
              </Link>
            </div>
            <div className="text-sm text-center text-gray-500">
              Don't have an account?{" "}
              <Link href="/apply" className="text-primary hover:underline">
                Apply Now
              </Link>
            </div>
          </CardFooter>
        </Card>
      </main>
    </div>
  )
}
