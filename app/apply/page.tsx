"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Eye, CheckCircle, XCircle, Loader2, Search, ChevronUp, ChevronDown } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [averageFilter, setAverageFilter] = useState<string>("all")

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
    let filtered = [...applications]

    // Apply search filter
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (application) =>
          application.first_name.toLowerCase().includes(query) ||
          application.last_name.toLowerCase().includes(query) ||
          application.id.toString().includes(query)
      )
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((app) => app.status === statusFilter)
    }

    // Apply average filter
    if (averageFilter !== "all") {
      const threshold = parseInt(averageFilter)
      if (!isNaN(threshold)) {
        filtered = filtered.filter((app) => 
          app.overall_average && parseFloat(app.overall_average) >= threshold
        )
      }
    }

    // Apply sorting
    if (sortConfig !== null) {
      filtered.sort((a, b) => {
        let aValue, bValue

        switch (sortConfig.key) {
          case 'studentNo':
            aValue = a.id
            bValue = b.id
            break
          case 'firstName':
            aValue = a.first_name.toLowerCase()
            bValue = b.first_name.toLowerCase()
            break
          case 'lastName':
            aValue = a.last_name.toLowerCase()
            bValue = b.last_name.toLowerCase()
            break
          case 'term3':
            aValue = parseFloat(a.term3_average) || 0
            bValue = parseFloat(b.term3_average) || 0
            break
          case 'term4':
            aValue = parseFloat(a.term4_average) || 0
            bValue = parseFloat(b.term4_average) || 0
            break
          case 'overall':
            aValue = parseFloat(a.overall_average) || 0
            bValue = parseFloat(b.overall_average) || 0
            break
          case 'date':
            aValue = new Date(a.created_at).getTime()
            bValue = new Date(b.created_at).getTime()
            break
          case 'status':
            aValue = a.status
            bValue = b.status
            break
          default:
            return 0
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1
        }
        return 0
      })
    }

    setFilteredApplications(filtered)
  }, [searchQuery, applications, sortConfig, statusFilter, averageFilter])

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase.from("applications").select("*").order("created_at", { ascending: false })

      if (error) {
        throw error
      }

      setApplications(data || [])
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

  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending'
    }
    setSortConfig({ key, direction })
  }

  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return null
    }
    return sortConfig.direction === 'ascending' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
  }

  // Filter applications by status for the tab counts
  const pendingApplications = applications.filter((app) => app.status === "pending")
  const approvedApplications = applications.filter((app) => app.status === "approved")
  const rejectedApplications = applications.filter((app) => app.status === "rejected")

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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative col-span-1 md:col-span-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                <Input
                  className="pl-10"
                  placeholder="Search students by name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select value={averageFilter} onValueChange={setAverageFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by average" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Averages</SelectItem>
                  <SelectItem value="90">90% and above</SelectItem>
                  <SelectItem value="80">80% and above</SelectItem>
                  <SelectItem value="70">70% and above</SelectItem>
                  <SelectItem value="60">60% and above</SelectItem>
                </SelectContent>
              </Select>
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
                <TabsTrigger value="all">All ({applications.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="pending">
                {renderApplicationsTable(
                  pendingApplications, 
                  handleApprove, 
                  handleReject, 
                  isProcessing,
                  requestSort,
                  getSortIcon,
                  sortConfig
                )}
              </TabsContent>

              <TabsContent value="approved">
                {renderApplicationsTable(
                  approvedApplications, 
                  handleApprove, 
                  handleReject, 
                  isProcessing,
                  requestSort,
                  getSortIcon,
                  sortConfig
                )}
              </TabsContent>

              <TabsContent value="rejected">
                {renderApplicationsTable(
                  rejectedApplications, 
                  handleApprove, 
                  handleReject, 
                  isProcessing,
                  requestSort,
                  getSortIcon,
                  sortConfig
                )}
              </TabsContent>

              <TabsContent value="all">
                {renderApplicationsTable(
                  applications, 
                  handleApprove, 
                  handleReject, 
                  isProcessing,
                  requestSort,
                  getSortIcon,
                  sortConfig
                )}
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
  requestSort?: (key: string) => void,
  getSortIcon?: (key: string) => React.ReactNode | null,
  sortConfig?: { key: string; direction: 'ascending' | 'descending' } | null
) {
  if (applications.length === 0) {
    return <div className="text-center py-8 text-gray-500">No applications found</div>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b">
            <th 
              className="py-3 px-4 text-left cursor-pointer hover:bg-gray-100"
              onClick={() => requestSort && requestSort('studentNo')}
            >
              <div className="flex items-center">
                Student No.
                {getSortIcon && getSortIcon('studentNo')}
              </div>
            </th>
            <th 
              className="py-3 px-4 text-left cursor-pointer hover:bg-gray-100"
              onClick={() => requestSort && requestSort('firstName')}
            >
              <div className="flex items-center">
                First Name
                {getSortIcon && getSortIcon('firstName')}
              </div>
            </th>
            <th 
              className="py-3 px-4 text-left cursor-pointer hover:bg-gray-100"
              onClick={() => requestSort && requestSort('lastName')}
            >
              <div className="flex items-center">
                Last Name
                {getSortIcon && getSortIcon('lastName')}
              </div>
            </th>
            <th 
              className="py-3 px-4 text-left cursor-pointer hover:bg-gray-100"
              onClick={() => requestSort && requestSort('term3')}
            >
              <div className="flex items-center">
                Term 3 Avg
                {getSortIcon && getSortIcon('term3')}
              </div>
            </th>
            <th 
              className="py-3 px-4 text-left cursor-pointer hover:bg-gray-100"
              onClick={() => requestSort && requestSort('term4')}
            >
              <div className="flex items-center">
                Term 4 Avg
                {getSortIcon && getSortIcon('term4')}
              </div>
            </th>
            <th 
              className="py-3 px-4 text-left cursor-pointer hover:bg-gray-100"
              onClick={() => requestSort && requestSort('overall')}
            >
              <div className="flex items-center">
                Overall Avg
                {getSortIcon && getSortIcon('overall')}
              </div>
            </th>
            <th 
              className="py-3 px-4 text-left cursor-pointer hover:bg-gray-100"
              onClick={() => requestSort && requestSort('date')}
            >
              <div className="flex items-center">
                Date Applied
                {getSortIcon && getSortIcon('date')}
              </div>
            </th>
            <th 
              className="py-3 px-4 text-left cursor-pointer hover:bg-gray-100"
              onClick={() => requestSort && requestSort('status')}
            >
              <div className="flex items-center">
                Status
                {getSortIcon && getSortIcon('status')}
              </div>
            </th>
            <th className="py-3 px-4 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((application) => (
            <tr key={application.id} className="border-b hover:bg-gray-50">
              <td className="py-3 px-4">{application.id.toString().padStart(5, '0')}</td>
              <td className="py-3 px-4">{application.first_name}</td>
              <td className="py-3 px-4">{application.last_name}</td>
              <td className="py-3 px-4">{application.term3_average ? `${application.term3_average}%` : "N/A"}</td>
              <td className="py-3 px-4">{application.term4_average ? `${application.term4_average}%` : "N/A"}</td>
              <td className="py-3 px-4">{application.overall_average ? `${application.overall_average}%` : "N/A"}</td>
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
                    className="text-blue-600 border-blue-600 hover:bg-blue-50"
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
