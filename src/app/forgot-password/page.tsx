"use client"

import { useState } from "react"
import Link from "next/link"
import { Mail, Loader2, ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError("")

    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      // Always show success to prevent email enumeration
      setSubmitted(true)
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen text-[color:var(--foreground)]">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6 py-10 md:px-8">
        <div className="w-full max-w-md">
          <Card className="rounded-3xl border-[color:var(--border)] shadow-[var(--shadow-card)]">
            <CardHeader className="space-y-2">
              <CardTitle className="text-3xl font-extrabold">Reset password</CardTitle>
              <CardDescription>
                Enter your email and we&apos;ll send a reset link if an account exists.
              </CardDescription>
            </CardHeader>

            <CardContent>
              {submitted ? (
                <div className="space-y-5">
                  <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                    If an account with that email exists, you&apos;ll receive a password reset link shortly. Check your inbox.
                  </div>
                  <Link
                    href="/login"
                    className="flex items-center gap-2 text-sm text-[color:var(--foreground-soft)] hover:text-[color:var(--foreground)]"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to sign in
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--foreground-soft)]" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        className="pl-10"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {error ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {error}
                    </div>
                  ) : null}

                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending…
                      </>
                    ) : (
                      "Send reset link"
                    )}
                  </Button>

                  <Link
                    href="/login"
                    className="flex items-center justify-center gap-2 text-sm text-[color:var(--foreground-soft)] hover:text-[color:var(--foreground)]"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to sign in
                  </Link>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
