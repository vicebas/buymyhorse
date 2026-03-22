"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Loader2, LockKeyhole, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function LoginPageContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const passwordReset = searchParams.get("reset") === "1";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });

    setSubmitting(false);

    if (!result || result.error) {
      setError("Invalid email or password.");
      return;
    }

    window.location.href = result.url || callbackUrl;
  }

  return (
    <main className="min-h-screen text-[color:var(--foreground)]">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center px-6 py-10 md:px-8">
        <div className="grid w-full gap-8 lg:grid-cols-2">
          <div className="hidden flex-col justify-center lg:flex">
            <p className="mono text-sm font-medium uppercase tracking-[0.18em] text-[color:var(--foreground-soft)]">
              HorseRoster
            </p>
            <h1 className="mt-4 text-5xl leading-tight font-extrabold">
              Welcome back to the HorseRoster marketplace
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[color:var(--foreground-soft)]">
              Sign in to manage your barn, review inquiries, and keep your listings polished across light and dark themes.
            </p>
          </div>

          <div className="flex items-center justify-center">
            <Card className="w-full max-w-md rounded-3xl border-[color:var(--border)] shadow-[var(--shadow-card)]">
              <CardHeader className="space-y-2">
                <CardTitle className="text-3xl font-extrabold">Sign in</CardTitle>
                <CardDescription>
                  Access your account to continue.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                  {passwordReset ? (
                    <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                      Password updated successfully. Sign in with your new password.
                    </div>
                  ) : null}

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
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

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <Link
                        href="/forgot-password"
                        className="text-xs text-[color:var(--foreground-soft)] hover:text-[color:var(--foreground)] underline underline-offset-4"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--foreground-soft)]" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        className="pl-10"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
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
                        Signing in...
                      </>
                    ) : (
                      "Sign in"
                    )}
                  </Button>

                  <p className="text-center text-sm text-[color:var(--foreground-soft)]">
                    Don&apos;t have an account?{" "}
                    <Link
                      href={`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`}
                      className="font-medium text-[color:var(--foreground-strong)] underline underline-offset-4"
                    >
                      Create one
                    </Link>
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[color:var(--background)]" />}>
      <LoginPageContent />
    </Suspense>
  );
}
