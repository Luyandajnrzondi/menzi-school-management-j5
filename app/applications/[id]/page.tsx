import { redirect } from "next/navigation"
import Link from "next/link"
import { createServerClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Download, CheckCircle, XCircle } from "lucide-react"

export default async function ApplicationDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerClient()

  // Get the current user
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  // Fetch application details
  const { data: application, error } = await supabase.from("applications").select("*").eq("id", params.id).single()

  if (error || !application) {
    redirect("/applications")
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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Link href="/applications">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Applications
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Application Details</h1>
          </div>

          <Badge
            variant={
              application.status === "approved"
                ? "success"
                : application.status === "rejected"
                  ? "destructive"
                  : "outline"
            }
            className="text-sm py-1 px-3"
          >
            {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Student Information</CardTitle>
                <CardDescription>Personal details of the applicant</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Full Name</h3>
                  <p className="mt-1">
                    {application.first_name} {application.last_name}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Email</h3>
                  <p className="mt-1">{application.email}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Phone</h3>
                  <p className="mt-1">{application.phone}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Date of Birth</h3>
                  <p className="mt-1">{new Date(application.date_of_birth).toLocaleDateString()}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Gender</h3>
                  <p className="mt-1 capitalize">{application.gender}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Address</h3>
                  <p className="mt-1">{application.address}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Parent/Guardian Information</CardTitle>
                <CardDescription>Contact details of the parent or guardian</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Name</h3>
                  <p className="mt-1">{application.parent_name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Phone</h3>
                  <p className="mt-1">{application.parent_phone}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Email</h3>
                  <p className="mt-1">{application.parent_email || "Not provided"}</p>
                </div>
              </CardContent>
            </Card>

            {application.comments && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Comments</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{application.comments}</p>
                </CardContent>
              </Card>
            )}
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Application Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Application ID</h3>
                  <p className="mt-1">{application.id}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Date Applied</h3>
                  <p className="mt-1">{new Date(application.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Academic Year</h3>
                  <p className="mt-1">{application.academic_year}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Grade 7 Results</h3>
                  <Button variant="outline" className="mt-2 w-full" asChild>
                    <a href={application.results_document_url} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4 mr-2" />
                      View Results
                    </a>
                  </Button>
                </div>
              </CardContent>

              {application.status === "pending" && (
                <CardFooter className="flex flex-col space-y-2">
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve Application
                  </Button>
                  <Button variant="outline" className="w-full text-red-600">
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject Application
                  </Button>
                </CardFooter>
              )}
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
