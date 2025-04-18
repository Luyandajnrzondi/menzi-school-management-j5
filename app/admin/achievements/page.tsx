"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Search, Plus, Trophy, Edit, Trash2, ArrowUpDown } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const achievementSchema = z.object({
  student_id: z.string().min(1, { message: "Student is required" }),
  achievement_type: z.string().min(1, { message: "Achievement type is required" }),
  title: z.string().min(2, { message: "Title must be at least 2 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  achievement_date: z.string().min(1, { message: "Date is required" }),
  class_id: z.string().optional(),
  grade_id: z.string().optional(),
  rank: z.string().min(1, { message: "Rank is required" }),
})

export default function AchievementsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [achievements, setAchievements] = useState<any[]>([])
  const [filteredAchievements, setFilteredAchievements] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentAchievement, setCurrentAchievement] = useState<any>(null)

  // Filtering and sorting states
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterGrade, setFilterGrade] = useState<string>("all")
  const [filterClass, setFilterClass] = useState<string>("all")
  const [sortField, setSortField] = useState<string>("rank")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  // Data for dropdowns
  const [students, setStudents] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [grades, setGrades] = useState<any[]>([])

  const form = useForm<z.infer<typeof achievementSchema>>({
    resolver: zodResolver(achievementSchema),
    defaultValues: {
      student_id: "",
      achievement_type: "academic",
      title: "",
      description: "",
      achievement_date: new Date().toISOString().split("T")[0],
      class_id: "",
      grade_id: "",
      rank: "1",
    },
  })

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
  }, [searchQuery, filterType, filterGrade, filterClass, sortField, sortDirection, achievements])

  const fetchData = async () => {
    try {
      // Fetch students
      const { data: studentsData, error: studentsError } = await supabase
        .from("students")
        .select("id, student_id, first_name, last_name, profile_image_url")
        .order("last_name", { ascending: true })

      if (studentsError) throw studentsError
      setStudents(studentsData || [])

      // Fetch classes
      const { data: classesData, error: classesError } = await supabase
        .from("classes")
        .select(`
          id,
          name,
          grade_id,
          grades(id, name)
        `)
        .order("grade_id", { ascending: true })
        .order("name", { ascending: true })

      if (classesError) throw classesError
      setClasses(classesData || [])

      // Fetch grades
      const { data: gradesData, error: gradesError } = await supabase
        .from("grades")
        .select("*")
        .order("id", { ascending: true })

      if (gradesError) throw gradesError
      setGrades(gradesData || [])

      // Fetch achievements
      const { data: achievementsData, error: achievementsError } = await supabase
        .from("achievements")
        .select(`
          *,
          students(id, student_id, first_name, last_name, profile_image_url),
          classes(id, name, grades(id, name)),
          grades(id, name)
        `)
        .order("achievement_date", { ascending: false })

      if (achievementsError) throw achievementsError
      setAchievements(achievementsData || [])
      setFilteredAchievements(achievementsData || [])
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
    let filtered = [...achievements]

    // Apply search filter
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (achievement) =>
          achievement.title.toLowerCase().includes(query) ||
          achievement.description.toLowerCase().includes(query) ||
          (achievement.students?.first_name && achievement.students.first_name.toLowerCase().includes(query)) ||
          (achievement.students?.last_name && achievement.students.last_name.toLowerCase().includes(query)),
      )
    }

    // Apply achievement type filter
    if (filterType !== "all") {
      filtered = filtered.filter((achievement) => achievement.achievement_type === filterType)
    }

    // Apply grade filter
    if (filterGrade !== "all") {
      filtered = filtered.filter(
        (achievement) =>
          achievement.grade_id?.toString() === filterGrade || achievement.classes?.grade_id?.toString() === filterGrade,
      )
    }

    // Apply class filter
    if (filterClass !== "all") {
      filtered = filtered.filter((achievement) => achievement.class_id?.toString() === filterClass)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let valueA, valueB

      switch (sortField) {
        case "title":
          valueA = a.title.toLowerCase()
          valueB = b.title.toLowerCase()
          break
        case "date":
          valueA = new Date(a.achievement_date).getTime()
          valueB = new Date(b.achievement_date).getTime()
          break
        case "type":
          valueA = a.achievement_type.toLowerCase()
          valueB = b.achievement_type.toLowerCase()
          break
        case "rank":
          valueA = Number.parseInt(a.rank)
          valueB = Number.parseInt(b.rank)
          break
        case "student":
          valueA = a.students ? `${a.students.last_name} ${a.students.first_name}`.toLowerCase() : ""
          valueB = b.students ? `${b.students.last_name} ${b.students.first_name}`.toLowerCase() : ""
          break
        default:
          valueA = Number.parseInt(a.rank)
          valueB = Number.parseInt(b.rank)
      }

      if (sortDirection === "asc") {
        return valueA > valueB ? 1 : -1
      } else {
        return valueA < valueB ? 1 : -1
      }
    })

    setFilteredAchievements(filtered)
  }

  const resetFilters = () => {
    setSearchQuery("")
    setFilterType("all")
    setFilterGrade("all")
    setFilterClass("all")
    setSortField("rank")
    setSortDirection("asc")
  }

  const handleDeleteAchievement = async (id: number) => {
    setIsDeleting(true)
    setDeleteId(id)
    try {
      const { error } = await supabase.from("achievements").delete().eq("id", id)

      if (error) throw error

      toast({
        title: "Achievement Deleted",
        description: "The achievement has been deleted successfully.",
      })

      // Refresh achievements
      fetchData()
    } catch (error) {
      console.error("Error deleting achievement:", error)
      toast({
        title: "Error",
        description: "Failed to delete achievement. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setDeleteId(null)
    }
  }

  const openEditDialog = (achievement: any) => {
    setCurrentAchievement(achievement)
    setIsEditing(true)

    form.reset({
      student_id: achievement.student_id.toString(),
      achievement_type: achievement.achievement_type,
      title: achievement.title,
      description: achievement.description,
      achievement_date: new Date(achievement.achievement_date).toISOString().split("T")[0],
      class_id: achievement.class_id ? achievement.class_id.toString() : "",
      grade_id: achievement.grade_id ? achievement.grade_id.toString() : "",
      rank: achievement.rank.toString(),
    })

    setIsDialogOpen(true)
  }

  const openAddDialog = () => {
    setCurrentAchievement(null)
    setIsEditing(false)

    form.reset({
      student_id: "",
      achievement_type: "academic",
      title: "",
      description: "",
      achievement_date: new Date().toISOString().split("T")[0],
      class_id: "",
      grade_id: "",
      rank: "1",
    })

    setIsDialogOpen(true)
  }

  const onSubmit = async (data: z.infer<typeof achievementSchema>) => {
    try {
      if (isEditing && currentAchievement) {
        // Update existing achievement
        const { error } = await supabase
          .from("achievements")
          .update({
            student_id: Number(data.student_id),
            achievement_type: data.achievement_type,
            title: data.title,
            description: data.description,
            achievement_date: data.achievement_date,
            class_id: data.class_id ? Number(data.class_id) : null,
            grade_id: data.grade_id ? Number(data.grade_id) : null,
            rank: data.rank,
            updated_at: new Date().toISOString(),
          })
          .eq("id", currentAchievement.id)

        if (error) throw error

        toast({
          title: "Achievement Updated",
          description: "The achievement has been updated successfully.",
        })
      } else {
        // Create new achievement
        const { error } = await supabase.from("achievements").insert({
          student_id: Number(data.student_id),
          achievement_type: data.achievement_type,
          title: data.title,
          description: data.description,
          achievement_date: data.achievement_date,
          class_id: data.class_id ? Number(data.class_id) : null,
          grade_id: data.grade_id ? Number(data.grade_id) : null,
          rank: data.rank,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

        if (error) throw error

        toast({
          title: "Achievement Created",
          description: "The achievement has been created successfully.",
        })
      }

      // Refresh achievements
      fetchData()
      setIsDialogOpen(false)
    } catch (error) {
      console.error("Error saving achievement:", error)
      toast({
        title: "Error",
        description: "Failed to save achievement. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getAchievementTypeLabel = (type: string) => {
    switch (type) {
      case "academic":
        return "Academic"
      case "sports":
        return "Sports"
      case "cultural":
        return "Cultural"
      case "leadership":
        return "Leadership"
      case "community":
        return "Community Service"
      default:
        return "Other"
    }
  }

  const getAchievementTypeBadge = (type: string) => {
    switch (type) {
      case "academic":
        return <Badge className="bg-blue-500">Academic</Badge>
      case "sports":
        return <Badge className="bg-green-500">Sports</Badge>
      case "cultural":
        return <Badge className="bg-purple-500">Cultural</Badge>
      case "leadership":
        return <Badge className="bg-yellow-500">Leadership</Badge>
      case "community":
        return <Badge className="bg-red-500">Community Service</Badge>
      default:
        return <Badge>Other</Badge>
    }
  }

  const getRankBadge = (rank: string) => {
    const rankNum = Number.parseInt(rank)
    if (rankNum === 1) {
      return <Badge className="bg-yellow-500">1st Place</Badge>
    } else if (rankNum === 2) {
      return <Badge className="bg-gray-400">2nd Place</Badge>
    } else if (rankNum === 3) {
      return <Badge className="bg-amber-700">3rd Place</Badge>
    } else if (rankNum <= 10) {
      return <Badge>Top 10</Badge>
    } else {
      return <Badge variant="outline">{rank}</Badge>
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
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 mb-6">
          <div>
            <h1 className="text-2xl font-bold">Student Achievements</h1>
            <p className="text-muted-foreground">Manage and track student achievements and awards</p>
          </div>
          <Button onClick={openAddDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add Achievement
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search & Filter</CardTitle>
            <CardDescription>Find achievements by student, type, or rank</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-8"
                  placeholder="Search achievements..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="academic">Academic</SelectItem>
                    <SelectItem value="sports">Sports</SelectItem>
                    <SelectItem value="cultural">Cultural</SelectItem>
                    <SelectItem value="leadership">Leadership</SelectItem>
                    <SelectItem value="community">Community Service</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
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
                <Select value={filterClass} onValueChange={setFilterClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {classes.map((classItem) => (
                      <SelectItem key={classItem.id} value={classItem.id.toString()}>
                        {classItem.grades?.name} {classItem.name}
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
                    <SelectItem value="rank">Rank</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                    <SelectItem value="type">Type</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAchievements.length > 0 ? (
            filteredAchievements.map((achievement) => (
              <Card key={achievement.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{achievement.title}</CardTitle>
                    {getAchievementTypeBadge(achievement.achievement_type)}
                  </div>
                  <CardDescription>{new Date(achievement.achievement_date).toLocaleDateString()}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4 mb-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={achievement.students?.profile_image_url || "/placeholder.svg"} />
                      <AvatarFallback>
                        {achievement.students?.first_name?.charAt(0)}
                        {achievement.students?.last_name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {achievement.students?.first_name} {achievement.students?.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {achievement.classes?.grades?.name} {achievement.classes?.name}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm line-clamp-3">{achievement.description}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <Trophy className="h-4 w-4 text-yellow-500 mr-1" />
                      {getRankBadge(achievement.rank)}
                    </div>
                    {achievement.grade_id && !achievement.class_id && (
                      <Badge variant="outline">{achievement.grades?.name}</Badge>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" size="sm" onClick={() => openEditDialog(achievement)}>
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the achievement record.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteAchievement(achievement.id)}
                          disabled={isDeleting && deleteId === achievement.id}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {isDeleting && deleteId === achievement.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="mr-2 h-4 w-4" />
                          )}
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
              <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No Achievements Found</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-md">
                {searchQuery || filterType !== "all" || filterGrade !== "all" || filterClass !== "all"
                  ? "No achievements match your search criteria."
                  : "No achievements have been recorded yet."}
              </p>
              <Button onClick={openAddDialog} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Add Achievement
              </Button>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Achievement" : "Add New Achievement"}</DialogTitle>
            <DialogDescription>
              {isEditing ? "Update the details of this achievement" : "Fill in the details to record a new achievement"}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="student_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a student" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {students.map((student) => (
                          <SelectItem key={student.id} value={student.id.toString()}>
                            {student.first_name} {student.last_name} ({student.student_id})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Achievement Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter achievement title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter achievement description" className="min-h-[100px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="achievement_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Achievement Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select achievement type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="academic">Academic</SelectItem>
                          <SelectItem value="sports">Sports</SelectItem>
                          <SelectItem value="cultural">Cultural</SelectItem>
                          <SelectItem value="leadership">Leadership</SelectItem>
                          <SelectItem value="community">Community Service</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="achievement_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Achievement Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="grade_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grade Level (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select grade level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Not Specified</SelectItem>
                          {grades.map((grade) => (
                            <SelectItem key={grade.id} value={grade.id.toString()}>
                              {grade.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>Select if this is a grade-level achievement</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="class_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Class (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select class" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Not Specified</SelectItem>
                          {classes.map((classItem) => (
                            <SelectItem key={classItem.id} value={classItem.id.toString()}>
                              {classItem.grades?.name} {classItem.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>Select if this is a class-level achievement</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="rank"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rank / Position</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select rank" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">1st Place</SelectItem>
                        <SelectItem value="2">2nd Place</SelectItem>
                        <SelectItem value="3">3rd Place</SelectItem>
                        <SelectItem value="4">4th Place</SelectItem>
                        <SelectItem value="5">5th Place</SelectItem>
                        <SelectItem value="10">Top 10</SelectItem>
                        <SelectItem value="25">Top 25</SelectItem>
                        <SelectItem value="50">Top 50</SelectItem>
                        <SelectItem value="100">Top 100</SelectItem>
                        <SelectItem value="participation">Participation</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="submit">{isEditing ? "Update Achievement" : "Create Achievement"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
