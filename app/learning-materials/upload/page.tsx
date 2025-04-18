"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase/client"

const materialSchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters." }),
  description: z.string().optional(),
  materialType: z.enum(["textbook", "notes", "past_paper"], {
    required_error: "Please select a material type.",
  }),
  subjectId: z.string({ required_error: "Please select a subject." }),
  gradeId: z.string({ required_error: "Please select a grade." }),
})

type MaterialFormValues = z.infer<typeof materialSchema>

export default function UploadMaterialPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [grades, setGrades] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])

  // Mock user for demo
  const mockUser = {
    name: "John Smith",
    email: "john.smith@example.com",
    role: "teacher",
    avatar: "",
    id: 1, // This would be the teacher's ID
  }

  // Fetch grades and subjects on component mount
  useState(() => {
    const fetchData = async () => {
      const { data: gradesData } = await supabase.from("grades").select("*").order("id")

      const { data: subjectsData } = await supabase.from("subjects").select("*").order("name")

      if (gradesData) setGrades(gradesData)
      if (subjectsData) setSubjects(subjectsData)
    }

    fetchData()
  })

  const form = useForm<MaterialFormValues>({
    resolver: zodResolver(materialSchema),
    defaultValues: {
      title: "",
      description: "",
      materialType: undefined,
      subjectId: "",
      gradeId: "",
    },
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    setFileError(null)

    if (!selectedFile) {
      setFile(null)
      return
    }

    // Check file type (PDF only)
    if (selectedFile.type !== "application/pdf") {
      setFileError("Please upload a PDF file.")
      setFile(null)
      return
    }

    // Check file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setFileError("File size should not exceed 10MB.")
      setFile(null)
      return
    }

    setFile(selectedFile)
  }

  const onSubmit = async (data: MaterialFormValues) => {
    if (!file) {
      setFileError("Please upload a file.")
      return
    }

    setIsSubmitting(true)

    try {
      // Upload the file to Supabase Storage
      const timestamp = Date.now()
      const fileExt = file.name.split(".").pop()
      const fileName = `${data.materialType}_${data.title.toLowerCase().replace(/\s+/g, "_")}_${timestamp}.${fileExt}`
      const filePath = `learning_materials/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage.from("documents").upload(filePath, file)

      if (uploadError) {
        throw new Error(uploadError.message)
      }

      // Get the public URL for the uploaded file
      const { data: urlData } = supabase.storage.from("documents").getPublicUrl(filePath)

      const fileUrl = urlData.publicUrl

      // Insert learning material data into the database
      const { error: insertError } = await supabase.from("learning_materials").insert({
        title: data.title,
        description: data.description || null,
        file_url: fileUrl,
        material_type: data.materialType,
        subject_id: Number.parseInt(data.subjectId),
        grade_id: Number.parseInt(data.gradeId),
        teacher_id: mockUser.id, // This would be the actual teacher ID
      })

      if (insertError) {
        throw new Error(insertError.message)
      }

      toast({
        title: "Material Uploaded",
        description: "Your learning material has been uploaded successfully.",
      })

      // Redirect to learning materials page
      router.push("/learning-materials")
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Upload Failed",
        description: "There was an error uploading your material. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DashboardLayout user={mockUser}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Upload Learning Material</h1>

        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>New Learning Material</CardTitle>
            <CardDescription>Upload textbooks, notes, or past papers for students.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter material title" {...field} />
                      </FormControl>
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
                        <Textarea placeholder="Enter a brief description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="gradeId"
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
                    name="subjectId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a subject" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {subjects.map((subject) => (
                              <SelectItem key={subject.id} value={subject.id.toString()}>
                                {subject.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="materialType"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Material Type</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="textbook" />
                            </FormControl>
                            <FormLabel className="font-normal">Textbook</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="notes" />
                            </FormControl>
                            <FormLabel className="font-normal">Notes</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="past_paper" />
                            </FormControl>
                            <FormLabel className="font-normal">Past Paper</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <FormLabel htmlFor="file">File (PDF)</FormLabel>
                  <Input id="file" type="file" accept=".pdf" onChange={handleFileChange} />
                  {fileError && <p className="text-sm font-medium text-destructive">{fileError}</p>}
                  <FormDescription>Please upload your material in PDF format (max 10MB).</FormDescription>
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Uploading..." : "Upload Material"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
