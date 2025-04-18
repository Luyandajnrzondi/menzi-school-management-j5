import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, FileText } from "lucide-react"

export default async function LearningMaterialsPage() {
  const supabase = createServerClient()

  // Get the current user
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  // Fetch grades
  const { data: grades } = await supabase.from("grades").select("*").order("id")

  // Fetch subjects
  const { data: subjects } = await supabase.from("subjects").select("*").order("name")

  // Fetch learning materials
  const { data: materials } = await supabase
    .from("learning_materials")
    .select(`
      *,
      subjects(name),
      grades(name),
      teachers(first_name, last_name)
    `)
    .order("created_at", { ascending: false })

  // For demo purposes, we'll use a mock user
  const mockUser = {
    name: "John Doe",
    email: session.user.email || "",
    role: "student", // This would be fetched from the database
    avatar: "",
  }

  // Group materials by grade
  const materialsByGrade = grades?.reduce(
    (acc, grade) => {
      acc[grade.id] = materials?.filter((material) => material.grade_id === grade.id) || []
      return acc
    },
    {} as Record<number, typeof materials>,
  )

  return (
    <DashboardLayout user={mockUser}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Learning Materials</h1>

        <Tabs defaultValue={grades?.[0]?.id.toString()}>
          <TabsList className="mb-6">
            {grades?.map((grade) => (
              <TabsTrigger key={grade.id} value={grade.id.toString()}>
                {grade.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {grades?.map((grade) => (
            <TabsContent key={grade.id} value={grade.id.toString()}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {materialsByGrade?.[grade.id]?.length ? (
                  materialsByGrade[grade.id].map((material) => (
                    <Card key={material.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{material.title}</CardTitle>
                            <CardDescription>
                              {material.subjects?.name} - {material.grades?.name}
                            </CardDescription>
                          </div>
                          <Badge>
                            {material.material_type === "textbook"
                              ? "Textbook"
                              : material.material_type === "notes"
                                ? "Notes"
                                : "Past Paper"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 mb-4">
                          {material.description || "No description provided."}
                        </p>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">
                            Uploaded by: {material.teachers?.first_name} {material.teachers?.last_name}
                          </span>
                          <Button variant="outline" size="sm" asChild>
                            <a href={material.file_url} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </a>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <div className="flex flex-col items-center">
                      <FileText className="h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium mb-2">No materials available</h3>
                      <p className="text-gray-500 mb-4">
                        There are no learning materials available for {grade.name} yet.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
