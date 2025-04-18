"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, BookOpen, Loader2, Eye } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"

export default function AdminSubjectsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [subjects, setSubjects] = useState<any[]>([])
  const [filteredSubjects, setFilteredSubjects] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [totalSubjects, setTotalSubjects] = useState(0)

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem("user")

    if (!storedUser) {
      router.push("/login")
      return
    }

    const parsedUser = JSON.parse(storedUser)

    // Check if user is admin
    if (parsedUser.role !== "admin" && parsedUser.role !== "principal") {
      router.push("/dashboard")
      return
    }

    setUser(parsedUser)
    fetchSubjects()
  }, [router])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredSubjects(subjects)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = subjects.filter((subject) => subject.name.toLowerCase().includes(query))
      setFilteredSubjects(filtered)
    }
  }, [searchQuery, subjects])

  const fetchSubjects = async () => {
    try {
      const { data, error } = await supabase.from("subjects").select("*").order("name")

      if (error) {
        throw error
      }

      // For each subject, get the count of students
      const subjectsWithStudentCount = await Promise.all(
        (data || []).map(async (subject) => {
          const { count, error: countError } = await supabase
            .from("marks")
            .select("*", { count: "exact", head: true })
            .eq("subject_id", subject.id)
            .eq("academic_year", new Date().getFullYear())

          if (countError) {
            console.error("Error counting students:", countError)
            return { ...subject, studentCount: 0 }
          }

          return { ...subject, studentCount: count || 0 }
        }),
      )

      setSubjects(subjectsWithStudentCount)
      setFilteredSubjects(subjectsWithStudentCount)
      setTotalSubjects(subjectsWithStudentCount.length)
    } catch (error) {
      console.error("Error fetching subjects:", error)
      toast({
        title: "Error",
        description: "Failed to load subjects. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
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

  return (
    <DashboardLayout user={user}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Manage Subjects</h1>
          <Button asChild>
            <Link href="/admin/subjects/add">
              <Plus className="h-4 w-4 mr-2" />
              Add Subject
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Subjects</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totalSubjects}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              <Input
                className="pl-10"
                placeholder="Search subjects by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subject List</CardTitle>
            <CardDescription>View and manage all subjects in the school</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="py-3 px-4 text-left">Subject Name</th>
                    <th className="py-3 px-4 text-left">Type</th>
                    <th className="py-3 px-4 text-left">Students</th>
                    <th className="py-3 px-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubjects.length > 0 ? (
                    filteredSubjects.map((subject) => (
                      <tr key={subject.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            <BookOpen className="h-5 w-5 text-primary" />
                            <span className="font-medium">{subject.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={subject.is_compulsory ? "default" : "outline"}>
                            {subject.is_compulsory ? "Compulsory" : "Optional"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">{subject.studentCount}</td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/admin/subjects/${subject.id}`}>
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Link>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-gray-500">
                        {searchQuery ? "No subjects found matching your search" : "No subjects found"}
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
