import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"

import { AuthCard } from "@/components/auth/AuthCard"
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm"

export const metadata: Metadata = {
  title: "Reset Password — ScienceOne",
  description: "Set a new password for your ScienceOne account.",
}

export default function ResetPasswordPage() {
  return (
    <AuthCard
      title="Reset your password"
      description="Enter your new password below"
      footer={
        <p>
          Back to{" "}
          <Link
            href="/sign-in"
            className="font-medium text-primary hover:underline"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </AuthCard>
  )
}
