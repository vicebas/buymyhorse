"use client"

import { useState } from "react"
import { AlertTriangle, X, Loader2 } from "lucide-react"

export default function EmailVerificationBanner() {
  const [dismissed, setDismissed] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  if (dismissed) return null

  async function handleResend() {
    setSending(true)
    setError("")
    try {
      const res = await fetch("/api/auth/send-verification", { method: "POST" })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Couldn't send the email.")
      } else {
        setSent(true)
      }
    } catch {
      setError("Something went wrong.")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex items-center justify-between gap-4 bg-amber-50 px-4 py-2.5 text-sm text-amber-900 border-b border-amber-200">
      <div className="flex items-center gap-2 min-w-0">
        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
        <span className="truncate">
          {sent
            ? "Verification email sent — check your inbox."
            : "Please verify your email address to unlock all features."}
        </span>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {!sent && (
          <button
            onClick={handleResend}
            disabled={sending}
            className="flex items-center gap-1 rounded font-medium underline underline-offset-2 hover:text-amber-700 disabled:opacity-60"
          >
            {sending ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Sending…
              </>
            ) : (
              "Resend email"
            )}
          </button>
        )}

        {error ? (
          <span className="text-red-700 text-xs">{error}</span>
        ) : null}

        <button
          onClick={() => setDismissed(true)}
          className="rounded p-0.5 hover:bg-amber-100"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
