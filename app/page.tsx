import Link from "next/link"
import { Button } from "@/components/ui/button"
import { GraduationCap, BookOpen, LineChart } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-black text-white p-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <GraduationCap className="h-6 w-6" />
          <h1 className="text-xl font-bold">School Management System</h1>
        </div>
        <Link href="/apply">
          <Button variant="outline" className="bg-white text-black hover:bg-gray-100">
            Apply Now
          </Button>
        </Link>
      </header>

      <main className="flex-1">
        <section className="py-16 text-center">
          <h2 className="text-3xl font-bold mb-4">Welcome to Our School</h2>
          <p className="max-w-3xl mx-auto text-gray-600 mb-8 px-4">
            Our comprehensive school management system makes education easier for students, teachers, and
            administrators. From application to graduation, we provide the tools needed for academic success.
          </p>
        </section>

        <section className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 px-4 mb-16">
          <div className="border rounded-lg p-6 text-center hover:shadow-lg transition-shadow">
            <div className="flex justify-center mb-4">
              <GraduationCap className="h-12 w-12" />
            </div>
            <h3 className="text-xl font-bold mb-2">Easy Application</h3>
            <p className="text-gray-600 mb-4">
              Grade 7 learners can apply online by submitting their information and final results.
            </p>
            <Link href="/apply">
              <Button className="w-full bg-black text-white hover:bg-gray-800">Apply Now</Button>
            </Link>
          </div>

          <div className="border rounded-lg p-6 text-center hover:shadow-lg transition-shadow">
            <div className="flex justify-center mb-4">
              <BookOpen className="h-12 w-12" />
            </div>
            <h3 className="text-xl font-bold mb-2">Learning Materials</h3>
            <p className="text-gray-600 mb-4">
              Access textbooks, notes, and past exam papers for all grades from 8 to 12.
            </p>
            <Link href="/login">
              <Button className="w-full bg-black text-white hover:bg-gray-800">Explore Materials</Button>
            </Link>
          </div>

          <div className="border rounded-lg p-6 text-center hover:shadow-lg transition-shadow">
            <div className="flex justify-center mb-4">
              <LineChart className="h-12 w-12" />
            </div>
            <h3 className="text-xl font-bold mb-2">Academic Tracking</h3>
            <p className="text-gray-600 mb-4">
              Track academic progress, view term results, and see rankings within classes and grades.
            </p>
            <Link href="/login">
              <Button className="w-full bg-black text-white hover:bg-gray-800">Login to View</Button>
            </Link>
          </div>
        </section>

        <section className="bg-gray-100 py-12">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl font-bold mb-8">Key Features</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="flex items-start space-x-4">
                <div className="bg-black text-white p-2 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold mb-1">Notifications</h3>
                  <p className="text-gray-600">Receive important updates via email and SMS</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-black text-white p-2 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold mb-1">Class Management</h3>
                  <p className="text-gray-600">View classmates and class representatives</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-black text-white p-2 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold mb-1">Subject Selection</h3>
                  <p className="text-gray-600">Choose subjects when reaching Grade 10</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-black text-white p-2 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold mb-1">Academic Reports</h3>
                  <p className="text-gray-600">Comprehensive term and final results</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold mb-4">School Statistics</h2>
            <p className="text-gray-600 mb-8">
              Our school maintains high academic standards with excellent performance across all grades.
            </p>
          </div>
        </section>
      </main>

      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-bold mb-4">Contact Us</h3>
              <p>123 School Street</p>
              <p>Pretoria, South Africa</p>
              <p>Email: info@schoolname.edu</p>
              <p>Phone: +27 12 345 6789</p>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/apply" className="hover:underline">
                    Apply Now
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:underline">
                    Student Portal
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:underline">
                    Teacher Portal
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:underline">
                    Admin Portal
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">School Hours</h3>
              <p>Monday - Friday: 7:30 AM - 2:30 PM</p>
              <p>Office Hours: 7:00 AM - 4:00 PM</p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-700 text-center">
            <p>&copy; {new Date().getFullYear()} School Management System. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
