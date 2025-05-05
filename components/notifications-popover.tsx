"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"

export function NotificationsPopover() {
  const { toast } = useToast()
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchNotifications()

    // Set up real-time subscription for new notifications
    const channel = supabase
      .channel("notifications_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          fetchNotifications()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchNotifications = async () => {
    setIsLoading(true)
    try {
      let user = null
      try {
        const userData = localStorage.getItem("user")
        if (userData) {
          user = JSON.parse(userData)
        }
      } catch (e) {
        console.error("Error parsing user data:", e)
      }

      let query = supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(10)

      // Only filter by user_id if we have a valid user ID
      if (user && user.id) {
        query = query.or(`user_id.is.null,user_id.eq.${user.id}`)
      } else {
        // If no user ID, only get public notifications
        query = query.filter("user_id", "is", null)
      }

      const { data, error } = await query

      if (error) throw error
      setNotifications(data || [])
      setUnreadCount(data?.filter((n) => !n.is_read).length || 0)
    } catch (error) {
      console.error("Error fetching notifications:", error)
      toast({
        title: "Error",
        description: "Failed to load notifications",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = async (id: number) => {
    try {
      const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id)

      if (error) throw error

      setNotifications(notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error("Error marking notification as read:", error)
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      })
    }
  }

  const markAllAsRead = async () => {
    try {
      let user = null
      try {
        const userData = localStorage.getItem("user")
        if (userData) {
          user = JSON.parse(userData)
        }
      } catch (e) {
        console.error("Error parsing user data:", e)
      }

      // Only proceed if we have a valid user ID
      if (user && user.id) {
        const { error } = await supabase
          .from("notifications")
          .update({ is_read: true })
          .or(`user_id.is.null,user_id.eq.${user.id}`)

        if (error) throw error

        // Update local state
        setNotifications((prev) => prev.map((notification) => ({ ...notification, is_read: true })))
      }

      toast({
        title: "Success",
        description: "All notifications marked as read",
      })
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive",
      })
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 px-1 min-w-[18px] h-[18px] text-xs flex items-center justify-center">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-medium">Notifications</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              Mark all as read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {notifications.length > 0 ? (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div key={notification.id} className={`p-4 ${notification.is_read ? "" : "bg-primary/5"}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{notification.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <Button variant="ghost" size="sm" onClick={() => markAsRead(notification.id)} className="text-xs">
                        Mark read
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-4">
              <Bell className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No notifications</p>
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
