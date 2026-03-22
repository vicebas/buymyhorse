"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import Link from "next/link"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type Status = "verifying" | "success" | "error"

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token") ?? ""

  const [status, setStatus] = useState<Status>(token ? "verifying" : "error")
  const [errorMessage, setErrorMessage] = useState(
    token ? "" : "Verification token is missing."
  )

  useEffect(() => {
    if (!token) return

    let cancelled = false

    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        if (cancelled) return
        if (!res.ok) {
          const data = await res.json()
          setErrorMessage(data.error || "Verification failed.")
          setStatus("error")
        } else {
          setStatus("success")
        }
      })
      .catch(() => {
        if (!cancelled) {
          setErrorMessage("Something went wrong. Please try again.")
          setStatus("error")
        }
      })

    return () => {
      cancelled = true
    }
  }, [token])

  return (
    <Card className="w-full max-w-md rounded-3xl border-[color:var(--border)] shadow-[var(--shadow-card)]">
      <CardHeader className="space-y-2">
        <CardTitle className="text-3xl font-extrabold">Email verification</CardTitle>
        <CardDescription>Confirming your email address…</CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {status === "verifying" && (
          <div className="flex items-center gap-3 text-sm text-[color:var(--foreground-soft)]">
            <Loader2 className="h-5 w-5 animate-spin" />
            Verifying your email address… please wait.
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
              <p className="text-sm text-green-800">
                Your email has been verified. You can now use all features of HorseRoster.
              </p>
            </div>
            <Button asChild className="w-full">
              <Link href="/dashboard">Go to dashboard</Link>
            </Button>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
              <p className="text-sm text-red-700">{errorMessage}</p>
            </div>
            <p className="text-sm text-[color:var(--foreground-soft)]">
              Need a new link?{" "}
              <Link
                href="/dashboard"
                className="font-medium text-[color:var(--foreground-strong)] underline underline-offset-4"
              >
                Go to your dashboard
              </Link>{" "}
              and use the verification banner to resend.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function VerifyEmailPage() {
  return (
    <main className="min-h-screen text-[color:var(--foreground)]">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6 py-10 md:px-8">
        <Suspense fallback={<div className="w-full max-w-md" />}>
          <VerifyEmailContent />
        </Suspense>
      </div>
    </main>
  )
}
