"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { ReactNode } from "react"
import { Sidebar } from "@/components/sidebar"

interface DashboardLayoutProps {
  children: ReactNode
  user?: {
    name: string
    email: string
    role: string
    avatar?: string
  }
}

export function DashboardLayout({ children, user: propUser }: DashboardLayoutProps) {
  const router = useRouter()
  const [user, setUser] = useState(propUser)

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem("user")

    if (!storedUser) {
      router.push("/login")
      return
    }

    // If no user was passed as prop, use the one from localStorage
    if (!propUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [propUser, router])

  if (!user) {
    return null // Or a loading spinner
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="w-64 hidden md:block">
        <Sidebar user={user} />
      </div>
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  )
}
