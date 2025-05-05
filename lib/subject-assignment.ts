interface SubjectAssignmentOptions {
  studentId: number
  classId: number
}

export async function assignSubjectsToStudent(supabaseClient: any, studentId: number, classId: number) {
  try {
    // First, get the class details to determine the grade
    const { data: classData, error: classError } = await supabaseClient
      .from("classes")
      .select("grade_id")
      .eq("id", classId)
      .single()

    if (classError) throw classError
    if (!classData) throw new Error("Class not found")

    const gradeId = classData.grade_id

    // Get the subjects applicable to the grade
    const { data: subjectsData, error: subjectsError } = await supabaseClient
      .from("subjects")
      .select("id")
      .contains("applicable_grades", [gradeId])

    if (subjectsError) throw subjectsError
    if (!subjectsData || subjectsData.length === 0) {
      console.log("No subjects found for this grade")
      return
    }

    // Prepare student-subject assignments
    const studentSubjects = subjectsData.map((subject) => ({
      student_id: studentId,
      subject_id: subject.id,
    }))

    // Insert student-subject relationships
    const { error: insertError } = await supabaseClient.from("student_subjects").insert(studentSubjects)

    if (insertError) throw insertError

    console.log(`Successfully assigned ${studentSubjects.length} subjects to student ${studentId}`)
    return true
  } catch (error) {
    console.error("Error assigning subjects:", error)
    return false
  }
}

// Adding the missing export that's being referenced elsewhere in the code
export const assignSubjectsBasedOnClass = async (supabaseClient: any, studentId: number, classId: number) => {
  try {
    // First, get the class details
    const { data: classData, error: classError } = await supabaseClient
      .from("classes")
      .select(`
        id,
        name,
        grade_id
      `)
      .eq("id", classId)
      .single()

    if (classError) throw classError

    if (!classData) {
      throw new Error("Class not found")
    }

    // Get grade information
    const { data: gradeData, error: gradeError } = await supabaseClient
      .from("grades")
      .select("id, name")
      .eq("id", classData.grade_id)
      .single()

    if (gradeError) throw gradeError
    if (!gradeData) throw new Error("Grade not found")

    // Check if grade is 10, 11, or 12
    const gradeName = gradeData.name
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
    const { data: allSubjects, error: subjectsError } = await supabaseClient.from("subjects").select("id, name")

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
    const { data: existingAssignments, error: existingError } = await supabaseClient
      .from("student_subjects")
      .select("subject_id")
      .eq("student_id", studentId)

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
    }))

    const { error: insertError } = await supabaseClient.from("student_subjects").insert(assignments)

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
