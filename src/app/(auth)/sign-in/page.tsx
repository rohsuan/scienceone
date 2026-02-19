import type { Metadata } from "next"
import Link from "next/link"

import { AuthCard } from "@/components/auth/AuthCard"
import { SignInForm } from "@/components/auth/SignInForm"
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton"
import { Separator } from "@/components/ui/separator"

export const metadata: Metadata = {
  title: "Sign In — ScienceOne",
  description: "Sign in to your ScienceOne account and continue reading.",
}

interface SignInPageProps {
  searchParams: Promise<{ redirect?: string }>
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams
  const raw = params.redirect ?? ""
  // Only accept paths starting with / but not // (prevents open redirect)
  const redirectTo =
    raw.startsWith("/") && !raw.startsWith("//") ? raw : "/dashboard"

  return (
    <AuthCard
      title="Welcome back"
      description="Sign in to continue reading"
      footer={
        <p>
          Don&apos;t have an account?{" "}
          <Link
            href="/sign-up"
            className="font-medium text-primary hover:underline"
          >
            Sign up
          </Link>
        </p>
      }
    >
      <div className="space-y-4">
        <SignInForm redirectTo={redirectTo} />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">or</span>
          </div>
        </div>

        <GoogleSignInButton redirectTo={redirectTo} />
      </div>
    </AuthCard>
  )
}
