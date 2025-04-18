import Link from "next/link"
import { CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function ApplicationSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">Application Submitted!</CardTitle>
          <CardDescription>Your application has been successfully submitted.</CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p>Thank you for applying to our school. We have received your application and will review it shortly.</p>
          <p>You will receive a notification via email and SMS regarding the status of your application.</p>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button className="w-full" asChild>
            <Link href="/">Return to Home</Link>
          </Button>
          <p className="text-sm text-center text-gray-500">
            If you have any questions, please contact us at admissions@school.edu
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
