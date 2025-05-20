"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, ArrowLeft, Mail, Phone, Calendar, User, MapPin, FileText, CheckCircle, XCircle } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"

export default function ApplicationDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [application, setApplication] = useState<any>(null)
  const [comments, setComments] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)

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
    fetchApplication()
  }, [router, params])

  const fetchApplication = async () => {
    try {
      const { data, error } = await supabase.from("applications").select("*").eq("id", params.id).single()

      if (error) throw error

      setApplication(data)
      setComments(data.comments || "")
    } catch (error) {
      console.error("Error fetching application:", error)
      toast({
        title: "Error",
        description: "Failed to load application details. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async () => {
    setIsProcessing(true)
    try {
      const { error } = await supabase
        .from("applications")
        .update({
          status: "approved",
          comments: comments,
        })
        .eq("id", application.id)

      if (error) throw error

      // Create notification
      await supabase.from("notifications").insert({
        title: "Application Approved",
        message: `The application for ${application.first_name} ${application.last_name} has been approved.`,
        notification_type: "application",
        is_read: false,
      })

      toast({
        title: "Application Approved",
        description: "The application has been approved successfully.",
      })

      // Refresh application data
      fetchApplication()
    } catch (error) {
      console.error("Error approving application:", error)
      toast({
        title: "Error",
        description: "Failed to approve application. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!comments.trim()) {
      toast({
        title: "Comments Required",
        description: "Please provide a reason for rejecting this application.",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    try {
      const { error } = await supabase
        .from("applications")
        .update({
          status: "rejected",
          comments: comments,
        })
        .eq("id", application.id)

      if (error) throw error

      // Create notification
      await supabase.from("notifications").insert({
        title: "Application Rejected",
        message: `The application for ${application.first_name} ${application.last_name} has been rejected.`,
        notification_type: "application",
        is_read: false,
      })

      toast({
        title: "Application Rejected",
        description: "The application has been rejected successfully.",
      })

      // Refresh application data
      fetchApplication()
    } catch (error) {
      console.error("Error rejecting application:", error)
      toast({
        title: "Error",
        description: "Failed to reject application. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const getMarkDescription = (level: string) => {
    const levelNum = Number.parseInt(level)
    switch (levelNum) {
      case 1:
        return "0-29%"
      case 2:
        return "30-39%"
      case 3:
        return "40-49%"
      case 4:
        return "50-59%"
      case 5:
        return "60-69%"
      case 6:
        return "70-79%"
      case 7:
        return "80-89%"
      case 8:
        return "90-100%"
      default:
        return "Unknown"
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout user={user}>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    )
  }

  if (!application) {
    return (
      <DashboardLayout user={user}>
        <div className="p-6">
          <div className="flex items-center mb-6">
            <Button variant="outline" size="sm" onClick={() => router.back()} className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">Application Not Found</h1>
          </div>
          <Card>
            <CardContent className="p-6 text-center">
              <p className="mb-4">The application you are looking for does not exist or has been removed.</p>
              <Button asChild>
                <Link href="/admin/applications">Return to Applications List</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout user={user}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button variant="outline" size="sm" onClick={() => router.back()} className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">Application Details</h1>
          </div>
          <Badge
            className={
              application.status === "pending"
                ? "bg-yellow-500"
                : application.status === "approved"
                  ? "bg-green-500"
                  : "bg-red-500"
            }
          >
            {application.status.toUpperCase()}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Applicant Information</CardTitle>
                <CardDescription>Personal details of the applicant</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">Full Name</p>
                    <p className="font-medium">
                      {application.first_name} {application.last_name}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 text-gray-500 mr-2" />
                      <p>{application.email}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">Phone</p>
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 text-gray-500 mr-2" />
                      <p>{application.phone}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">Date of Birth</p>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                      <p>{new Date(application.date_of_birth).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">Gender</p>
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-gray-500 mr-2" />
                      <p className="capitalize">{application.gender}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">Academic Year</p>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                      <p>{application.academic_year}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Address</p>
                  <div className="flex items-start">
                    <MapPin className="h-4 w-4 text-gray-500 mr-2 mt-1" />
                    <p>{application.address}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Parent/Guardian Information</CardTitle>
                <CardDescription>Contact details of the parent or guardian</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">Name</p>
                    <p className="font-medium">{application.parent_name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">Phone</p>
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 text-gray-500 mr-2" />
                      <p>{application.parent_phone}</p>
                    </div>
                  </div>
                  {application.parent_email && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-500">Email</p>
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 text-gray-500 mr-2" />
                        <p>{application.parent_email}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Grade 7 Results</CardTitle>
                <CardDescription>Academic performance in Grade 7</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="term3">
                  <TabsList className="mb-4">
                    <TabsTrigger value="term3">Term 3 Results</TabsTrigger>
                    <TabsTrigger value="term4">Term 4 Results</TabsTrigger>
                  </TabsList>

                  <TabsContent value="term3">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="py-2 px-4 text-left">Subject</th>
                            <th className="py-2 px-4 text-left">Level</th>
                            <th className="py-2 px-4 text-left">Mark Range</th>
                          </tr>
                        </thead>
                        <tbody>
                          {application.results_data && (
                            <>
                              <tr className="border-b">
                                <td className="py-2 px-4 font-medium">English</td>
                                <td className="py-2 px-4">Level {application.results_data.term3.english}</td>
                                <td className="py-2 px-4">
                                  {getMarkDescription(application.results_data.term3.english)}
                                </td>
                              </tr>
                              <tr className="border-b">
                                <td className="py-2 px-4 font-medium">Mathematics</td>
                                <td className="py-2 px-4">Level {application.results_data.term3.mathematics}</td>
                                <td className="py-2 px-4">
                                  {getMarkDescription(application.results_data.term3.mathematics)}
                                </td>
                              </tr>
                              <tr className="border-b">
                                <td className="py-2 px-4 font-medium">Science</td>
                                <td className="py-2 px-4">Level {application.results_data.term3.science}</td>
                                <td className="py-2 px-4">
                                  {getMarkDescription(application.results_data.term3.science)}
                                </td>
                              </tr>
                            </>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </TabsContent>

                  <TabsContent value="term4">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="py-2 px-4 text-left">Subject</th>
                            <th className="py-2 px-4 text-left">Level</th>
                            <th className="py-2 px-4 text-left">Mark Range</th>
                          </tr>
                        </thead>
                        <tbody>
                          {application.results_data && (
                            <>
                              <tr className="border-b">
                                <td className="py-2 px-4 font-medium">English</td>
                                <td className="py-2 px-4">Level {application.results_data.term4.english}</td>
                                <td className="py-2 px-4">
                                  {getMarkDescription(application.results_data.term4.english)}
                                </td>
                              </tr>
                              <tr className="border-b">
                                <td className="py-2 px-4 font-medium">Mathematics</td>
                                <td className="py-2 px-4">Level {application.results_data.term4.mathematics}</td>
                                <td className="py-2 px-4">
                                  {getMarkDescription(application.results_data.term4.mathematics)}
                                </td>
                              </tr>
                              <tr className="border-b">
                                <td className="py-2 px-4 font-medium">Science</td>
                                <td className="py-2 px-4">Level {application.results_data.term4.science}</td>
                                <td className="py-2 px-4">
                                  {getMarkDescription(application.results_data.term4.science)}
                                </td>
                              </tr>
                            </>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
              <CardFooter>
                <div className="w-full">
                  <p className="text-sm font-medium text-gray-500 mb-2">Results Document</p>
                  <Button variant="outline" className="w-full" asChild>
                    <a href={application.results_document_url} target="_blank" rel="noopener noreferrer">
                      <FileText className="h-4 w-4 mr-2" />
                      View Results Document
                    </a>
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Application Status</CardTitle>
                <CardDescription>Current status of the application</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <Badge
                    className={
                      application.status === "pending"
                        ? "bg-yellow-500"
                        : application.status === "approved"
                          ? "bg-green-500"
                          : "bg-red-500"
                    }
                  >
                    {application.status.toUpperCase()}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Submitted On</p>
                  <p>{new Date(application.created_at).toLocaleString()}</p>
                </div>
                {application.updated_at !== application.created_at && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">Last Updated</p>
                    <p>{new Date(application.updated_at).toLocaleString()}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Comments</CardTitle>
                <CardDescription>Add comments or notes about this application</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Add your comments here..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={5}
                  className="resize-none"
                />
              </CardContent>
            </Card>

            {application.status === "pending" && (
              <Card>
                <CardHeader>
                  <CardTitle>Process Application</CardTitle>
                  <CardDescription>Approve or reject this application</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={handleApprove}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Approve Application
                  </Button>
                  <Button variant="destructive" className="w-full" onClick={handleReject} disabled={isProcessing}>
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4 mr-2" />
                    )}
                    Reject Application
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
