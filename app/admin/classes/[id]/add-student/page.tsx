"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase/client"
import { assignSubjectsBasedOnClass } from "@/lib/subject-assignment"
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function AddStudentToClassPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [classDetails, setClassDetails] = useState<any>(null)
  const [students, setStudents] = useState<any[]>([])
  const [selectedStudent, setSelectedStudent] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

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
    fetchClassDetails()
    fetchStudents()
  }, [router, params.id])

  const fetchClassDetails = async () => {
    try {
      const { data, error } = await supabase.from("classes").select("*, grades(id, name)").eq("id", params.id).single()

      if (error) throw error

      setClassDetails(data)
    } catch (error) {
      console.error("Error fetching class details:", error)
      toast({
        title: "Error",
        description: "Failed to load class details. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchStudents = async () => {
    try {
      // Get students who are not assigned to any class
      const { data, error } = await supabase.from("students").select("*").is("class_id", null)

      if (error) throw error

      setStudents(data || [])
    } catch (error) {
      console.error("Error fetching students:", error)
      toast({
        title: "Error",
        description: "Failed to load students. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleAddStudent = async () => {
    if (!selectedStudent) {
      toast({
        title: "Error",
        description: "Please select a student.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      // Update student's class
      const { error } = await supabase.from("students").update({ class_id: params.id }).eq("id", selectedStudent)

      if (error) throw error

      // Assign subjects based on class and grade
      if (classDetails && classDetails.grades) {
        await assignSubjectsBasedOnClass({
          studentId: selectedStudent,
          classId: params.id,
          gradeId: classDetails.grades.id,
        })
      }

      toast({
        title: "Success",
        description: "Student added to class successfully.",
      })

      // Refresh students list
      fetchStudents()
      setSelectedStudent("")
    } catch (error) {
      console.error("Error adding student to class:", error)
      toast({
        title: "Error",
        description: "Failed to add student to class. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredStudents = students.filter((student) => {
    const fullName = `${student.first_name} ${student.last_name}`.toLowerCase()
    return fullName.includes(searchQuery.toLowerCase())
  })

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
        <h1 className="text-2xl font-bold mb-6">Add Student to Class</h1>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Class Details</CardTitle>
            <CardDescription>
              Adding student to {classDetails?.name} - {classDetails?.grades?.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="search">Search Students</Label>
                <Input
                  id="search"
                  placeholder="Search by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="student">Select Student</Label>
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger id="student">
                    <SelectValue placeholder="Select a student" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.first_name} {student.last_name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        No unassigned students found
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleAddStudent} disabled={isSubmitting || !selectedStudent}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Student to Class"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
