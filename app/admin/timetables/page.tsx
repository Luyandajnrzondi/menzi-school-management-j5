"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Edit, Loader2, Plus, Search } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"

export default function TimetablesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timetables, setTimetables] = useState<any[]>([])
  const [filteredTimetables, setFilteredTimetables] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [academicYears, setAcademicYears] = useState<number[]>([])
  const [selectedYear, setSelectedYear] = useState<string>("all")
  const [selectedTerm, setSelectedTerm] = useState<string>("all")
  const [classes, setClasses] = useState<Record<string, any>>({})

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
    fetchData()
  }, [router])

  const fetchData = async () => {
    try {
      // Fetch classes for lookup
      const { data: classesData, error: classesError } = await supabase
        .from("classes")
        .select(`
          id,
          name,
          grade_id,
          grades(name)
        `)
        .order("grade_id", { ascending: true })
        .order("name", { ascending: true })

      if (classesError) throw classesError

      // Create classes lookup object
      const classesLookup: Record<string, any> = {}
      classesData?.forEach((classItem) => {
        classesLookup[classItem.id] = classItem
      })
      setClasses(classesLookup)

      // Fetch timetables
      const { data: timetablesData, error: timetablesError } = await supabase
        .from("timetables")
        .select("*")
        .order("academic_year", { ascending: false })
        .order("term", { ascending: true })

      if (timetablesError) throw timetablesError

      setTimetables(timetablesData || [])
      setFilteredTimetables(timetablesData || [])

      // Extract unique academic years
      const years = Array.from(new Set((timetablesData || []).map((t) => t.academic_year))).sort((a, b) => b - a)
      setAcademicYears(years)
    } catch (error) {
      console.error("Error fetching timetables:", error)
      toast({
        title: "Error",
        description: "Failed to load timetables. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Filter timetables based on search query and filters
    let filtered = [...timetables]

    // Filter by academic year
    if (selectedYear !== "all") {
      filtered = filtered.filter((t) => t.academic_year.toString() === selectedYear)
    }

    // Filter by term
    if (selectedTerm !== "all") {
      filtered = filtered.filter((t) => t.term.toString() === selectedTerm)
    }

    // Filter by search query (class name)
    if (searchQuery) {
      filtered = filtered.filter((t) => {
        const classItem = classes[t.class_id]
        if (!classItem) return false
        const className = `${classItem.grades?.name} ${classItem.name}`
        return className.toLowerCase().includes(searchQuery.toLowerCase())
      })
    }

    setFilteredTimetables(filtered)
  }, [searchQuery, selectedYear, selectedTerm, timetables, classes])

  const getClassName = (classId: number) => {
    const classItem = classes[classId]
    return classItem ? `${classItem.grades?.name} ${classItem.name}` : "Unknown Class"
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold">Timetables</h1>
            <p className="text-muted-foreground">Manage class timetables for the academic year</p>
          </div>
          <Button asChild>
            <Link href="/admin/timetables/create">
              <Plus className="mr-2 h-4 w-4" />
              Create New Timetable
            </Link>
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filter Timetables</CardTitle>
            <CardDescription>Use the filters below to find specific timetables</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="search" className="text-sm font-medium mb-2 block">
                  Search by Class
                </label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    id="search"
                    placeholder="Search..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="year" className="text-sm font-medium mb-2 block">
                  Academic Year
                </label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger id="year">
                    <SelectValue placeholder="Select academic year" />
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

              <div>
                <label htmlFor="term" className="text-sm font-medium mb-2 block">
                  Term
                </label>
                <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                  <SelectTrigger id="term">
                    <SelectValue placeholder="Select term" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Terms</SelectItem>
                    <SelectItem value="1">Term 1</SelectItem>
                    <SelectItem value="2">Term 2</SelectItem>
                    <SelectItem value="3">Term 3</SelectItem>
                    <SelectItem value="4">Term 4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTimetables.length > 0 ? (
            filteredTimetables.map((timetable) => (
              <Card key={timetable.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle>{getClassName(timetable.class_id)}</CardTitle>
                  <CardDescription>
                    Term {timetable.term}, {timetable.academic_year}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Last updated: {new Date(timetable.updated_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex space-x-2">
                    <Button asChild variant="outline" className="flex-1">
                      <Link
                        href={`/timetables?class=${timetable.class_id}&term=${timetable.term}&year=${timetable.academic_year}`}
                      >
                        View
                      </Link>
                    </Button>
                    <Button asChild className="flex-1">
                      <Link href={`/admin/timetables/edit/${timetable.id}`}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium">No Timetables Found</h3>
              <p className="text-sm text-gray-500 mt-2 max-w-md">
                {timetables.length === 0
                  ? "No timetables have been created yet. Create your first timetable to get started."
                  : "No timetables match your current filters. Try adjusting your search criteria."}
              </p>
              {timetables.length === 0 && (
                <Button asChild className="mt-4">
                  <Link href="/admin/timetables/create">
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Timetable
                  </Link>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
