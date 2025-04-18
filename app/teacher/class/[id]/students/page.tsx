import { redirect } from "next/navigation"
import Link from "next/link"
import { createServerClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft } from "lucide-react"

export default async function ClassStudentsPage({ params }: { params: { id: string } }) {
  const supabase = createServerClient()

  // Get the current user
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  // For demo purposes, we'll use a mock user
  const mockUser = {
    name: "Ms. Johnson",
    email: session.user.email || "",
    role: "teacher",
    avatar: "",
  }

  // Mock class data
  const mockClass = {
    id: Number.parseInt(params.id),
    name: "8A",
    grade: "Grade 8",
    subject: "English FAL",
    students: [
      {
        id: 1,
        name: "John Doe",
        studentId: "202500001",
        gender: "male",
        average: 78,
        avatar: "",
        isRepresentative: false,
      },
      {
        id: 2,
        name: "Sarah Smith",
        studentId: "202500002",
        gender: "female",
        average: 85,
        avatar: "",
        isRepresentative: true,
      },
      {
        id: 3,
        name: "Michael Brown",
        studentId: "202500003",
        gender: "male",
        average: 72,
        avatar: "",
        isRepresentative: true,
      },
      {
        id: 4,
        name: "Emily Johnson",
        studentId: "202500004",
        gender: "female",
        average: 80,
        avatar: "",
        isRepresentative: false,
      },
      {
        id: 5,
        name: "David Wilson",
        studentId: "202500005",
        gender: "male",
        average: 65,
        avatar: "",
        isRepresentative: false,
      },
      {
        id: 6,
        name: "Jessica Lee",
        studentId: "202500006",
        gender: "female",
        average: 90,
        avatar: "",
        isRepresentative: false,
      },
      {
        id: 7,
        name: "Ryan Taylor",
        studentId: "202500007",
        gender: "male",
        average: 76,
        avatar: "",
        isRepresentative: false,
      },
      {
        id: 8,
        name: "Olivia Martin",
        studentId: "202500008",
        gender: "female",
        average: 82,
        avatar: "",
        isRepresentative: false,
      },
      {
        id: 9,
        name: "Daniel Anderson",
        studentId: "202500009",
        gender: "male",
        average: 68,
        avatar: "",
        isRepresentative: false,
      },
      {
        id: 10,
        name: "Sophia Garcia",
        studentId: "202500010",
        gender: "female",
        average: 88,
        avatar: "",
        isRepresentative: false,
      },
    ],
  }

  // Sort students by average mark (descending)
  const sortedStudents = [...mockClass.students].sort((a, b) => b.average - a.average)

  return (
    <DashboardLayout user={mockUser}>
      <div className="p-6">
        <div className="flex items-center mb-6">
          <Link href="/teacher/my-classes">
            <Button variant="outline" size="sm" className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Classes
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">
            {mockClass.grade} {mockClass.name} - Students
          </h1>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Class Information</CardTitle>
            <CardDescription>
              Overview of {mockClass.grade} {mockClass.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Total Students</h3>
                <p className="mt-1 font-medium">{mockClass.students.length}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Class Representatives</h3>
                <p className="mt-1 font-medium">
                  {mockClass.students
                    .filter((s) => s.isRepresentative)
                    .map((s) => s.name)
                    .join(", ")}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Average Performance</h3>
                <p className="mt-1 font-medium">
                  {Math.round(
                    mockClass.students.reduce((sum, student) => sum + student.average, 0) / mockClass.students.length,
                  )}
                  %
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Student List</CardTitle>
            <CardDescription>
              All students in {mockClass.grade} {mockClass.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="py-3 px-4 text-left">Rank</th>
                    <th className="py-3 px-4 text-left">Student ID</th>
                    <th className="py-3 px-4 text-left">Name</th>
                    <th className="py-3 px-4 text-left">Gender</th>
                    <th className="py-3 px-4 text-right">Average</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedStudents.map((student, index) => (
                    <tr key={student.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{index + 1}</td>
                      <td className="py-3 px-4">{student.studentId}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={student.avatar || "/placeholder.svg"} />
                            <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{student.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 capitalize">{student.gender}</td>
                      <td className="py-3 px-4 text-right font-medium">{student.average}%</td>
                      <td className="py-3 px-4 text-center">
                        {student.isRepresentative && (
                          <Badge variant="outline">{student.gender === "male" ? "Boy" : "Girl"} Rep</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/teacher/student/${student.id}`}>View Profile</Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
