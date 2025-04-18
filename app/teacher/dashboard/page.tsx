"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, BookOpen, FileText, ClipboardList } from "lucide-react"

export default function TeacherDashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem("user")

    if (!storedUser) {
      router.push("/login")
      return
    }

    const parsedUser = JSON.parse(storedUser)

    // Check if user is teacher
    if (parsedUser.role !== "teacher") {
      router.push("/dashboard")
      return
    }

    setUser(parsedUser)
    setIsLoading(false)
  }, [router])

  if (isLoading) {
    return <div>Loading...</div>
  }

  // Mock data for teacher dashboard
  const teacherStats = {
    totalClasses: 4,
    totalStudents: 120,
    upcomingAssessments: 3,
    pendingMarks: 2,
  }

  // Mock classes
  const teacherClasses = [
    {
      id: 1,
      name: "8A",
      grade: "Grade 8",
      subject: "English FAL",
      students: 30,
      isClassTeacher: true,
    },
    {
      id: 2,
      name: "8B",
      grade: "Grade 8",
      subject: "English FAL",
      students: 32,
      isClassTeacher: false,
    },
    {
      id: 3,
      name: "9A",
      grade: "Grade 9",
      subject: "English FAL",
      students: 28,
      isClassTeacher: false,
    },
    {
      id: 4,
      name: "9B",
      grade: "Grade 9",
      subject: "English FAL",
      students: 29,
      isClassTeacher: false,
    },
  ]

  // Mock recent activities
  const recentActivities = [
    {
      id: 1,
      type: "marks",
      description: "Entered marks for Grade 8A English Test",
      date: "2 hours ago",
    },
    {
      id: 2,
      type: "attendance",
      description: "Marked attendance for Grade 9B",
      date: "Yesterday",
    },
    {
      id: 3,
      type: "material",
      description: "Uploaded study notes for Grade 8 English",
      date: "2 days ago",
    },
  ]

  return (
    <DashboardLayout user={user}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Teacher Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">My Classes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{teacherStats.totalClasses}</p>
              <p className="text-sm text-gray-500">Classes assigned</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">My Students</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{teacherStats.totalStudents}</p>
              <p className="text-sm text-gray-500">Total students</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Upcoming Assessments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{teacherStats.upcomingAssessments}</p>
              <p className="text-sm text-gray-500">Tests and assignments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Pending Marks</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{teacherStats.pendingMarks}</p>
              <p className="text-sm text-gray-500">Assessments to grade</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>My Classes</CardTitle>
                <CardDescription>Classes you are teaching this academic year</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {teacherClasses.map((cls) => (
                    <Card key={cls.id} className={cls.isClassTeacher ? "border-2 border-primary" : ""}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold">
                              {cls.grade} {cls.name}
                            </h3>
                            <p className="text-sm text-gray-500">{cls.subject}</p>
                          </div>
                          {cls.isClassTeacher && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                              Class Teacher
                            </span>
                          )}
                        </div>
                        <p className="text-sm mb-3">
                          <span className="text-gray-500">Students:</span> {cls.students}
                        </p>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" asChild className="flex-1">
                            <Link href={`/teacher/class/${cls.id}/students`}>
                              <Users className="h-4 w-4 mr-1" />
                              Students
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" asChild className="flex-1">
                            <Link href={`/teacher/class/${cls.id}/marks`}>
                              <FileText className="h-4 w-4 mr-1" />
                              Marks
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <div className="mt-4 text-center">
                  <Button asChild>
                    <Link href="/teacher/my-classes">View All Classes</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/teacher/marks">
                    <FileText className="h-4 w-4 mr-2" />
                    Enter Marks
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/teacher/attendance">
                    <ClipboardList className="h-4 w-4 mr-2" />
                    Take Attendance
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/teacher/learning-materials/upload">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Upload Learning Materials
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3 pb-3 border-b last:border-0">
                      <div className="bg-gray-100 p-2 rounded-full">
                        {activity.type === "marks" && <FileText className="h-4 w-4" />}
                        {activity.type === "attendance" && <ClipboardList className="h-4 w-4" />}
                        {activity.type === "material" && <BookOpen className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="text-sm">{activity.description}</p>
                        <p className="text-xs text-gray-500">{activity.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
