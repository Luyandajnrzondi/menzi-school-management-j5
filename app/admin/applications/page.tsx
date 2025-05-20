"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Eye, CheckCircle, XCircle, Loader2, Search } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"

export default function AdminApplicationsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [applications, setApplications] = useState<any[]>([])
  const [filteredApplications, setFilteredApplications] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [totalApplications, setTotalApplications] = useState(0)

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem("user")

    if (!storedUser) {
      router.push("/login")
      return
    }

    const parsedUser = JSON.parse(storedUser)

    // Check if user is admin or principal
    if (parsedUser.role !== "admin" && parsedUser.role !== "principal") {
      router.push("/dashboard")
      return
    }

    setUser(parsedUser)
    fetchApplications()
  }, [router])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredApplications(applications)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = applications.filter(
        (application) =>
          application.first_name.toLowerCase().includes(query) ||
          application.last_name.toLowerCase().includes(query) ||
          application.email.toLowerCase().includes(query) ||
          application.phone.includes(query) ||
          application.id.toString().includes(query)
      )
      setFilteredApplications(filtered)
    }
  }, [searchQuery, applications])

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from("applications")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        throw error
      }

      setApplications(data || [])
      setFilteredApplications(data || [])
      setTotalApplications(data?.length || 0)
    } catch (error) {
      console.error("Error fetching applications:", error)
      toast({
        title: "Error",
        description: "Failed to load applications. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async (id: number) => {
    setIsProcessing(id)
    try {
      const { error } = await supabase
        .from("applications")
        .update({ status: "approved", updated_at: new Date().toISOString() })
        .eq("id", id)

      if (error) {
        throw error
      }

      toast({
        title: "Application Approved",
        description: "The application has been approved successfully.",
      })

      // Refresh applications
      fetchApplications()
    } catch (error) {
      console.error("Error approving application:", error)
      toast({
        title: "Error",
        description: "Failed to approve application. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(null)
    }
  }

  const handleReject = async (id: number) => {
    setIsProcessing(id)
    try {
      const { error } = await supabase
        .from("applications")
        .update({ status: "rejected", updated_at: new Date().toISOString() })
        .eq("id", id)

      if (error) {
        throw error
      }

      toast({
        title: "Application Rejected",
        description: "The application has been rejected.",
      })

      // Refresh applications
      fetchApplications()
    } catch (error) {
      console.error("Error rejecting application:", error)
      toast({
        title: "Error",
        description: "Failed to reject application. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(null)
    }
  }

  // Filter applications by status after search
  const pendingApplications = filteredApplications.filter((app) => app.status === "pending")
  const approvedApplications = filteredApplications.filter((app) => app.status === "approved")
  const rejectedApplications = filteredApplications.filter((app) => app.status === "rejected")

  if (isLoading) {
    return (
      <DashboardLayout user={user}>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout user={user}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Manage Applications</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totalApplications}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{pendingApplications.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{approvedApplications.length}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              <Input
                className="pl-10"
                placeholder="Search students by name, ID, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Application List</CardTitle>
            <CardDescription>Review and process applications for Grade 8 admission</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pending">
              <TabsList className="mb-6">
                <TabsTrigger value="pending">Pending ({pendingApplications.length})</TabsTrigger>
                <TabsTrigger value="approved">Approved ({approvedApplications.length})</TabsTrigger>
                <TabsTrigger value="rejected">Rejected ({rejectedApplications.length})</TabsTrigger>
                <TabsTrigger value="all">All ({filteredApplications.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="pending">
                {renderApplicationsTable(pendingApplications, handleApprove, handleReject, isProcessing)}
              </TabsContent>

              <TabsContent value="approved">
                {renderApplicationsTable(approvedApplications, handleApprove, handleReject, isProcessing)}
              </TabsContent>

              <TabsContent value="rejected">
                {renderApplicationsTable(rejectedApplications, handleApprove, handleReject, isProcessing)}
              </TabsContent>

              <TabsContent value="all">
                {renderApplicationsTable(filteredApplications, handleApprove, handleReject, isProcessing)}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

function renderApplicationsTable(
  applications: any[],
  handleApprove: (id: number) => void,
  handleReject: (id: number) => void,
  isProcessing: number | null,
) {
  if (applications.length === 0) {
    return <div className="text-center py-8 text-gray-500">No applications found</div>
  }

  return (
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
          {applications.map((application) => (
            <tr key={application.id} className="border-b hover:bg-gray-50">
              <td className="py-3 px-4">
                {application.first_name} {application.last_name}
              </td>


              <td className="py-3 px-4"> {application.email ? ( <a   href={`mailto:${application.email.replace(/^mailto:/i, '').trim()}`} className="text-black-600 hover:underline" > {application.email.replace(/^mailto:/i, '').trim()}
              </a>
               ) : (
               'N/A' )}
              </td>
              <td className="py-3 px-4">
                 {application.phone ? (
               <a href={`tel:${application.phone.replace(/[^\d+]/g, '').replace(/^\+?/, '+')}`} className="text-black-600 hover:underline" >
                {application.phone}
               </a>
               ) : (
                'N/A'
              )} </td>


              <td className="py-3 px-4">{new Date(application.created_at).toLocaleDateString()}</td>
              <td className="py-3 px-4">
                <Badge
                  className={
                    application.status === "approved"
                      ? "bg-green-500 hover:bg-green-600 text-white"
                      : application.status === "pending"
                        ? "bg-orange-500 hover:bg-orange-600 text-white"
                        : "bg-red-500 hover:bg-red-600 text-white"
                  }
                >
                  {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                </Badge>
              </td>
              <td className="py-3 px-4">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-blue-600 border-blue-600 hover:bg-blue-50" // Blue View button
                    asChild
                  >
                    <Link href={`/admin/applications/${application.id}`}>
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Link>
                  </Button>
                  {application.status === "pending" && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-green-600 border-green-600 hover:bg-green-50"
                        onClick={() => handleApprove(application.id)}
                        disabled={isProcessing === application.id}
                      >
                        {isProcessing === application.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-600 hover:bg-red-50"
                        onClick={() => handleReject(application.id)}
                        disabled={isProcessing === application.id}
                      >
                        {isProcessing === application.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
