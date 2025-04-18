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
        status: "approved",
        comments: comments || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Generate a student ID (e.g., 202500001)
    const academicYear = application.academic_year

    // Count existing students for this academic year to generate the next ID
    const { count, error: countError } = await supabase
      .from("students")
      .select("*", { count: "exact", head: true })
      .like("student_id", `${academicYear}%`)

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 })
    }

    const nextNumber = (count || 0) + 1
    const studentId = `${academicYear}${nextNumber.toString().padStart(5, "0")}`

    // Create a new user account
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: application.email,
      password: `${application.last_name.toLowerCase()}${academicYear}`, // Temporary password
      email_confirm: true,
      user_metadata: {
        first_name: application.first_name,
        last_name: application.last_name,
      },
    })

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 500 })
    }

    // Set the user role to student
    const { error: roleError } = await supabase
      .from("users")
      .update({ role_id: 3 }) // 3 = student role
      .eq("id", userData.user.id)

    if (roleError) {
      return NextResponse.json({ error: roleError.message }, { status: 500 })
    }

    // Create a student record
    const { error: studentError } = await supabase.from("students").insert({
      student_id: studentId,
      user_id: userData.user.id,
      first_name: application.first_name,
      last_name: application.last_name,
      date_of_birth: application.date_of_birth,
      gender: application.gender,
      address: application.address,
      profile_image_url: null,
    })

    if (studentError) {
      return NextResponse.json({ error: studentError.message }, { status: 500 })
    }

    // Create a parent record
    const { data: parentData, error: parentError } = await supabase
      .from("parents")
      .insert({
        first_name: application.parent_name.split(" ")[0],
        last_name: application.parent_name.split(" ").slice(1).join(" "),
        email: application.parent_email || null,
        phone: application.parent_phone,
        address: application.address,
      })
      .select()

    if (parentError) {
      return NextResponse.json({ error: parentError.message }, { status: 500 })
    }

    // Link the student and parent
    const { error: linkError } = await supabase.from("student_parents").insert({
      student_id: studentError ? null : studentId,
      parent_id: parentData[0].id,
      relationship: "Parent/Guardian",
    })

    if (linkError) {
      return NextResponse.json({ error: linkError.message }, { status: 500 })
    }

    // Create a notification for the student
    const { error: notificationError } = await supabase.from("notifications").insert({
      user_id: userData.user.id,
      title: "Application Approved",
      message: `Congratulations! Your application has been approved. Your student ID is ${studentId}. Please log in to your account to complete your profile.`,
      notification_type: "application_status",
    })

    if (notificationError) {
      console.error("Notification error:", notificationError)
    }

    return NextResponse.json({
      success: true,
      message: "Application approved successfully",
      studentId,
    })
  } catch (error) {
    console.error("Error approving application:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
