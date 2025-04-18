import { redirect } from "next/navigation"
import Link from "next/link"
import { createServerClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, BookOpen, FileText } from "lucide-react"

export default async function TeacherClassesPage() {
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

  // Mock classes data
  const mockClasses = [
    {
      id: 1,
      name: "8A",
      grade: "Grade 8",
      subject: "English FAL",
      students: 30,
      averageMark: 76,
      isClassTeacher: true,
    },
    {
      id: 2,
      name: "8B",
      grade: "Grade 8",
      subject: "English FAL",
      students: 32,
      averageMark: 72,
      isClassTeacher: false,
    },
    {
      id: 3,
      name: "9A",
      grade: "Grade 9",
      subject: "English FAL",
      students: 28,
      averageMark: 74,
      isClassTeacher: false,
    },
    {
      id: 4,
      name: "9B",
      grade: "Grade 9",
      subject: "English FAL",
      students: 29,
      averageMark: 71,
      isClassTeacher: false,
    },
  ]

  return (
    <DashboardLayout user={mockUser}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">My Classes</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockClasses.map((cls) => (
            <Card key={cls.id} className={cls.isClassTeacher ? "border-2 border-primary" : ""}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      {cls.grade} {cls.name}
                    </CardTitle>
                    <CardDescription>{cls.subject}</CardDescription>
                  </div>
                  {cls.isClassTeacher && <Badge>Class Teacher</Badge>}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Students:</span>
                    <span className="font-medium">{cls.students}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Average Mark:</span>
                    <span className="font-medium">{cls.averageMark}%</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-4">
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href={`/teacher/class/${cls.id}/students`}>
                        <Users className="h-4 w-4 mr-1" />
                        Students
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href={`/teacher/class/${cls.id}/marks`}>
                        <FileText className="h-4 w-4 mr-1" />
                        Marks
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href={`/teacher/class/${cls.id}/materials`}>
                        <BookOpen className="h-4 w-4 mr-1" />
                        Materials
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
