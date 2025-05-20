"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem("user")

    if (!storedUser) {
      router.push("/login")
      return
    }

    setUser(JSON.parse(storedUser))
    setIsLoading(false)
  }, [router])

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <DashboardLayout user={user}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-2">Welcome, {user?.name}</h2>
            <p className="text-gray-600">This is your dashboard. You can manage your school activities from here.</p>
          </Card>

          <Card className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-2">Quick Stats</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Students:</span>
                <span className="font-medium">450</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Teachers:</span>
                <span className="font-medium">35</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Classes:</span>
                <span className="font-medium">15</span>
              </div>
            </div>
          </Card>

          <Card className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-2">Recent Notifications</h2>
            <ul className="space-y-2">
              <li className="text-gray-600">New application received</li>
              <li className="text-gray-600">Term 2 results published</li>
              <li className="text-gray-600">Parent-teacher meeting scheduled</li>
            </ul>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
