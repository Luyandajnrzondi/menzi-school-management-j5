import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

export default async function TopStudentsPage() {
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
    name: "Dr. Principal",
    email: session.user.email || "",
    role: "principal",
    avatar: "",
  }

  // Mock top students data
  const mockTopStudents = {
    school: [
      { id: 1, name: "Sarah Johnson", grade: "Grade 12", class: "12A", average: 95.8, avatar: "" },
      { id: 2, name: "Michael Chen", grade: "Grade 12", class: "12B", average: 94.3, avatar: "" },
      { id: 3, name: "Emily Williams", grade: "Grade 11", class: "11A", average: 93.7, avatar: "" },
      { id: 4, name: "David Patel", grade: "Grade 12", class: "12A", average: 93.2, avatar: "" },
      { id: 5, name: "Olivia Martinez", grade: "Grade 10", class: "10C", average: 92.9, avatar: "" },
      { id: 6, name: "James Wilson", grade: "Grade 11", class: "11B", average: 92.5, avatar: "" },
      { id: 7, name: "Sophia Lee", grade: "Grade 12", class: "12C", average: 92.1, avatar: "" },
      { id: 8, name: "Daniel Kim", grade: "Grade 10", class: "10A", average: 91.8, avatar: "" },
      { id: 9, name: "Ava Thompson", grade: "Grade 11", class: "11A", average: 91.4, avatar: "" },
      { id: 10, name: "Ethan Brown", grade: "Grade 9", class: "9B", average: 91.2, avatar: "" },
      { id: 11, name: "Isabella Garcia", grade: "Grade 12", class: "12B", average: 90.9, avatar: "" },
      { id: 12, name: "Noah Robinson", grade: "Grade 10", class: "10B", average: 90.7, avatar: "" },
      { id: 13, name: "Mia Taylor", grade: "Grade 11", class: "11C", average: 90.4, avatar: "" },
      { id: 14, name: "Alexander Davis", grade: "Grade 9", class: "9A", average: 90.1, avatar: "" },
      { id: 15, name: "Charlotte White", grade: "Grade 10", class: "10A", average: 89.8, avatar: "" },
      { id: 16, name: "Benjamin Harris", grade: "Grade 12", class: "12A", average: 89.5, avatar: "" },
      { id: 17, name: "Amelia Clark", grade: "Grade 11", class: "11B", average: 89.2, avatar: "" },
      { id: 18, name: "Lucas Lewis", grade: "Grade 9", class: "9C", average: 88.9, avatar: "" },
      { id: 19, name: "Harper Walker", grade: "Grade 10", class: "10C", average: 88.6, avatar: "" },
      { id: 20, name: "Mason Green", grade: "Grade 12", class: "12C", average: 88.3, avatar: "" },
    ],
    grade12: [
      { id: 1, name: "Sarah Johnson", grade: "Grade 12", class: "12A", average: 95.8, avatar: "" },
      { id: 2, name: "Michael Chen", grade: "Grade 12", class: "12B", average: 94.3, avatar: "" },
      { id: 4, name: "David Patel", grade: "Grade 12", class: "12A", average: 93.2, avatar: "" },
      { id: 7, name: "Sophia Lee", grade: "Grade 12", class: "12C", average: 92.1, avatar: "" },
      { id: 11, name: "Isabella Garcia", grade: "Grade 12", class: "12B", average: 90.9, avatar: "" },
      { id: 16, name: "Benjamin Harris", grade: "Grade 12", class: "12A", average: 89.5, avatar: "" },
      { id: 20, name: "Mason Green", grade: "Grade 12", class: "12C", average: 88.3, avatar: "" },
      { id: 22, name: "Abigail Turner", grade: "Grade 12", class: "12B", average: 87.9, avatar: "" },
      { id: 25, name: "William Adams", grade: "Grade 12", class: "12A", average: 87.1, avatar: "" },
      { id: 28, name: "Sofia Rodriguez", grade: "Grade 12", class: "12C", average: 86.5, avatar: "" },
    ],
    // Similar data for other grades
    grade11: [],
    grade10: [],
    grade9: [],
    grade8: [],
    // Data for classes
    "12A": [],
    "12B": [],
    "12C": [],
    // And so on...
  }

  return (
    <DashboardLayout user={mockUser}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Top Students</h1>

        <Tabs defaultValue="school">
          <TabsList className="mb-6">
            <TabsTrigger value="school">School Top 20</TabsTrigger>
            <TabsTrigger value="grade12">Grade 12</TabsTrigger>
            <TabsTrigger value="grade11">Grade 11</TabsTrigger>
            <TabsTrigger value="grade10">Grade 10</TabsTrigger>
            <TabsTrigger value="grade9">Grade 9</TabsTrigger>
            <TabsTrigger value="grade8">Grade 8</TabsTrigger>
          </TabsList>

          <TabsContent value="school">
            <Card>
              <CardHeader>
                <CardTitle>Top 20 Students in School</CardTitle>
                <CardDescription>Students with the highest academic performance across all grades</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="py-3 px-4 text-left">Rank</th>
                        <th className="py-3 px-4 text-left">Student</th>
                        <th className="py-3 px-4 text-left">Grade</th>
                        <th className="py-3 px-4 text-left">Class</th>
                        <th className="py-3 px-4 text-right">Average</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockTopStudents.school.map((student, index) => (
                        <tr key={student.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <Badge
                              variant={index < 3 ? "default" : "outline"}
                              className="w-8 h-8 rounded-full flex items-center justify-center"
                            >
                              {index + 1}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={student.avatar || "/placeholder.svg"} />
                                <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{student.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">{student.grade}</td>
                          <td className="py-3 px-4">{student.class}</td>
                          <td className="py-3 px-4 text-right font-medium">{student.average}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="grade12">
            <Card>
              <CardHeader>
                <CardTitle>Top 10 Students in Grade 12</CardTitle>
                <CardDescription>Students with the highest academic performance in Grade 12</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="py-3 px-4 text-left">Rank</th>
                        <th className="py-3 px-4 text-left">Student</th>
                        <th className="py-3 px-4 text-left">Class</th>
                        <th className="py-3 px-4 text-right">Average</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockTopStudents.grade12.map((student, index) => (
                        <tr key={student.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <Badge
                              variant={index < 3 ? "default" : "outline"}
                              className="w-8 h-8 rounded-full flex items-center justify-center"
                            >
                              {index + 1}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={student.avatar || "/placeholder.svg"} />
                                <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{student.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">{student.class}</td>
                          <td className="py-3 px-4 text-right font-medium">{student.average}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Similar content for other tabs */}
          <TabsContent value="grade11">
            <Card>
              <CardHeader>
                <CardTitle>Top 10 Students in Grade 11</CardTitle>
                <CardDescription>Students with the highest academic performance in Grade 11</CardDescription>
              </CardHeader>
              <CardContent className="text-center py-12">
                <p className="text-gray-500">Grade 11 top students will be displayed here</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
