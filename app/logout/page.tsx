"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function LogoutPage() {
  const router = useRouter()

  useEffect(() => {
    // Clear user data from localStorage
    localStorage.removeItem("user")

    // Redirect to login page
    setTimeout(() => {
      router.push("/login")
    }, 1000)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-500" />
        <h1 className="text-xl font-semibold mb-2">Logging out...</h1>
        <p className="text-gray-500">You will be redirected to the login page.</p>
      </div>
    </div>
  )
}
