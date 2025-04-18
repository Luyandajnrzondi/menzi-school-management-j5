"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, CheckCircle, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"

export default function AdminNotificationsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [notifications, setNotifications] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isMarkingRead, setIsMarkingRead] = useState(false)

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
    fetchNotifications()
  }, [router])

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .or(`user_id.is.null,user_id.eq.${user?.id}`)
        .order("created_at", { ascending: false })

      if (error) {
        throw error
      }

      setNotifications(data || [])
    } catch (error) {
      console.error("Error fetching notifications:", error)
      toast({
        title: "Error",
        description: "Failed to load notifications. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const markAllAsRead = async () => {
    setIsMarkingRead(true)
    try {
      const unreadNotifications = notifications.filter((notification) => !notification.is_read)

      if (unreadNotifications.length === 0) {
        toast({
          title: "No Unread Notifications",
          description: "You have no unread notifications.",
        })
        return
      }

      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .or(`user_id.is.null,user_id.eq.${user?.id}`)
        .eq("is_read", false)

      if (error) {
        throw error
      }

      // Update local state
      setNotifications(
        notifications.map((notification) => ({
          ...notification,
          is_read: true,
        })),
      )

      toast({
        title: "Notifications Marked as Read",
        description: "All notifications have been marked as read.",
      })
    } catch (error) {
      console.error("Error marking notifications as read:", error)
      toast({
        title: "Error",
        description: "Failed to mark notifications as read. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsMarkingRead(false)
    }
  }

  const markAsRead = async (id: number) => {
    try {
      const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id)

      if (error) {
        throw error
      }

      // Update local state
      setNotifications(
        notifications.map((notification) =>
          notification.id === id ? { ...notification, is_read: true } : notification,
        ),
      )

      toast({
        title: "Notification Marked as Read",
        description: "The notification has been marked as read.",
      })
    } catch (error) {
      console.error("Error marking notification as read:", error)
      toast({
        title: "Error",
        description: "Failed to mark notification as read. Please try again.",
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

  const unreadCount = notifications.filter((notification) => !notification.is_read).length

  return (
    <DashboardLayout user={user}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold">Notifications</h1>
            {unreadCount > 0 && (
              <Badge className="ml-2 bg-red-500" variant="default">
                {unreadCount} unread
              </Badge>
            )}
          </div>
          <Button onClick={markAllAsRead} disabled={isMarkingRead || unreadCount === 0}>
            {isMarkingRead ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            Mark All as Read
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Notifications</CardTitle>
            <CardDescription>Stay updated with important events and activities</CardDescription>
          </CardHeader>
          <CardContent>
            {notifications.length > 0 ? (
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <Card
                    key={notification.id}
                    className={`border-l-4 ${
                      notification.is_read ? "border-l-gray-200" : "border-l-primary"
                    } hover:bg-gray-50`}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start space-x-4">
                          <div
                            className={`mt-1 p-2 rounded-full ${
                              notification.is_read ? "bg-gray-100" : "bg-primary/10"
                            }`}
                          >
                            <Bell className={`h-5 w-5 ${notification.is_read ? "text-gray-500" : "text-primary"}`} />
                          </div>
                          <div>
                            <h3 className="font-medium">{notification.title}</h3>
                            <p className="text-gray-600 mt-1">{notification.message}</p>
                            <p className="text-xs text-gray-500 mt-2">
                              {new Date(notification.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        {!notification.is_read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                            className="text-primary"
                          >
                            Mark as read
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Bell className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-4 text-lg font-medium">No notifications</h3>
                <p className="mt-1 text-gray-500">You don't have any notifications at the moment.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
