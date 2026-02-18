"use client"

import { useState, useEffect } from "react"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function ResendVerificationButton() {
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle")
  const [email, setEmail] = useState("")
  const [showEmailInput, setShowEmailInput] = useState(false)

  useEffect(() => {
    // Retrieve email stored by SignUpForm after successful registration
    const stored = sessionStorage.getItem("pending-verification-email")
    if (stored) {
      setEmail(stored)
    } else {
      setShowEmailInput(true)
    }
  }, [])

  const handleResend = async () => {
    if (!email.trim()) {
      setShowEmailInput(true)
      return
    }

    setStatus("loading")
    const { error } = await authClient.sendVerificationEmail({
      email,
      callbackURL: "/sign-in",
    })

    if (error) {
      setStatus("error")
    } else {
      setStatus("sent")
    }
  }

  if (status === "sent") {
    return (
      <p className="text-sm text-green-700 bg-green-50 rounded-md px-4 py-2 text-center">
        Verification email sent. Check your inbox.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {showEmailInput && (
        <Input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="text-sm"
          aria-label="Your email address"
        />
      )}
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleResend}
        disabled={status === "loading"}
      >
        {status === "loading" ? "Sending..." : "Resend verification email"}
      </Button>
      {status === "error" && (
        <p className="text-sm text-destructive text-center">
          Could not resend — please try again.
        </p>
      )}
    </div>
  )
}
