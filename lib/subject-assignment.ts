// Function to automatically assign subjects based on class and grade
export const assignSubjectsToStudent = async (supabase: any, studentId: number, classId: number) => {
  try {
    // First, get the class details
    const { data: classData, error: classError } = await supabase
      .from("classes")
      .select(`
        id,
        name,
        grades(id, name)
      `)
      .eq("id", classId)
      .single()

    if (classError) throw classError

    if (!classData) {
      throw new Error("Class not found")
    }

    // Check if grade is 10, 11, or 12
    const gradeName = classData.grades?.name
    if (!gradeName || !gradeName.match(/^Grade (10|11|12)$/)) {
      // Not a grade 10-12, don't auto-assign subjects
      return { success: true, message: "No auto-assignment needed for this grade" }
    }

    // Get the class stream from the class name (A, B, C, or D)
    const classStream = classData.name

    if (!classStream.match(/^[ABCD]$/)) {
      throw new Error("Invalid class stream")
    }

    // Define compulsory subjects for all streams
    const compulsorySubjects = ["Home Language", "First Additional Language", "Life Orientation"]

    // Add stream-specific compulsory subject
    if (classStream === "A" || classStream === "B" || classStream === "C") {
      compulsorySubjects.push("Mathematics")
    } else if (classStream === "D") {
      compulsorySubjects.push("Mathematical Literacy")
    }

    // Define elective subjects based on stream
    let electiveSubjects: string[] = []

    switch (classStream) {
      case "A": // Commerce Stream
        electiveSubjects = ["Accounting", "Business Studies", "Economics"]
        break
      case "B": // Commerce Technical Stream
        electiveSubjects = ["Accounting", "Physical Sciences", "Life Sciences"]
        break
      case "C": // Technical Stream
        electiveSubjects = ["Physical Sciences", "Life Sciences", "Geography"]
        break
      case "D": // Humanities Stream
        electiveSubjects = ["History", "Geography", "Life Sciences"]
        break
    }

    // Get all subjects from the database
    const { data: allSubjects, error: subjectsError } = await supabase.from("subjects").select("id, name")

    if (subjectsError) throw subjectsError

    // Map subject names to IDs
    const subjectMap = allSubjects.reduce((acc: any, subject: any) => {
      acc[subject.name] = subject.id
      return acc
    }, {})

    // Get the current academic year
    const currentYear = new Date().getFullYear()

    // Combine compulsory and elective subjects
    const allSubjectsToAssign = [...compulsorySubjects, ...electiveSubjects]

    // Check if student already has these subjects assigned
    const { data: existingAssignments, error: existingError } = await supabase
      .from("student_subjects")
      .select("subject_id")
      .eq("student_id", studentId)
      .eq("academic_year", currentYear)

    if (existingError) throw existingError

    const existingSubjectIds = existingAssignments.map((assignment: any) => assignment.subject_id)

    // Filter out subjects that are already assigned
    const subjectsToAssign = allSubjectsToAssign
      .filter((subjectName) => subjectMap[subjectName]) // Ensure subject exists in database
      .filter((subjectName) => !existingSubjectIds.includes(subjectMap[subjectName])) // Ensure not already assigned

    if (subjectsToAssign.length === 0) {
      return { success: true, message: "Student already has all required subjects assigned" }
    }

    // Create assignments for all new subjects
    const assignments = subjectsToAssign.map((subjectName) => ({
      student_id: studentId,
      subject_id: subjectMap[subjectName],
      academic_year: currentYear,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }))

    const { error: insertError } = await supabase.from("student_subjects").insert(assignments)

    if (insertError) throw insertError

    return {
      success: true,
      message: `Successfully assigned ${subjectsToAssign.length} subjects to the student`,
      assignedSubjects: subjectsToAssign,
    }
  } catch (error) {
    console.error("Error assigning subjects:", error)
    return {
      success: false,
      message: "Failed to assign subjects",
      error,
    }
  }
}
