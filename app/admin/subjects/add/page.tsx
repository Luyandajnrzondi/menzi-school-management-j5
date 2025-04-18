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
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Loader2, Save } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"

const subjectSchema = z.object({
  name: z.string().min(1, { message: "Please enter a subject name" }),
  subject_code: z.string().min(1, { message: "Please enter a subject code" }),
  description: z.string().optional(),
  is_compulsory: z.boolean().default(false),
})

export default function AddSubjectPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const form = useForm<z.infer<typeof subjectSchema>>({
    resolver: zodResolver(subjectSchema),
    defaultValues: {
      name: "",
      subject_code: "",
      description: "",
      is_compulsory: false,
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
    setIsLoading(false)
  }, [router])

  const onSubmit = async (data: z.infer<typeof subjectSchema>) => {
    setIsSaving(true)
    try {
      console.log("Submitting subject data:", data)

      // Check if subject already exists
      const { data: existingSubjects, error: checkError } = await supabase
        .from("subjects")
        .select("*")
        .or(`name.eq.${data.name},subject_code.eq.${data.subject_code}`)

      if (checkError) {
        console.error("Error checking existing subjects:", checkError)
        throw checkError
      }

      if (existingSubjects && existingSubjects.length > 0) {
        const nameExists = existingSubjects.some((s) => s.name === data.name)
        const codeExists = existingSubjects.some((s) => s.subject_code === data.subject_code)

        if (nameExists) {
          toast({
            title: "Subject Already Exists",
            description: "A subject with this name already exists.",
            variant: "destructive",
          })
        } else if (codeExists) {
          toast({
            title: "Subject Code Already Exists",
            description: "A subject with this code already exists.",
            variant: "destructive",
          })
        }

        setIsSaving(false)
        return
      }

      // Create new subject
      const { data: newSubject, error: insertError } = await supabase
        .from("subjects")
        .insert({
          name: data.name,
          subject_code: data.subject_code,
          description: data.description || null,
          is_compulsory: data.is_compulsory,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()

      if (insertError) {
        console.error("Error inserting subject:", insertError)
        throw insertError
      }

      console.log("Subject created successfully:", newSubject)

      // Create notification
      await supabase.from("notifications").insert({
        title: "New Subject Added",
        message: `A new subject "${data.name}" (${data.subject_code}) has been added to the curriculum.`,
        notification_type: "subject",
        is_read: false,
        created_at: new Date().toISOString(),
      })

      toast({
        title: "Success",
        description: "Subject has been created successfully.",
      })

      router.push("/admin/subjects")
    } catch (error) {
      console.error("Error creating subject:", error)
      toast({
        title: "Error",
        description: "Failed to create subject. Please try again.",
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
          <h1 className="text-2xl font-bold">Add New Subject</h1>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Card>
              <CardHeader>
                <CardTitle>Subject Details</CardTitle>
                <CardDescription>Enter the details for the new subject</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Mathematics, English, Science" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subject_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject Code</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. MATH101, ENG101, SCI101" {...field} />
                      </FormControl>
                      <FormDescription>Enter a unique code for this subject</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter a brief description of the subject"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_compulsory"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Compulsory Subject</FormLabel>
                        <FormDescription>
                          Mark this subject as compulsory for all students in applicable grades
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
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
                Create Subject
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </DashboardLayout>
  )
}
