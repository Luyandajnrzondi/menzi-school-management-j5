"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Save } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"

const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
const periods = [1, 2, 3, 4, 5, 6, 7, 8]

const timetableSchema = z.object({
  class_id: z.string().min(1, { message: "Please select a class" }),
  academic_year: z.string().min(1, { message: "Please enter the academic year" }),
  term: z.string().min(1, { message: "Please select a term" }),
})

export default function CreateTimetablePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [classes, setClasses] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  const [subjectTeachers, setSubjectTeachers] = useState<Record<string, any[]>>({})
  const [selectedClass, setSelectedClass] = useState<any>(null)
  const [timetable, setTimetable] = useState<any>({})
  const [activeDay, setActiveDay] = useState("Monday")
  const [existingTimetable, setExistingTimetable] = useState<any>(null)

  const form = useForm<z.infer<typeof timetableSchema>>({
    resolver: zodResolver(timetableSchema),
    defaultValues: {
      class_id: "",
      academic_year: new Date().getFullYear().toString(),
      term: "1",
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
      // Fetch classes
      const { data: classesData, error: classesError } = await supabase
        .from("classes")
        .select(`
          id,
          name,
          grade_id,
          grades(name)
        `)
        .eq("academic_year", new Date().getFullYear())
        .order("grade_id", { ascending: true })
        .order("name", { ascending: true })

      if (classesError) throw classesError

      // Fetch subjects
      const { data: subjectsData, error: subjectsError } = await supabase
        .from("subjects")
        .select("*")
        .order("name", { ascending: true })

      if (subjectsError) throw subjectsError

      // Fetch teachers with their subjects
      const { data: teachersWithSubjects, error: teachersError } = await supabase
        .from("teachers")
        .select(`
          id,
          first_name,
          last_name,
          teacher_subjects(subject_id)
        `)
        .order("last_name", { ascending: true })

      if (teachersError) throw teachersError

      // Create a mapping of subject_id to teachers who teach it
      const subjectTeachersMap: Record<string, any[]> = {}

      teachersWithSubjects.forEach((teacher) => {
        const teacherSubjects = teacher.teacher_subjects.map((ts: any) => ts.subject_id.toString())

        teacherSubjects.forEach((subjectId: string) => {
          if (!subjectTeachersMap[subjectId]) {
            subjectTeachersMap[subjectId] = []
          }

          subjectTeachersMap[subjectId].push({
            id: teacher.id,
            name: `${teacher.first_name} ${teacher.last_name}`,
          })
        })
      })

      setClasses(classesData || [])
      setSubjects(subjectsData || [])
      setTeachers(teachersWithSubjects || [])
      setSubjectTeachers(subjectTeachersMap)

      // Initialize empty timetable
      const initialTimetable: any = {}
      weekdays.forEach((day) => {
        initialTimetable[day] = {}
        periods.forEach((period) => {
          initialTimetable[day][period] = { subject_id: "", teacher_id: "" }
        })
      })
      setTimetable(initialTimetable)
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

  const handleClassChange = async (classId: string) => {
    form.setValue("class_id", classId)

    const selectedClass = classes.find((c) => c.id.toString() === classId)
    setSelectedClass(selectedClass)

    // Check if timetable already exists for this class, year and term
    try {
      const { data, error } = await supabase
        .from("timetables")
        .select("*")
        .eq("class_id", classId)
        .eq("academic_year", form.getValues("academic_year"))
        .eq("term", form.getValues("term"))
        .single()

      if (error && error.code !== "PGSQL_ERROR") {
        console.error("Error checking existing timetable:", error)
      }

      if (data) {
        setExistingTimetable(data)
        setTimetable(data.schedule || {})
        toast({
          title: "Existing Timetable Found",
          description: "You are now editing an existing timetable.",
        })
      } else {
        // Reset to empty timetable
        const initialTimetable: any = {}
        weekdays.forEach((day) => {
          initialTimetable[day] = {}
          periods.forEach((period) => {
            initialTimetable[day][period] = { subject_id: "", teacher_id: "" }
          })
        })
        setTimetable(initialTimetable)
        setExistingTimetable(null)
      }
    } catch (error) {
      console.error("Error checking existing timetable:", error)
    }
  }

  const handleTimetableChange = (day: string, period: number, field: string, value: string) => {
    setTimetable((prev: any) => {
      const newTimetable = { ...prev }

      if (!newTimetable[day]) {
        newTimetable[day] = {}
      }

      if (!newTimetable[day][period]) {
        newTimetable[day][period] = { subject_id: "", teacher_id: "" }
      }

      // If changing subject, reset teacher
      if (field === "subject_id") {
        newTimetable[day][period] = {
          subject_id: value,
          teacher_id: "",
        }
      } else {
        newTimetable[day][period][field] = value
      }

      return newTimetable
    })
  }

  const onSubmit = async (data: z.infer<typeof timetableSchema>) => {
    setIsSaving(true)
    try {
      // Check if timetable already exists
      const { data: existingTimetable, error: checkError } = await supabase
        .from("timetables")
        .select("id")
        .eq("class_id", data.class_id)
        .eq("academic_year", data.academic_year)
        .eq("term", data.term)
        .single()

      if (checkError && checkError.code !== "PGSQL_ERROR") {
        throw checkError
      }

      let timetableId
      if (existingTimetable) {
        // Update existing timetable
        timetableId = existingTimetable.id
        const { error: updateError } = await supabase
          .from("timetables")
          .update({
            schedule: timetable,
            updated_at: new Date().toISOString(),
          })
          .eq("id", timetableId)

        if (updateError) throw updateError
      } else {
        // Create new timetable
        const { data: newTimetable, error: insertError } = await supabase
          .from("timetables")
          .insert({
            class_id: data.class_id,
            academic_year: Number.parseInt(data.academic_year),
            term: Number.parseInt(data.term),
            schedule: timetable,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select("id")
          .single()

        if (insertError) throw insertError
        timetableId = newTimetable.id
      }

      // Create notification
      const selectedClass = classes.find((c) => c.id.toString() === data.class_id)
      const className = selectedClass ? `${selectedClass.grades.name} ${selectedClass.name}` : "a class"

      await supabase.from("notifications").insert({
        title: "New Timetable Created",
        message: `A new timetable has been created for ${className} for Term ${data.term}, ${data.academic_year}.`,
        notification_type: "timetable",
        is_read: false,
        created_at: new Date().toISOString(),
      })

      toast({
        title: "Success",
        description: "Timetable has been saved successfully.",
      })

      router.push("/admin/timetables")
    } catch (error) {
      console.error("Error saving timetable:", error)
      toast({
        title: "Error",
        description: "Failed to save timetable. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const getTeachersForSubject = (subjectId: string) => {
    if (!subjectId || subjectId === "none") return []
    return subjectTeachers[subjectId] || []
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
          <h1 className="text-2xl font-bold">{existingTimetable ? "Edit Timetable" : "Create Timetable"}</h1>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Timetable Details</CardTitle>
                <CardDescription>Enter the basic details for the timetable</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="class_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Class</FormLabel>
                        <Select onValueChange={(value) => handleClassChange(value)} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a class" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {classes.map((classItem) => (
                              <SelectItem key={classItem.id} value={classItem.id.toString()}>
                                {classItem.grades.name} {classItem.name}
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

                  <FormField
                    control={form.control}
                    name="term"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Term</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a term" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1">Term 1</SelectItem>
                            <SelectItem value="2">Term 2</SelectItem>
                            <SelectItem value="3">Term 3</SelectItem>
                            <SelectItem value="4">Term 4</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Timetable Schedule</CardTitle>
                <CardDescription>Set the schedule for each day of the week</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="Monday" value={activeDay} onValueChange={setActiveDay}>
                  <TabsList className="mb-4">
                    {weekdays.map((day) => (
                      <TabsTrigger key={day} value={day}>
                        {day}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {weekdays.map((day) => (
                    <TabsContent key={day} value={day} className="space-y-4">
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="py-2 px-4 border text-left">Period</th>
                              <th className="py-2 px-4 border text-left">Subject</th>
                              <th className="py-2 px-4 border text-left">Teacher</th>
                            </tr>
                          </thead>
                          <tbody>
                            {periods.map((period) => (
                              <tr key={period} className="border-b">
                                <td className="py-2 px-4 border font-medium">Period {period}</td>
                                <td className="py-2 px-4 border">
                                  <Select
                                    value={timetable[day]?.[period]?.subject_id || ""}
                                    onValueChange={(value) => handleTimetableChange(day, period, "subject_id", value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a subject" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="none">None (Break/Free Period)</SelectItem>
                                      {subjects.map((subject) => (
                                        <SelectItem key={subject.id} value={subject.id.toString()}>
                                          {subject.name} {subject.subject_code ? `(${subject.subject_code})` : ""}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </td>
                                <td className="py-2 px-4 border">
                                  <Select
                                    value={timetable[day]?.[period]?.teacher_id || ""}
                                    onValueChange={(value) => handleTimetableChange(day, period, "teacher_id", value)}
                                    disabled={
                                      !timetable[day]?.[period]?.subject_id ||
                                      timetable[day]?.[period]?.subject_id === "none"
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a teacher" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {getTeachersForSubject(timetable[day]?.[period]?.subject_id).map((teacher) => (
                                        <SelectItem key={teacher.id} value={teacher.id.toString()}>
                                          {teacher.name}
                                        </SelectItem>
                                      ))}
                                      {getTeachersForSubject(timetable[day]?.[period]?.subject_id).length === 0 && (
                                        <SelectItem value="" disabled>
                                          No teachers available for this subject
                                        </SelectItem>
                                      )}
                                    </SelectContent>
                                  </Select>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>

            <div className="mt-6 flex justify-end">
              <Button type="button" variant="outline" className="mr-2" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {existingTimetable ? "Update Timetable" : "Save Timetable"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </DashboardLayout>
  )
}
