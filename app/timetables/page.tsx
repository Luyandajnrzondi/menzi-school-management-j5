"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Calendar } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"

const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
const periods = [1, 2, 3, 4, 5, 6, 7, 8]

export default function TimetablesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timetable, setTimetable] = useState<any>(null)
  const [classes, setClasses] = useState<any[]>([])
  const [selectedClass, setSelectedClass] = useState<string>("")
  const [subjects, setSubjects] = useState<Record<string, any>>({})
  const [teachers, setTeachers] = useState<Record<string, any>>({})
  const [terms, setTerms] = useState<any[]>([])
  const [selectedTerm, setSelectedTerm] = useState<string>("")
  const [activeDay, setActiveDay] = useState("Monday")

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem("user")

    if (!storedUser) {
      router.push("/login")
      return
    }

    const parsedUser = JSON.parse(storedUser)
    setUser(parsedUser)
    fetchInitialData(parsedUser)
  }, [router])

  const fetchInitialData = async (user: any) => {
    try {
      // Fetch subjects for lookup
      const { data: subjectsData, error: subjectsError } = await supabase.from("subjects").select("*")
      if (subjectsError) throw subjectsError

      // Create subjects lookup object
      const subjectsLookup: Record<string, any> = {}
      subjectsData?.forEach((subject) => {
        subjectsLookup[subject.id] = subject
      })
      setSubjects(subjectsLookup)

      // Fetch teachers for lookup
      const { data: teachersData, error: teachersError } = await supabase.from("teachers").select("*")
      if (teachersError) throw teachersError

      // Create teachers lookup object
      const teachersLookup: Record<string, any> = {}
      teachersData?.forEach((teacher) => {
        teachersLookup[teacher.id] = teacher
      })
      setTeachers(teachersLookup)

      // Different data fetching based on user role
      if (user.role === "student") {
        await fetchStudentTimetable(user)
      } else if (user.role === "teacher") {
        await fetchTeacherClasses(user)
      } else {
        // Admin or principal - fetch all classes
        await fetchAllClasses()
      }

      // Fetch available terms (from timetables)
      const { data: termsData, error: termsError } = await supabase
        .from("timetables")
        .select("term, academic_year")
        .order("academic_year", { ascending: false })
        .order("term", { ascending: true })

      if (termsError) throw termsError

      // Create unique terms list
      const uniqueTerms = Array.from(new Set(termsData?.map((t) => `${t.academic_year}-${t.term}`))).map((termKey) => {
        const [year, term] = termKey.split("-")
        return { year, term, label: `Term ${term}, ${year}` }
      })

      setTerms(uniqueTerms)
      if (uniqueTerms.length > 0) {
        setSelectedTerm(`${uniqueTerms[0].year}-${uniqueTerms[0].term}`)
      }
    } catch (error) {
      console.error("Error fetching initial data:", error)
      toast({
        title: "Error",
        description: "Failed to load timetable data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchStudentTimetable = async (user: any) => {
    try {
      // Get student's class
      const { data: studentData, error: studentError } = await supabase
        .from("students")
        .select("class_id")
        .eq("user_id", user.id)
        .single()

      if (studentError) throw studentError

      if (!studentData?.class_id) {
        toast({
          title: "No Class Assigned",
          description: "You are not assigned to any class yet.",
          variant: "destructive",
        })
        return
      }

      // Get class details
      const { data: classData, error: classError } = await supabase
        .from("classes")
        .select(`
          id,
          name,
          grade_id,
          grades(name)
        `)
        .eq("id", studentData.class_id)
        .single()

      if (classError) throw classError

      setClasses([classData])
      setSelectedClass(classData.id.toString())
    } catch (error) {
      console.error("Error fetching student timetable:", error)
      toast({
        title: "Error",
        description: "Failed to load your class timetable. Please try again.",
        variant: "destructive",
      })
    }
  }

  const fetchTeacherClasses = async (user: any) => {
    try {
      // Get teacher's ID
      const { data: teacherData, error: teacherError } = await supabase
        .from("teachers")
        .select("id")
        .eq("user_id", user.id)
        .single()

      if (teacherError) throw teacherError

      // Get classes where this teacher is assigned
      const { data: classesData, error: classesError } = await supabase
        .from("classes")
        .select(`
          id,
          name,
          grade_id,
          grades(name)
        `)
        .eq("teacher_id", teacherData.id)
        .order("grade_id", { ascending: true })
        .order("name", { ascending: true })

      if (classesError) throw classesError

      setClasses(classesData || [])
      if (classesData && classesData.length > 0) {
        setSelectedClass(classesData[0].id.toString())
      }
    } catch (error) {
      console.error("Error fetching teacher classes:", error)
      toast({
        title: "Error",
        description: "Failed to load your classes. Please try again.",
        variant: "destructive",
      })
    }
  }

  const fetchAllClasses = async () => {
    try {
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
      if (classesData && classesData.length > 0) {
        setSelectedClass(classesData[0].id.toString())
      }
    } catch (error) {
      console.error("Error fetching all classes:", error)
      toast({
        title: "Error",
        description: "Failed to load classes. Please try again.",
        variant: "destructive",
      })
    }
  }

  const fetchTimetable = async () => {
    if (!selectedClass || !selectedTerm) return

    setIsLoading(true)
    try {
      const [year, term] = selectedTerm.split("-")

      const { data, error } = await supabase
        .from("timetables")
        .select("*")
        .eq("class_id", selectedClass)
        .eq("academic_year", year)
        .eq("term", term)
        .single()

      if (error) {
        if (error.code === "PGSQL_ERROR") {
          setTimetable(null)
          toast({
            title: "No Timetable Found",
            description: "There is no timetable available for the selected class and term.",
          })
        } else {
          throw error
        }
      } else {
        setTimetable(data)
      }
    } catch (error) {
      console.error("Error fetching timetable:", error)
      toast({
        title: "Error",
        description: "Failed to load timetable. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (selectedClass && selectedTerm) {
      fetchTimetable()
    }
  }, [selectedClass, selectedTerm])

  const getSubjectName = (subjectId: string) => {
    if (!subjectId || subjectId === "none") return "Break/Free Period"
    const subject = subjects[subjectId]
    return subject ? `${subject.name} ${subject.subject_code ? `(${subject.subject_code})` : ""}` : "Unknown Subject"
  }

  const getTeacherName = (teacherId: string) => {
    if (!teacherId) return "-"
    const teacher = teachers[teacherId]
    return teacher ? `${teacher.first_name} ${teacher.last_name}` : "Unknown Teacher"
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold">Timetables</h1>
            <p className="text-muted-foreground">View class schedules and timetables</p>
          </div>
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            {classes.length > 1 && (
              <div className="w-full md:w-64">
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((classItem) => (
                      <SelectItem key={classItem.id} value={classItem.id.toString()}>
                        {classItem.grades.name} {classItem.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="w-full md:w-64">
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a term" />
                </SelectTrigger>
                <SelectContent>
                  {terms.map((term) => (
                    <SelectItem key={`${term.year}-${term.term}`} value={`${term.year}-${term.term}`}>
                      {term.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {classes.find((c) => c.id.toString() === selectedClass)
                ? `${classes.find((c) => c.id.toString() === selectedClass)?.grades?.name} ${
                    classes.find((c) => c.id.toString() === selectedClass)?.name
                  } Timetable`
                : "Class Timetable"}
            </CardTitle>
            <CardDescription>
              {selectedTerm
                ? `Term ${selectedTerm.split("-")[1]}, ${selectedTerm.split("-")[0]} Academic Year`
                : "Select a term to view the timetable"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {timetable && timetable.schedule ? (
              <Tabs defaultValue="Monday" value={activeDay} onValueChange={setActiveDay}>
                <TabsList className="mb-4 flex flex-wrap">
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
                                {timetable.schedule[day] && timetable.schedule[day][period]
                                  ? getSubjectName(timetable.schedule[day][period].subject_id)
                                  : "-"}
                              </td>
                              <td className="py-2 px-4 border">
                                {timetable.schedule[day] && timetable.schedule[day][period]
                                  ? getTeacherName(timetable.schedule[day][period].teacher_id)
                                  : "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium">No Timetable Available</h3>
                <p className="text-sm text-gray-500 mt-2">
                  There is no timetable available for the selected class and term.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
