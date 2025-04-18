import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, CheckCircle, XCircle } from "lucide-react"

export default async function ApplicationsPage() {
  const supabase = createServerClient()

  // Get the current user
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  // Fetch applications from the database
  const { data: applications, error } = await supabase
    .from("applications")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching applications:", error)
  }

  // For demo purposes, we'll use a mock user
  const mockUser = {
    name: "John Doe",
    email: session.user.email || "",
    role: "admin",
    avatar: "",
  }

  return (
    <DashboardLayout user={mockUser}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Applications</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{applications?.length || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {applications?.filter((app) => app.status === "pending").length || 0}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Processed</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {applications?.filter((app) => app.status !== "pending").length || 0}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Application List</CardTitle>
            <CardDescription>Review and process applications for Grade 8 admission</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="py-3 px-4 text-left">Name</th>
                    <th className="py-3 px-4 text-left">Email</th>
                    <th className="py-3 px-4 text-left">Phone</th>
                    <th className="py-3 px-4 text-left">Date Applied</th>
                    <th className="py-3 px-4 text-left">Status</th>
                    <th className="py-3 px-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications && applications.length > 0 ? (
                    applications.map((application) => (
                      <tr key={application.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          {application.first_name} {application.last_name}
                        </td>
                        <td className="py-3 px-4">{application.email}</td>
                        <td className="py-3 px-4">{application.phone}</td>
                        <td className="py-3 px-4">{new Date(application.created_at).toLocaleDateString()}</td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={
                              application.status === "approved"
                                ? "success"
                                : application.status === "rejected"
                                  ? "destructive"
                                  : "outline"
                            }
                          >
                            {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" asChild>
                              <a href={application.results_document_url} target="_blank" rel="noopener noreferrer">
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </a>
                            </Button>
                            {application.status === "pending" && (
                              <>
                                <Button variant="outline" size="sm" className="text-green-600">
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button variant="outline" size="sm" className="text-red-600">
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-gray-500">
                        No applications found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
