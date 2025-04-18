import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = createServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the application ID from the request
    const { id, comments } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "Application ID is required" }, { status: 400 })
    }

    // Get the application details
    const { data: application, error: fetchError } = await supabase
      .from("applications")
      .select("*")
      .eq("id", id)
      .single()

    if (fetchError || !application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 })
    }

    // Update the application status
    const { error: updateError } = await supabase
      .from("applications")
      .update({
        status: "rejected",
        comments: comments || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // TODO: Send notification email to the applicant

    return NextResponse.json({
      success: true,
      message: "Application rejected successfully",
    })
  } catch (error) {
    console.error("Error rejecting application:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
