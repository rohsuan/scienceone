import type { Metadata } from "next"
import Link from "next/link"

import { AuthCard } from "@/components/auth/AuthCard"
import { ResendVerificationButton } from "@/components/auth/ResendVerificationButton"

export const metadata: Metadata = {
  title: "Verify Email — ScienceOne",
  description: "Check your inbox to verify your ScienceOne account.",
}

export default function VerifyEmailPage() {
  return (
    <AuthCard
      title="Check your email"
      description="We sent you a verification link"
      footer={
        <Link
          href="/sign-in"
          className="text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          Back to sign in
        </Link>
      }
    >
      <div className="space-y-6">
        {/* Mail icon */}
        <div className="flex justify-center">
          <div className="rounded-full bg-primary/10 p-4">
            <svg
              className="size-10 text-primary"
              aria-hidden="true"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
              />
            </svg>
          </div>
        </div>

        {/* Instruction text */}
        <p className="text-sm text-muted-foreground text-center leading-relaxed">
          Click the link in the email we sent to verify your account. Once
          verified, you can sign in and start reading.
        </p>

        {/* Divider */}
        <div className="border-t pt-4">
          <p className="text-xs text-muted-foreground text-center mb-3">
            Didn&apos;t receive the email?
          </p>
          <ResendVerificationButton />
        </div>
      </div>
    </AuthCard>
  )
}
