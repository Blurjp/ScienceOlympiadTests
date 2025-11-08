"use client"

import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Chrome } from "lucide-react"

export default function LoginPage() {
  const handleGoogleSignIn = async () => {
    await signIn("google", { callbackUrl: "/" })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold">Welcome Back</CardTitle>
          <CardDescription>
            Sign in to access your Science Olympiad tests and track your progress
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleGoogleSignIn}
            variant="outline"
            className="w-full h-12 text-lg"
            size="lg"
          >
            <Chrome className="mr-2 h-5 w-5" />
            Sign in with Google
          </Button>

          <div className="text-center text-sm text-gray-500">
            <p>
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>

          <div className="pt-4 border-t">
            <div className="text-sm text-gray-600 space-y-2">
              <p className="font-semibold">Features you&apos;ll unlock:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Save your test results and track progress</li>
                <li>Create and share custom tests</li>
                <li>Access test history and analytics</li>
                <li>Generate personalized practice tests</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
