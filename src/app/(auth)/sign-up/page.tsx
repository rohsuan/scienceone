import type { Metadata } from "next"
import Link from "next/link"

import { AuthCard } from "@/components/auth/AuthCard"
import { SignUpForm } from "@/components/auth/SignUpForm"
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton"
import { Separator } from "@/components/ui/separator"

export const metadata: Metadata = {
  title: "Sign Up — ScienceOne",
  description: "Create your ScienceOne account and start reading STEM books with beautifully rendered mathematics.",
}

export default function SignUpPage() {
  return (
    <AuthCard
      title="Create your account"
      description="Start reading STEM books with beautifully rendered mathematics"
      footer={
        <p>
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="font-medium text-primary hover:underline"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <div className="space-y-4">
        <SignUpForm />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">or</span>
          </div>
        </div>

        <GoogleSignInButton />
      </div>
    </AuthCard>
  )
}
