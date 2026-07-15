"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"
import Link from "next/link"
import { LockKeyhole, Loader2, ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token") ?? ""
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard"

  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  if (!token) {
    return (
      <Card className="w-full max-w-md rounded-3xl border-[color:var(--border)] shadow-[var(--shadow-card)]">
        <CardContent className="pt-8 space-y-4">
          <p className="text-sm text-[color:var(--foreground-soft)]">
            This reset link is missing or invalid. Please request a new one.
          </p>
          <Link href="/forgot-password" className="text-sm font-medium underline underline-offset-4">
            Request a new reset link
          </Link>
        </CardContent>
      </Card>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (password !== confirm) {
      setError("Passwords do not match.")
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Something went wrong.")
        return
      }

      router.push(`/login?reset=1&callbackUrl=${encodeURIComponent(callbackUrl)}`)
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-md rounded-3xl border-[color:var(--border)] shadow-[var(--shadow-card)]">
      <CardHeader className="space-y-2">
        <CardTitle className="text-3xl font-extrabold">Set new password</CardTitle>
        <CardDescription>Choose a strong password for your account.</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--foreground-soft)]" />
              <Input
                id="password"
                type="password"
                placeholder="At least 8 characters"
                className="pl-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm password</Label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--foreground-soft)]" />
              <Input
                id="confirm"
                type="password"
                placeholder="Repeat your new password"
                className="pl-10"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                minLength={8}
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
                Saving…
              </>
            ) : (
              "Save new password"
            )}
          </Button>

          <Link
            href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            className="flex items-center justify-center gap-2 text-sm text-[color:var(--foreground-soft)] hover:text-[color:var(--foreground)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
        </form>
      </CardContent>
    </Card>
  )
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen text-[color:var(--foreground)]">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6 py-10 md:px-8">
        <Suspense fallback={<div className="w-full max-w-md" />}>
          <ResetPasswordContent />
        </Suspense>
      </div>
    </main>
  )
}
