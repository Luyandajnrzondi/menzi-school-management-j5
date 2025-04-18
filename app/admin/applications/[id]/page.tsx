"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, CheckCircle, Download, Loader2, XCircle } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"

export default function ApplicationDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [application, setApplication] = useState<any>(null)
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

      if (error) {
        throw error
      }

      setApplication(data)
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
        .update({ status: "approved", updated_at: new Date().toISOString() })
        .eq("id", params.id)

      if (error) {
        throw error
      }

      toast({
        title: "Application Approved",
        description: "The application has been approved successfully.",
      })

      // Refresh application
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
    setIsProcessing(true)
    try {
      const { error } = await supabase
        .from("applications")
        .update({ status: "rejected", updated_at: new Date().toISOString() })
        .eq("id", params.id)

      if (error) {
        throw error
      }

      toast({
        title: "Application Rejected",
        description: "The application has been rejected.",
      })

      // Refresh application
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

  // Helper function to get mark range based on level
  const getMarkRange = (level: number): string => {
    switch (level) {
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
        return ""
    }
  }

  // Helper function to render subject marks
  const renderSubjectMarks = (term: string) => {
    if (!application || !application.marks_data) return null

    const subjects = application.marks_data[term]
    if (!subjects) return <p>No marks data available</p>

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(subjects).map(([subject, level]) => {
          const subjectName = subject.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
          return (
            <div key={subject} className="flex justify-between border-b pb-2">
              <span>{subjectName}:</span>
              <span className="font-medium">
                Level {level} ({getMarkRange(Number(level))})
              </span>
            </div>
          )
        })}

        {/* Additional language if available */}
        {application.marks_data.additional_language && (
          <div className="flex justify-between border-b pb-2">
            <span>{application.marks_data.additional_language.name}:</span>
            <span className="font-medium">
              Level {application.marks_data.additional_language[term]}(
              {getMarkRange(Number(application.marks_data.additional_language[term]))})
            </span>
          </div>
        )}
      </div>
    )
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
            <CardContent className="pt-6">
              <p className="text-center py-8 text-gray-500">
                The application you are looking for does not exist or has been removed.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout user={user}>
      <div className="p-6">
        <div className="flex items-center mb-6">
          <Button variant="outline" size="sm" onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Application Details</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Student Information</CardTitle>
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
                </div>
                <CardDescription>
                  Application submitted on {new Date(application.created_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium mb-4">Personal Details</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Full Name:</span>
                        <span className="font-medium">
                          {application.first_name} {application.last_name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Date of Birth:</span>
                        <span className="font-medium">{new Date(application.date_of_birth).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Gender:</span>
                        <span className="font-medium">
                          {application.gender.charAt(0).toUpperCase() + application.gender.slice(1)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Email:</span>
                        <a href={`mailto:${application.email}`} className="font-medium text-black-600 hover:underline">
                          {application.email}
                        </a>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Phone:</span>
                        <a href={`tel:${application.phone}`} className="font-medium text-black-600 hover:underline">
                          {application.phone}
                        </a>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-4">Parent/Guardian Details</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Name:</span>
                        <span className="font-medium">{application.parent_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Phone:</span>
                        <a
                          href={`tel:${application.parent_phone}`}
                          className="font-medium text-black-600 hover:underline"
                        >
                          {application.parent_phone}
                        </a>
                      </div>
                      {application.parent_email && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Email:</span>
                          <a
                            href={`mailto:${application.parent_email}`}
                            className="font-medium text-black-600 hover:underline"
                          >
                            {application.parent_email}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6">
               <h3 className="font-medium mb-2">Address</h3>
               {application.address ? (
               <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(application.address)}`}
               target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-gray-50 rounded-md hover:bg-gray-100 block text-black-600 hover:underline" >
               {application.address}
               </a>
                ) : (
               <p className="p-3 bg-gray-50 rounded-md">No address provided</p> )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Grade 7 Results</CardTitle>
                <CardDescription>Academic performance from previous school</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="term3">
                  <TabsList className="mb-4">
                    <TabsTrigger value="term3">Term 3</TabsTrigger>
                    <TabsTrigger value="term4">Term 4</TabsTrigger>
                    <TabsTrigger value="summary">Summary</TabsTrigger>
                  </TabsList>

                  <TabsContent value="term3">
                    <div className="mb-4">
                      <h3 className="font-medium mb-2">Term 3 Marks</h3>
                      {renderSubjectMarks("term3")}
                    </div>
                    <div className="mt-4 p-3 bg-gray-50 rounded-md flex justify-between">
                      <span className="font-medium">Term 3 Average:</span>
                      <span className="font-bold">{application.term3_average || "N/A"}%</span>
                    </div>
                  </TabsContent>

                  <TabsContent value="term4">
                    <div className="mb-4">
                      <h3 className="font-medium mb-2">Term 4 Marks</h3>
                      {renderSubjectMarks("term4")}
                    </div>
                    <div className="mt-4 p-3 bg-gray-50 rounded-md flex justify-between">
                      <span className="font-medium">Term 4 Average:</span>
                      <span className="font-bold">{application.term4_average || "N/A"}%</span>
                    </div>
                  </TabsContent>

                  <TabsContent value="summary">
                    <div className="space-y-4">
                      <div className="p-3 bg-gray-50 rounded-md flex justify-between">
                        <span className="font-medium">Term 3 Average:</span>
                        <span className="font-bold">{application.term3_average || "N/A"}%</span>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-md flex justify-between">
                        <span className="font-medium">Term 4 Average:</span>
                        <span className="font-bold">{application.term4_average || "N/A"}%</span>
                      </div>
                      <div className="p-3 bg-gray-100 rounded-md flex justify-between">
                        <span className="font-medium">Overall Average:</span>
                        <span className="font-bold">{application.overall_average || "N/A"}%</span>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="mt-6">
                  <h3 className="font-medium mb-2">Results Document</h3>
                  <a
                    href={application.results_document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-3 bg-gray-50 rounded-md hover:bg-gray-100"
                  >
                    <Download className="h-5 w-5 mr-2 text-blue-600" />
                    <span className="text-blue-600">View/Download Grade 7 Results</span>
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Application Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Current Status:</span>
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
                  </div>

                  {application.status === "pending" && (
                    <div className="space-y-2">
                      <Button
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={handleApprove}
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        )}
                        Approve Application
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full text-red-600 border-red-600 hover:bg-red-50"
                        onClick={handleReject}
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <XCircle className="h-4 w-4 mr-2" />
                        )}
                        Reject Application
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Academic Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Term 3 Average:</span>
                    <span className="font-bold">{application.term3_average || "N/A"}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Term 4 Average:</span>
                    <span className="font-bold">{application.term4_average || "N/A"}%</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-500">Overall Average:</span>
                    <span className="font-bold">{application.overall_average || "N/A"}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Academic Year:</span>
                    <span className="font-medium">{application.academic_year}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
