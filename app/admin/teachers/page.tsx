"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { UserPlus, Search, Mail, Phone, Edit, Trash, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"

export default function AdminTeachersPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [teachers, setTeachers] = useState<any[]>([])
  const [filteredTeachers, setFilteredTeachers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem("user")

    if (!storedUser) {
      router.push("/login")
      return
    }

    const parsedUser = JSON.parse(storedUser)

    // Check if user is admin
    if (parsedUser.role !== "admin") {
      router.push("/dashboard")
      return
    }

    setUser(parsedUser)
    fetchTeachers()
  }, [router])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredTeachers(teachers)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = teachers.filter(
        (teacher) =>
          teacher.first_name.toLowerCase().includes(query) ||
          teacher.last_name.toLowerCase().includes(query) ||
          (teacher.users?.email && teacher.users.email.toLowerCase().includes(query)) ||
          (teacher.phone && teacher.phone.toLowerCase().includes(query)),
      )
      setFilteredTeachers(filtered)
    }
  }, [searchQuery, teachers])

  const fetchTeachers = async () => {
    try {
      const { data, error } = await supabase
        .from("teachers")
        .select(`
          *,
          users(email)
        `)
        .order("last_name", { ascending: true })

      if (error) {
        throw error
      }

      setTeachers(data || [])
      setFilteredTeachers(data || [])
    } catch (error) {
      console.error("Error fetching teachers:", error)
      toast({
        title: "Error",
        description: "Failed to load teachers. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteTeacher = async (id: number) => {
    if (!confirm("Are you sure you want to delete this teacher? This action cannot be undone.")) {
      return
    }

    try {
      // First, get the user_id associated with this teacher
      const { data: teacherData, error: teacherError } = await supabase
        .from("teachers")
        .select("user_id")
        .eq("id", id)
        .single()

      if (teacherError) throw teacherError

      // Remove teacher from any classes
      const { error: updateClassError } = await supabase
        .from("classes")
        .update({ teacher_id: null })
        .eq("teacher_id", id)

      if (updateClassError) throw updateClassError

      // Delete teacher's subject associations
      const { error: deleteSubjectsError } = await supabase.from("teacher_subjects").delete().eq("teacher_id", id)

      if (deleteSubjectsError) throw deleteSubjectsError

      // Delete the teacher record
      const { error: deleteTeacherError } = await supabase.from("teachers").delete().eq("id", id)

      if (deleteTeacherError) throw deleteTeacherError

      // Delete the user account
      if (teacherData?.user_id) {
        const { error: deleteUserError } = await supabase.from("users").delete().eq("id", teacherData.user_id)

        if (deleteUserError) throw deleteUserError
      }

      toast({
        title: "Teacher Deleted",
        description: "The teacher has been deleted successfully.",
      })

      // Refresh teachers
      fetchTeachers()
    } catch (error) {
      console.error("Error deleting teacher:", error)
      toast({
        title: "Error",
        description: "Failed to delete teacher. Please try again.",
        variant: "destructive",
      })
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
          <h1 className="text-2xl font-bold">Manage Teachers</h1>
          <Button asChild>
            <Link href="/admin/teachers/add">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Teacher
            </Link>
          </Button>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              <Input
                className="pl-10"
                placeholder="Search teachers by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Teacher List</CardTitle>
            <CardDescription>Manage all teachers in the school</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="py-3 px-4 text-left">Name</th>
                    <th className="py-3 px-4 text-left">Email</th>
                    <th className="py-3 px-4 text-left">Phone</th>
                    <th className="py-3 px-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeachers.length > 0 ? (
                    filteredTeachers.map((teacher) => (
                      <tr key={teacher.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={teacher.profile_image_url || "/placeholder.svg"} />
                              <AvatarFallback>
                                {teacher.first_name.charAt(0)}
                                {teacher.last_name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">
                              {teacher.first_name} {teacher.last_name}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-1">
                            <Mail className="h-4 w-4 text-gray-500" />
                            <span>{teacher.users?.email}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-1">
                            <Phone className="h-4 w-4 text-gray-500" />
                            <span>{teacher.phone || "Not provided"}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/admin/teachers/${teacher.id}`}>View Profile</Link>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/admin/teachers/${teacher.id}/edit`}>
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Link>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600"
                              onClick={() => handleDeleteTeacher(teacher.id)}
                            >
                              <Trash className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-gray-500">
                        {searchQuery ? "No teachers found matching your search" : "No teachers found"}
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
