"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Search, ArrowUpDown, Users } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ClassRepresentativesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [representatives, setRepresentatives] = useState<any[]>([])
  const [filteredRepresentatives, setFilteredRepresentatives] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Filtering and sorting states
  const [searchQuery, setSearchQuery] = useState("")
  const [filterGrade, setFilterGrade] = useState<string>("all")
  const [filterAcademicYear, setFilterAcademicYear] = useState<string>("all")
  const [sortField, setSortField] = useState<string>("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  // Data for dropdowns
  const [grades, setGrades] = useState<any[]>([])
  const [academicYears, setAcademicYears] = useState<string[]>([])

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
    fetchData()
  }, [router])

  useEffect(() => {
    applyFiltersAndSort()
  }, [searchQuery, filterGrade, filterAcademicYear, sortField, sortDirection, representatives])

  const fetchData = async () => {
    try {
      // Fetch grades
      const { data: gradesData, error: gradesError } = await supabase
        .from("grades")
        .select("*")
        .order("id", { ascending: true })

      if (gradesError) throw gradesError
      setGrades(gradesData || [])

      // Fetch class representatives
      const { data: repsData, error: repsError } = await supabase
        .from("class_representatives")
        .select(`
          *,
          students(
            id, 
            student_id, 
            first_name, 
            last_name, 
            profile_image_url,
            gender
          ),
          classes(
            id,
            name,
            academic_year,
            grades(id, name)
          )
        `)
        .order("created_at", { ascending: false })

      if (repsError) throw repsError
      setRepresentatives(repsData || [])
      setFilteredRepresentatives(repsData || [])

      // Extract unique academic years
      const years = [...new Set(repsData.map((rep) => rep.classes?.academic_year))]
        .filter(Boolean)
        .sort((a, b) => b - a)
      setAcademicYears(years)
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to load data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const applyFiltersAndSort = () => {
    let filtered = [...representatives]

    // Apply search filter
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (rep) =>
          (rep.students?.first_name && rep.students.first_name.toLowerCase().includes(query)) ||
          (rep.students?.last_name && rep.students.last_name.toLowerCase().includes(query)) ||
          (rep.students?.student_id && rep.students.student_id.toLowerCase().includes(query)) ||
          (rep.classes?.name && rep.classes.name.toLowerCase().includes(query)) ||
          (rep.classes?.grades?.name && rep.classes.grades.name.toLowerCase().includes(query)),
      )
    }

    // Apply grade filter
    if (filterGrade !== "all") {
      filtered = filtered.filter((rep) => rep.classes?.grades?.id.toString() === filterGrade)
    }

    // Apply academic year filter
    if (filterAcademicYear !== "all") {
      filtered = filtered.filter((rep) => rep.classes?.academic_year.toString() === filterAcademicYear)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let valueA, valueB

      switch (sortField) {
        case "name":
          valueA = a.students ? `${a.students.last_name} ${a.students.first_name}`.toLowerCase() : ""
          valueB = b.students ? `${b.students.last_name} ${b.students.first_name}`.toLowerCase() : ""
          break
        case "class":
          valueA = a.classes ? `${a.classes.grades?.name} ${a.classes.name}`.toLowerCase() : ""
          valueB = b.classes ? `${b.classes.grades?.name} ${b.classes.name}`.toLowerCase() : ""
          break
        case "year":
          valueA = a.classes?.academic_year || 0
          valueB = b.classes?.academic_year || 0
          break
        case "position":
          valueA = a.position.toLowerCase()
          valueB = b.position.toLowerCase()
          break
        default:
          valueA = a.students ? `${a.students.last_name} ${a.students.first_name}`.toLowerCase() : ""
          valueB = b.students ? `${b.students.last_name} ${b.students.first_name}`.toLowerCase() : ""
      }

      if (sortDirection === "asc") {
        return valueA > valueB ? 1 : -1
      } else {
        return valueA < valueB ? 1 : -1
      }
    })

    setFilteredRepresentatives(filtered)
  }

  const resetFilters = () => {
    setSearchQuery("")
    setFilterGrade("all")
    setFilterAcademicYear("all")
    setSortField("name")
    setSortDirection("asc")
  }

  const getPositionBadge = (position: string) => {
    switch (position.toLowerCase()) {
      case "class president":
        return <Badge className="bg-blue-500">Class President</Badge>
      case "vice president":
        return <Badge className="bg-green-500">Vice President</Badge>
      case "secretary":
        return <Badge className="bg-purple-500">Secretary</Badge>
      case "treasurer":
        return <Badge className="bg-yellow-500">Treasurer</Badge>
      case "sports captain":
        return <Badge className="bg-red-500">Sports Captain</Badge>
      default:
        return <Badge>{position}</Badge>
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

  // Group representatives by grade
  const representativesByGrade = grades
    .map((grade) => {
      const gradeReps = filteredRepresentatives.filter((rep) => rep.classes?.grades?.id === grade.id)
      return {
        grade,
        representatives: gradeReps,
      }
    })
    .filter((group) => group.representatives.length > 0)

  return (
    <DashboardLayout user={user}>
      <div className="p-6">
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 mb-6">
          <div>
            <h1 className="text-2xl font-bold">Class Representatives</h1>
            <p className="text-muted-foreground">View all class representatives across grades</p>
          </div>
          <Button onClick={() => router.push("/admin/classes")}>Manage Classes</Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search & Filter</CardTitle>
            <CardDescription>Find representatives by name, class, or position</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-8"
                  placeholder="Search representatives..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div>
                <Select value={filterGrade} onValueChange={setFilterGrade}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Grades</SelectItem>
                    {grades.map((grade) => (
                      <SelectItem key={grade.id} value={grade.id.toString()}>
                        {grade.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Select value={filterAcademicYear} onValueChange={setFilterAcademicYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by academic year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    {academicYears.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Select value={sortField} onValueChange={setSortField}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="class">Class</SelectItem>
                    <SelectItem value="year">Academic Year</SelectItem>
                    <SelectItem value="position">Position</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
                >
                  <ArrowUpDown className={`h-4 w-4 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                </Button>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <Button variant="outline" size="sm" onClick={resetFilters}>
                Reset Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {filteredRepresentatives.length > 0 ? (
          <Tabs defaultValue="all" className="space-y-6">
            <TabsList>
              <TabsTrigger value="all">All Representatives</TabsTrigger>
              {representativesByGrade.map((group) => (
                <TabsTrigger key={group.grade.id} value={group.grade.id.toString()}>
                  {group.grade.name}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="all">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRepresentatives.map((rep) => (
                  <Card key={rep.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4 mb-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={rep.students?.profile_image_url || "/placeholder.svg"} />
                          <AvatarFallback>
                            {rep.students?.first_name?.charAt(0)}
                            {rep.students?.last_name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium">
                            {rep.students?.first_name} {rep.students?.last_name}
                          </h3>
                          <p className="text-sm text-muted-foreground">{rep.students?.student_id}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <p className="text-sm font-medium text-muted-foreground">Position</p>
                          {getPositionBadge(rep.position)}
                        </div>

                        <div className="flex justify-between items-center">
                          <p className="text-sm font-medium text-muted-foreground">Class</p>
                          <p className="text-sm font-medium">
                            {rep.classes?.grades?.name} {rep.classes?.name}
                          </p>
                        </div>

                        <div className="flex justify-between items-center">
                          <p className="text-sm font-medium text-muted-foreground">Academic Year</p>
                          <p className="text-sm font-medium">{rep.classes?.academic_year}</p>
                        </div>

                        <div className="flex justify-between items-center">
                          <p className="text-sm font-medium text-muted-foreground">Since</p>
                          <p className="text-sm font-medium">{new Date(rep.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>

                      <div className="mt-4">
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => router.push(`/admin/classes/${rep.class_id}`)}
                        >
                          View Class
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {representativesByGrade.map((group) => (
              <TabsContent key={group.grade.id} value={group.grade.id.toString()}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {group.representatives.map((rep) => (
                    <Card key={rep.id}>
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-4 mb-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={rep.students?.profile_image_url || "/placeholder.svg"} />
                            <AvatarFallback>
                              {rep.students?.first_name?.charAt(0)}
                              {rep.students?.last_name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-medium">
                              {rep.students?.first_name} {rep.students?.last_name}
                            </h3>
                            <p className="text-sm text-muted-foreground">{rep.students?.student_id}</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <p className="text-sm font-medium text-muted-foreground">Position</p>
                            {getPositionBadge(rep.position)}
                          </div>

                          <div className="flex justify-between items-center">
                            <p className="text-sm font-medium text-muted-foreground">Class</p>
                            <p className="text-sm font-medium">
                              {rep.classes?.grades?.name} {rep.classes?.name}
                            </p>
                          </div>

                          <div className="flex justify-between items-center">
                            <p className="text-sm font-medium text-muted-foreground">Academic Year</p>
                            <p className="text-sm font-medium">{rep.classes?.academic_year}</p>
                          </div>
                        </div>

                        <div className="mt-4">
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => router.push(`/admin/classes/${rep.class_id}`)}
                          >
                            View Class
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No Representatives Found</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-md">
              {searchQuery || filterGrade !== "all" || filterAcademicYear !== "all"
                ? "No representatives match your search criteria."
                : "No class representatives have been assigned yet."}
            </p>
            <Button onClick={() => router.push("/admin/classes")} className="mt-4">
              Manage Classes
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
