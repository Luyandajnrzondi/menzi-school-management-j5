"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

export default function TeacherMarksPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [selectedGrade, setSelectedGrade] = useState<string>("")
  const [selectedClass, setSelectedClass] = useState<string>("")
  const [selectedSubject, setSelectedSubject] = useState<string>("")
  const [selectedTerm, setSelectedTerm] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Mock user for demo
  const mockUser = {
    name: "Ms. Johnson",
    email: "johnson@example.com",
    role: "teacher",
    avatar: "",
  }

  // Mock data
  const grades = [
    { id: "8", name: "Grade 8" },
    { id: "9", name: "Grade 9" },
    { id: "10", name: "Grade 10" },
    { id: "11", name: "Grade 11" },
    { id: "12", name: "Grade 12" },
  ]

  const classes = {
    "8": [
      { id: "8A", name: "8A" },
      { id: "8B", name: "8B" },
      { id: "8C", name: "8C" },
    ],
    "9": [
      { id: "9A", name: "9A" },
      { id: "9B", name: "9B" },
      { id: "9C", name: "9C" },
    ],
    "10": [
      { id: "10A", name: "10A" },
      { id: "10B", name: "10B" },
      { id: "10C", name: "10C" },
    ],
    "11": [
      { id: "11A", name: "11A" },
      { id: "11B", name: "11B" },
      { id: "11C", name: "11C" },
    ],
    "12": [
      { id: "12A", name: "12A" },
      { id: "12B", name: "12B" },
      { id: "12C", name: "12C" },
    ],
  }

  const subjects = [
    { id: "english", name: "English FAL" },
    { id: "isizulu", name: "IsiZulu Home Language" },
    { id: "life_orientation", name: "Life Orientation" },
    { id: "mathematics", name: "Mathematics" },
    { id: "physical_sciences", name: "Physical Sciences" },
    { id: "life_sciences", name: "Life Sciences" },
    { id: "geography", name: "Geography" },
    { id: "history", name: "History" },
    { id: "accounting", name: "Accounting" },
    { id: "business_studies", name: "Business Studies" },
    { id: "economics", name: "Economics" },
    { id: "maths_literacy", name: "Mathematical Literacy" },
  ]

  const terms = [
    { id: "1", name: "Term 1" },
    { id: "2", name: "Term 2" },
    { id: "3", name: "Term 3" },
    { id: "4", name: "Term 4" },
  ]

  // Mock students
  const students = [
    { id: 1, name: "John Doe", studentId: "202500001" },
    { id: 2, name: "Sarah Smith", studentId: "202500002" },
    { id: 3, name: "Michael Brown", studentId: "202500003" },
    { id: 4, name: "Emily Johnson", studentId: "202500004" },
    { id: 5, name: "David Wilson", studentId: "202500005" },
    { id: 6, name: "Jessica Lee", studentId: "202500006" },
    { id: 7, name: "Ryan Taylor", studentId: "202500007" },
    { id: 8, name: "Olivia Martin", studentId: "202500008" },
    { id: 9, name: "Daniel Anderson", studentId: "202500009" },
    { id: 10, name: "Sophia Garcia", studentId: "202500010" },
  ]

  // State for student marks
  const [studentMarks, setStudentMarks] = useState<Record<number, string>>({})

  const handleMarkChange = (studentId: number, value: string) => {
    // Validate that the input is a number between 0 and 100
    if (value === "" || (Number(value) >= 0 && Number(value) <= 100)) {
      setStudentMarks((prev) => ({
        ...prev,
        [studentId]: value,
      }))
    }
  }

  const handleSubmit = () => {
    if (!selectedGrade || !selectedClass || !selectedSubject || !selectedTerm) {
      toast({
        title: "Missing Information",
        description: "Please select grade, class, subject, and term.",
        variant: "destructive",
      })
      return
    }

    // Check if all students have marks
    const allStudentsHaveMarks = students.every(
      (student) => studentMarks[student.id] !== undefined && studentMarks[student.id] !== "",
    )

    if (!allStudentsHaveMarks) {
      toast({
        title: "Missing Marks",
        description: "Please enter marks for all students.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    // In a real application, you would submit the marks to the server here
    setTimeout(() => {
      toast({
        title: "Marks Submitted",
        description: "Student marks have been saved successfully.",
      })
      setIsSubmitting(false)

      // Reset form
      setStudentMarks({})
    }, 1500)
  }

  return (
    <DashboardLayout user={mockUser}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Enter Student Marks</h1>

        <Card>
          <CardHeader>
            <CardTitle>Student Marks</CardTitle>
            <CardDescription>Enter marks for students in your classes</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="enter-marks">
              <TabsList className="mb-6">
                <TabsTrigger value="enter-marks">Enter Marks</TabsTrigger>
                <TabsTrigger value="view-marks">View Marks</TabsTrigger>
              </TabsList>

              <TabsContent value="enter-marks">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Grade</label>
                      <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Grade" />
                        </SelectTrigger>
                        <SelectContent>
                          {grades.map((grade) => (
                            <SelectItem key={grade.id} value={grade.id}>
                              {grade.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1 block">Class</label>
                      <Select value={selectedClass} onValueChange={setSelectedClass} disabled={!selectedGrade}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Class" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedGrade &&
                            classes[selectedGrade as keyof typeof classes]?.map((cls) => (
                              <SelectItem key={cls.id} value={cls.id}>
                                {cls.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1 block">Subject</label>
                      <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Subject" />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects.map((subject) => (
                            <SelectItem key={subject.id} value={subject.id}>
                              {subject.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1 block">Term</label>
                      <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Term" />
                        </SelectTrigger>
                        <SelectContent>
                          {terms.map((term) => (
                            <SelectItem key={term.id} value={term.id}>
                              {term.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {selectedGrade && selectedClass && selectedSubject && selectedTerm && (
                    <div className="mt-6">
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="border-b">
                              <th className="py-3 px-4 text-left">Student ID</th>
                              <th className="py-3 px-4 text-left">Student Name</th>
                              <th className="py-3 px-4 text-right">Mark (%)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {students.map((student) => (
                              <tr key={student.id} className="border-b hover:bg-gray-50">
                                <td className="py-3 px-4">{student.studentId}</td>
                                <td className="py-3 px-4 font-medium">{student.name}</td>
                                <td className="py-3 px-4">
                                  <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    className="w-24 ml-auto"
                                    value={studentMarks[student.id] || ""}
                                    onChange={(e) => handleMarkChange(student.id, e.target.value)}
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="mt-6 flex justify-end">
                        <Button onClick={handleSubmit} disabled={isSubmitting}>
                          {isSubmitting ? "Submitting..." : "Submit Marks"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="view-marks">
                <div className="text-center py-12">
                  <p className="text-gray-500">Select a class and subject to view existing marks</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
