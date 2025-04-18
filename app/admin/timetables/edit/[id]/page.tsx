"use client"

import { useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function EditTimetablePage() {
  const router = useRouter()
  const params = useParams()

  useEffect(() => {
    // Redirect to the create page with the timetable ID as a query parameter
    router.push(`/admin/timetables/create?id=${params.id}`)
  }, [router, params])

  return (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="ml-2">Redirecting to timetable editor...</span>
    </div>
  )
}
