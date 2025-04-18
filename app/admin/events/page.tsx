"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Search, Plus, Calendar, Edit, Trash2, ArrowUpDown } from "lucide-react"
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
import { Checkbox } from "@/components/ui/checkbox"

const eventSchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  location: z.string().optional(),
  start_date: z.string().min(1, { message: "Start date is required" }),
  end_date: z.string().min(1, { message: "End date is required" }),
  is_all_day: z.boolean().default(false),
  event_type: z.string().min(1, { message: "Event type is required" }),
  is_public: z.boolean().default(true),
})

export default function EventsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [events, setEvents] = useState<any[]>([])
  const [filteredEvents, setFilteredEvents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentEvent, setCurrentEvent] = useState<any>(null)

  // Filtering and sorting states
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterDate, setFilterDate] = useState<string>("all")
  const [sortField, setSortField] = useState<string>("date")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  const form = useForm<z.infer<typeof eventSchema>>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      start_date: new Date().toISOString().split("T")[0],
      end_date: new Date().toISOString().split("T")[0],
      is_all_day: false,
      event_type: "general",
      is_public: true,
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
    fetchEvents()
  }, [router])

  useEffect(() => {
    applyFiltersAndSort()
  }, [searchQuery, filterType, filterDate, sortField, sortDirection, events])

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase.from("events").select("*").order("start_date", { ascending: false })

      if (error) throw error

      setEvents(data || [])
      setFilteredEvents(data || [])
    } catch (error) {
      console.error("Error fetching events:", error)
      toast({
        title: "Error",
        description: "Failed to load events. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const applyFiltersAndSort = () => {
    let filtered = [...events]

    // Apply search filter
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(query) ||
          event.description.toLowerCase().includes(query) ||
          (event.location && event.location.toLowerCase().includes(query)),
      )
    }

    // Apply event type filter
    if (filterType !== "all") {
      filtered = filtered.filter((event) => event.event_type === filterType)
    }

    // Apply date filter
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (filterDate === "upcoming") {
      filtered = filtered.filter((event) => new Date(event.start_date) >= today)
    } else if (filterDate === "past") {
      filtered = filtered.filter((event) => new Date(event.end_date) < today)
    } else if (filterDate === "today") {
      filtered = filtered.filter((event) => new Date(event.start_date) <= today && new Date(event.end_date) >= today)
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
          valueA = new Date(a.start_date).getTime()
          valueB = new Date(b.start_date).getTime()
          break
        case "type":
          valueA = a.event_type.toLowerCase()
          valueB = b.event_type.toLowerCase()
          break
        default:
          valueA = new Date(a.start_date).getTime()
          valueB = new Date(b.start_date).getTime()
      }

      if (sortDirection === "asc") {
        return valueA > valueB ? 1 : -1
      } else {
        return valueA < valueB ? 1 : -1
      }
    })

    setFilteredEvents(filtered)
  }

  const resetFilters = () => {
    setSearchQuery("")
    setFilterType("all")
    setFilterDate("all")
    setSortField("date")
    setSortDirection("asc")
  }

  const handleDeleteEvent = async (id: number) => {
    setIsDeleting(true)
    setDeleteId(id)
    try {
      const { error } = await supabase.from("events").delete().eq("id", id)

      if (error) throw error

      toast({
        title: "Event Deleted",
        description: "The event has been deleted successfully.",
      })

      // Refresh events
      fetchEvents()
    } catch (error) {
      console.error("Error deleting event:", error)
      toast({
        title: "Error",
        description: "Failed to delete event. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setDeleteId(null)
    }
  }

  const openEditDialog = (event: any) => {
    setCurrentEvent(event)
    setIsEditing(true)

    form.reset({
      title: event.title,
      description: event.description,
      location: event.location || "",
      start_date: new Date(event.start_date).toISOString().split("T")[0],
      end_date: new Date(event.end_date).toISOString().split("T")[0],
      is_all_day: event.is_all_day,
      event_type: event.event_type,
      is_public: event.is_public,
    })

    setIsDialogOpen(true)
  }

  const openAddDialog = () => {
    setCurrentEvent(null)
    setIsEditing(false)

    form.reset({
      title: "",
      description: "",
      location: "",
      start_date: new Date().toISOString().split("T")[0],
      end_date: new Date().toISOString().split("T")[0],
      is_all_day: false,
      event_type: "general",
      is_public: true,
    })

    setIsDialogOpen(true)
  }

  const onSubmit = async (data: z.infer<typeof eventSchema>) => {
    try {
      if (isEditing && currentEvent) {
        // Update existing event
        const { error } = await supabase
          .from("events")
          .update({
            title: data.title,
            description: data.description,
            location: data.location || null,
            start_date: data.start_date,
            end_date: data.end_date,
            is_all_day: data.is_all_day,
            event_type: data.event_type,
            is_public: data.is_public,
            updated_at: new Date().toISOString(),
          })
          .eq("id", currentEvent.id)

        if (error) throw error

        toast({
          title: "Event Updated",
          description: "The event has been updated successfully.",
        })
      } else {
        // Create new event
        const { data: newEvent, error } = await supabase
          .from("events")
          .insert({
            title: data.title,
            description: data.description,
            location: data.location || null,
            start_date: data.start_date,
            end_date: data.end_date,
            is_all_day: data.is_all_day,
            event_type: data.event_type,
            is_public: data.is_public,
            created_by: user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()

        if (error) throw error

        toast({
          title: "Event Created",
          description: "The event has been created successfully.",
        })
      }

      // Refresh events
      fetchEvents()
      setIsDialogOpen(false)
    } catch (error) {
      console.error("Error saving event:", error)
      toast({
        title: "Error",
        description: "Failed to save event. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case "academic":
        return "Academic"
      case "sports":
        return "Sports"
      case "cultural":
        return "Cultural"
      case "holiday":
        return "Holiday"
      case "exam":
        return "Exam"
      default:
        return "General"
    }
  }

  const getEventTypeBadge = (type: string) => {
    switch (type) {
      case "academic":
        return <Badge className="bg-blue-500">Academic</Badge>
      case "sports":
        return <Badge className="bg-green-500">Sports</Badge>
      case "cultural":
        return <Badge className="bg-purple-500">Cultural</Badge>
      case "holiday":
        return <Badge className="bg-red-500">Holiday</Badge>
      case "exam":
        return <Badge className="bg-yellow-500">Exam</Badge>
      default:
        return <Badge>General</Badge>
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
            <h1 className="text-2xl font-bold">School Events</h1>
            <p className="text-muted-foreground">Manage and schedule school events</p>
          </div>
          <Button onClick={openAddDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search & Filter</CardTitle>
            <CardDescription>Find events by title, type, or date</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-8"
                  placeholder="Search events..."
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
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="academic">Academic</SelectItem>
                    <SelectItem value="sports">Sports</SelectItem>
                    <SelectItem value="cultural">Cultural</SelectItem>
                    <SelectItem value="holiday">Holiday</SelectItem>
                    <SelectItem value="exam">Exam</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Select value={filterDate} onValueChange={setFilterDate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Dates</SelectItem>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="past">Past</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Select value={sortField} onValueChange={setSortField}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                    <SelectItem value="type">Type</SelectItem>
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
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event) => (
              <Card key={event.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{event.title}</CardTitle>
                    {getEventTypeBadge(event.event_type)}
                  </div>
                  <CardDescription>
                    {new Date(event.start_date).toLocaleDateString()}
                    {event.start_date !== event.end_date && ` - ${new Date(event.end_date).toLocaleDateString()}`}
                    {event.is_all_day && " (All day)"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm line-clamp-3">{event.description}</p>
                  {event.location && (
                    <p className="text-sm text-muted-foreground mt-2">
                      <span className="font-medium">Location:</span> {event.location}
                    </p>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" size="sm" onClick={() => openEditDialog(event)}>
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
                          This action cannot be undone. This will permanently delete the event.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteEvent(event.id)}
                          disabled={isDeleting && deleteId === event.id}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {isDeleting && deleteId === event.id ? (
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
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No Events Found</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-md">
                {searchQuery || filterType !== "all" || filterDate !== "all"
                  ? "No events match your search criteria."
                  : "No events have been created yet."}
              </p>
              <Button onClick={openAddDialog} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Add Event
              </Button>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Event" : "Add New Event"}</DialogTitle>
            <DialogDescription>
              {isEditing ? "Update the details of this event" : "Fill in the details to create a new school event"}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter event title" {...field} />
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
                      <Textarea placeholder="Enter event description" className="min-h-[100px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter event location" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="event_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select event type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="academic">Academic</SelectItem>
                        <SelectItem value="sports">Sports</SelectItem>
                        <SelectItem value="cultural">Cultural</SelectItem>
                        <SelectItem value="holiday">Holiday</SelectItem>
                        <SelectItem value="exam">Exam</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-col space-y-4">
                <FormField
                  control={form.control}
                  name="is_all_day"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>All-day Event</FormLabel>
                        <FormDescription>This event lasts the entire day</FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_public"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Public Event</FormLabel>
                        <FormDescription>This event is visible to all users</FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="submit">{isEditing ? "Update Event" : "Create Event"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
