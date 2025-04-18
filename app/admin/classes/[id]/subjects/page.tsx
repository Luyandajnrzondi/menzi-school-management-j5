"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, ArrowLeft, Save, BookOpen } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ClassSubjectsPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [classData, setClassData] = useState<any>(null)
  const [subjects, setSubjects] = useState<any[]>([])
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
  const [assignedSubjects, setAssignedSubjects] = useState<any[]>([])

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
      const classId = params.id

      // Fetch class details
      const { data: classDetails, error: classError } = await supabase
        .from("classes")
        .select(`
          *,
          grades(id, name)
        `)
        .eq("id", classId)
        .single()

      if (classError) throw classError

      setClassData(classDetails)

      // Fetch all subjects
      const { data: subjectsData, error: subjectsError } = await supabase
        .from("subjects")
        .select("*")
        .order("name", { ascending: true })

      if (subjectsError) throw subjectsError

      setSubjects(subjectsData || [])

      // Fetch subjects assigned to this class
      const { data: assignedSubjectsData, error: assignedSubjectsError } = await supabase
        .from("class_subjects")
        .select(`
          *,
          subjects(*)
        `)
        .eq("class_id", classId)

      if (assignedSubjectsError) throw assignedSubjectsError

      setAssignedSubjects(assignedSubjectsData || [])
      setSelectedSubjects((assignedSubjectsData || []).map((item) => item.subject_id.toString()))
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to load data. Please try again.",
        variant: "destructive",
      })
      router.push("/admin/classes")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubjectToggle = (subjectId: string) => {
    setSelectedSubjects((prev) => {
      if (prev.includes(subjectId)) {
        return prev.filter((id) => id !== subjectId)
      } else {
        return [...prev, subjectId]
      }
    })
  }

  const saveSubjects = async () => {
    setIsSaving(true)
    try {
      const classId = params.id

      // Get currently assigned subject IDs
      const currentSubjectIds = assignedSubjects.map((item) => item.subject_id.toString())

      // Find subjects to add (in selected but not in current)
      const subjectsToAdd = selectedSubjects.filter((id) => !currentSubjectIds.includes(id))

      // Find subjects to remove (in current but not in selected)
      const subjectsToRemove = currentSubjectIds.filter((id) => !selectedSubjects.includes(id))

      // Add new subjects
      if (subjectsToAdd.length > 0) {
        const subjectsToInsert = subjectsToAdd.map((subjectId) => ({
          class_id: Number(classId),
          subject_id: Number(subjectId),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }))

        const { error: insertError } = await supabase.from("class_subjects").insert(subjectsToInsert)

        if (insertError) throw insertError
      }

      // Remove subjects
      if (subjectsToRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from("class_subjects")
          .delete()
          .eq("class_id", classId)
          .in(
            "subject_id",
            subjectsToRemove.map((id) => Number(id)),
          )

        if (deleteError) throw deleteError
      }

      toast({
        title: "Success",
        description: "Subjects have been updated successfully.",
      })

      // Refresh data
      fetchData()
    } catch (error) {
      console.error("Error saving subjects:", error)
      toast({
        title: "Error",
        description: "Failed to update subjects. Please try again.",
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

  // Group subjects by category
  const compulsorySubjects = subjects.filter((subject) => subject.is_compulsory)
  const optionalSubjects = subjects.filter((subject) => !subject.is_compulsory)

  return (
    <DashboardLayout user={user}>
      <div className="p-6">
        <div className="flex items-center mb-6">
          <Button variant="outline" size="sm" onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">
            Manage Subjects for {classData.grades?.name} {classData.name}
          </h1>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Class Information</CardTitle>
            <CardDescription>
              Assign subjects to this class for the {classData.academic_year} academic year
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Class</p>
                <p className="font-medium">
                  {classData.grades?.name} {classData.name}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Academic Year</p>
                <p className="font-medium">{classData.academic_year}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Assigned Subjects</p>
                <p className="font-medium">{selectedSubjects.length} subjects</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="compulsory">
          <TabsList className="mb-4">
            <TabsTrigger value="compulsory">Compulsory Subjects</TabsTrigger>
            <TabsTrigger value="optional">Optional Subjects</TabsTrigger>
            <TabsTrigger value="assigned">Assigned Subjects</TabsTrigger>
          </TabsList>

          <TabsContent value="compulsory">
            <Card>
              <CardHeader>
                <CardTitle>Compulsory Subjects</CardTitle>
                <CardDescription>Core subjects that are typically required for all students</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {compulsorySubjects.map((subject) => (
                    <div key={subject.id} className="flex items-start space-x-3 border p-4 rounded-md">
                      <Checkbox
                        id={`subject-${subject.id}`}
                        checked={selectedSubjects.includes(subject.id.toString())}
                        onCheckedChange={() => handleSubjectToggle(subject.id.toString())}
                      />
                      <div className="space-y-1">
                        <label htmlFor={`subject-${subject.id}`} className="font-medium cursor-pointer">
                          {subject.name}
                        </label>
                        <p className="text-sm text-muted-foreground">{subject.description}</p>
                        {subject.subject_code && (
                          <Badge variant="outline" className="mt-1">
                            {subject.subject_code}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}

                  {compulsorySubjects.length === 0 && (
                    <div className="col-span-full text-center py-6 text-muted-foreground">
                      No compulsory subjects found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="optional">
            <Card>
              <CardHeader>
                <CardTitle>Optional Subjects</CardTitle>
                <CardDescription>Elective subjects that students can choose from</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {optionalSubjects.map((subject) => (
                    <div key={subject.id} className="flex items-start space-x-3 border p-4 rounded-md">
                      <Checkbox
                        id={`subject-${subject.id}`}
                        checked={selectedSubjects.includes(subject.id.toString())}
                        onCheckedChange={() => handleSubjectToggle(subject.id.toString())}
                      />
                      <div className="space-y-1">
                        <label htmlFor={`subject-${subject.id}`} className="font-medium cursor-pointer">
                          {subject.name}
                        </label>
                        <p className="text-sm text-muted-foreground">{subject.description}</p>
                        {subject.subject_code && (
                          <Badge variant="outline" className="mt-1">
                            {subject.subject_code}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}

                  {optionalSubjects.length === 0 && (
                    <div className="col-span-full text-center py-6 text-muted-foreground">
                      No optional subjects found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assigned">
            <Card>
              <CardHeader>
                <CardTitle>Assigned Subjects</CardTitle>
                <CardDescription>Subjects currently assigned to this class</CardDescription>
              </CardHeader>
              <CardContent>
                {selectedSubjects.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {subjects
                      .filter((subject) => selectedSubjects.includes(subject.id.toString()))
                      .map((subject) => (
                        <Card key={subject.id} className="overflow-hidden">
                          <CardContent className="p-0">
                            <div className="bg-primary/10 p-4 flex items-center space-x-4">
                              <BookOpen className="h-8 w-8 text-primary" />
                              <div>
                                <h3 className="font-medium">{subject.name}</h3>
                                <p className="text-sm text-muted-foreground">{subject.subject_code}</p>
                              </div>
                            </div>
                            <div className="p-4">
                              <p className="text-sm">{subject.description}</p>
                              <div className="mt-2 flex items-center justify-between">
                                <Badge variant={subject.is_compulsory ? "default" : "outline"}>
                                  {subject.is_compulsory ? "Compulsory" : "Optional"}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleSubjectToggle(subject.id.toString())}
                                  className="text-destructive hover:text-destructive"
                                >
                                  Remove
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">No subjects assigned to this class yet</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button onClick={saveSubjects} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}
