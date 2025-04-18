import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

export default async function ResultsPage() {
  const supabase = createServerClient()

  // Get the current user
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  // For demo purposes, we'll use a mock user and results
  const mockUser = {
    name: "John Doe",
    email: session.user.email || "",
    role: "student",
    avatar: "",
  }

  // Mock terms
  const terms = [
    { id: 1, name: "Term 1", year: 2025 },
    { id: 2, name: "Term 2", year: 2025 },
    { id: 3, name: "Term 3", year: 2025 },
    { id: 4, name: "Term 4", year: 2025 },
  ]

  // Mock results
  const mockResults = [
    { subject: "English FAL", term1: 78, term2: 82, term3: 75, term4: 80, average: 79, grade: "B" },
    { subject: "IsiZulu Home Language", term1: 85, term2: 88, term3: 90, term4: 92, average: 89, grade: "A" },
    { subject: "Life Orientation", term1: 90, term2: 92, term3: 88, term4: 94, average: 91, grade: "A" },
    { subject: "Mathematics", term1: 65, term2: 70, term3: 68, term4: 72, average: 69, grade: "C" },
    { subject: "Physical Sciences", term1: 72, term2: 75, term3: 70, term4: 78, average: 74, grade: "B" },
    { subject: "Life Sciences", term1: 80, term2: 82, term3: 78, term4: 85, average: 81, grade: "B" },
    { subject: "Geography", term1: 76, term2: 78, term3: 75, term4: 80, average: 77, grade: "B" },
  ]

  // Calculate overall average
  const overallAverage = Math.round(mockResults.reduce((sum, result) => sum + result.average, 0) / mockResults.length)

  // Determine overall grade
  const getOverallGrade = (average: number) => {
    if (average >= 80) return "A"
    if (average >= 70) return "B"
    if (average >= 60) return "C"
    if (average >= 50) return "D"
    if (average >= 40) return "E"
    return "F"
  }

  const overallGrade = getOverallGrade(overallAverage)

  return (
    <DashboardLayout user={mockUser}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Academic Results</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Overall Average</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <p className="text-3xl font-bold">{overallAverage}%</p>
                <Badge className="ml-2" variant={overallGrade === "A" ? "default" : "outline"}>
                  Grade {overallGrade}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Class Rank</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                5<span className="text-lg text-gray-500">/30</span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Grade Rank</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                18<span className="text-lg text-gray-500">/120</span>
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Subject Results</CardTitle>
            <CardDescription>View your academic performance across all terms</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList className="mb-6">
                <TabsTrigger value="all">All Terms</TabsTrigger>
                {terms.map((term) => (
                  <TabsTrigger key={term.id} value={term.id.toString()}>
                    {term.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="all">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="py-3 px-4 text-left">Subject</th>
                        <th className="py-3 px-4 text-center">Term 1</th>
                        <th className="py-3 px-4 text-center">Term 2</th>
                        <th className="py-3 px-4 text-center">Term 3</th>
                        <th className="py-3 px-4 text-center">Term 4</th>
                        <th className="py-3 px-4 text-center">Average</th>
                        <th className="py-3 px-4 text-center">Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockResults.map((result, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{result.subject}</td>
                          <td className="py-3 px-4 text-center">{result.term1}%</td>
                          <td className="py-3 px-4 text-center">{result.term2}%</td>
                          <td className="py-3 px-4 text-center">{result.term3}%</td>
                          <td className="py-3 px-4 text-center">{result.term4}%</td>
                          <td className="py-3 px-4 text-center font-medium">{result.average}%</td>
                          <td className="py-3 px-4 text-center">
                            <Badge variant={result.grade === "A" ? "default" : "outline"}>{result.grade}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50">
                        <td className="py-3 px-4 font-bold">Overall</td>
                        <td className="py-3 px-4 text-center font-medium">
                          {Math.round(mockResults.reduce((sum, result) => sum + result.term1, 0) / mockResults.length)}%
                        </td>
                        <td className="py-3 px-4 text-center font-medium">
                          {Math.round(mockResults.reduce((sum, result) => sum + result.term2, 0) / mockResults.length)}%
                        </td>
                        <td className="py-3 px-4 text-center font-medium">
                          {Math.round(mockResults.reduce((sum, result) => sum + result.term3, 0) / mockResults.length)}%
                        </td>
                        <td className="py-3 px-4 text-center font-medium">
                          {Math.round(mockResults.reduce((sum, result) => sum + result.term4, 0) / mockResults.length)}%
                        </td>
                        <td className="py-3 px-4 text-center font-bold">{overallAverage}%</td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant={overallGrade === "A" ? "default" : "outline"}>{overallGrade}</Badge>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </TabsContent>

              {terms.map((term) => (
                <TabsContent key={term.id} value={term.id.toString()}>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="py-3 px-4 text-left">Subject</th>
                          <th className="py-3 px-4 text-center">Mark</th>
                          <th className="py-3 px-4 text-center">Grade</th>
                          <th className="py-3 px-4 text-left">Teacher Comment</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mockResults.map((result, index) => {
                          const termMark = result[`term${term.id}` as keyof typeof result] as number
                          const termGrade = getOverallGrade(termMark)

                          return (
                            <tr key={index} className="border-b hover:bg-gray-50">
                              <td className="py-3 px-4 font-medium">{result.subject}</td>
                              <td className="py-3 px-4 text-center font-medium">{termMark}%</td>
                              <td className="py-3 px-4 text-center">
                                <Badge variant={termGrade === "A" ? "default" : "outline"}>{termGrade}</Badge>
                              </td>
                              <td className="py-3 px-4 text-gray-600">
                                {termMark >= 80
                                  ? "Excellent work! Keep it up."
                                  : termMark >= 70
                                    ? "Good performance. Continue to work hard."
                                    : termMark >= 60
                                      ? "Satisfactory work. Room for improvement."
                                      : termMark >= 50
                                        ? "Passing, but needs more effort."
                                        : "Needs significant improvement. Please seek help."}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-50">
                          <td className="py-3 px-4 font-bold">Term Average</td>
                          <td className="py-3 px-4 text-center font-bold">
                            {Math.round(
                              mockResults.reduce((sum, result) => {
                                const termMark = result[`term${term.id}` as keyof typeof result] as number
                                return sum + termMark
                              }, 0) / mockResults.length,
                            )}
                            %
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Badge>
                              {getOverallGrade(
                                Math.round(
                                  mockResults.reduce((sum, result) => {
                                    const termMark = result[`term${term.id}` as keyof typeof result] as number
                                    return sum + termMark
                                  }, 0) / mockResults.length,
                                ),
                              )}
                            </Badge>
                          </td>
                          <td className="py-3 px-4"></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
