import type { ReactNode } from "react"
import Link from "next/link"

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-muted flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <div className="mb-8">
        <Link
          href="/"
          className="heading-serif text-2xl font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          ScienceOne
        </Link>
      </div>

      {/* Auth content */}
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  )
}
