import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

export default async function MyClassPage() {
  const supabase = createServerClient()

  // Get the current user
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  // For demo purposes, we'll use mock data
  const mockUser = {
    name: "John Doe",
    email: session.user.email || "",
    role: "student",
    avatar: "",
  }

  // Mock class data
  const mockClass = {
    name: "8A",
    grade: "Grade 8",
    teacher: {
      name: "Ms. Johnson",
      subject: "English",
      email: "johnson@school.edu",
      avatar: "",
    },
    representatives: [
      { name: "Sarah Smith", gender: "female", avatar: "" },
      { name: "Michael Brown", gender: "male", avatar: "" },
    ],
    students: [
      { id: 1, name: "John Doe", gender: "male", avatar: "", isRepresentative: false },
      { id: 2, name: "Sarah Smith", gender: "female", avatar: "", isRepresentative: true },
      { id: 3, name: "Michael Brown", gender: "male", avatar: "", isRepresentative: true },
      { id: 4, name: "Emily Johnson", gender: "female", avatar: "", isRepresentative: false },
      { id: 5, name: "David Wilson", gender: "male", avatar: "", isRepresentative: false },
      { id: 6, name: "Jessica Lee", gender: "female", avatar: "", isRepresentative: false },
      { id: 7, name: "Ryan Taylor", gender: "male", avatar: "", isRepresentative: false },
      { id: 8, name: "Olivia Martin", gender: "female", avatar: "", isRepresentative: false },
      { id: 9, name: "Daniel Anderson", gender: "male", avatar: "", isRepresentative: false },
      { id: 10, name: "Sophia Garcia", gender: "female", avatar: "", isRepresentative: false },
      { id: 11, name: "Ethan Martinez", gender: "male", avatar: "", isRepresentative: false },
      { id: 12, name: "Ava Robinson", gender: "female", avatar: "", isRepresentative: false },
    ],
  }

  return (
    <DashboardLayout user={mockUser}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">My Class: {mockClass.name}</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Class Teacher</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={mockClass.teacher.avatar || "/placeholder.svg"} />
                  <AvatarFallback>{mockClass.teacher.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{mockClass.teacher.name}</p>
                  <p className="text-sm text-gray-500">{mockClass.teacher.subject} Teacher</p>
                  <p className="text-sm text-gray-500">{mockClass.teacher.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Class Representatives</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockClass.representatives.map((rep, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={rep.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{rep.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{rep.name}</p>
                      <p className="text-sm text-gray-500 capitalize">{rep.gender} Representative</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Class Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Grade:</span>
                  <span className="font-medium">{mockClass.grade}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Class:</span>
                  <span className="font-medium">{mockClass.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Students:</span>
                  <span className="font-medium">{mockClass.students.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Classmates</CardTitle>
            <CardDescription>
              All students in {mockClass.grade} {mockClass.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {mockClass.students.map((student) => (
                <div key={student.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={student.avatar || "/placeholder.svg"} />
                    <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{student.name}</p>
                    {student.isRepresentative && (
                      <Badge variant="outline" className="text-xs">
                        {student.gender === "male" ? "Boy" : "Girl"} Rep
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
