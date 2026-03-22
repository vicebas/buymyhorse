"use client"

import { useState, useEffect, useRef } from "react"
import { Bell } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"

type NotificationItem = {
  id: string
  type: string
  title: string
  body: string | null
  metadata: Record<string, string> | null
  isRead: boolean
  createdAt: string
}

function relativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function getNotificationHref(item: NotificationItem, userRole?: string): string {
  if (item.type === "NEW_MESSAGE" && item.metadata?.conversationId) {
    const base = userRole === "seller" ? "/seller/messages" : "/messages"
    return `${base}/${item.metadata.conversationId}`
  }
  if (
    item.type === "NEW_HORSE_FROM_FOLLOWED_BARN" ||
    item.type === "HORSE_UPDATED_FROM_FOLLOWED_BARN"
  ) {
    if (item.metadata?.horseId) return `/horses/${item.metadata.horseId}`
    if (item.metadata?.barnSlug) return `/barn/${item.metadata.barnSlug}`
  }
  return "/notifications"
}

export function NotificationBell({ userRole }: { userRole?: string }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  async function fetchNotifications() {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" })
      if (!res.ok) return
      const data = (await res.json()) as NotificationItem[]
      setNotifications(data.slice(0, 10))
      setUnreadCount(data.filter((n) => !n.isRead).length)
    } catch {
      // silently ignore network errors
    }
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 60_000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!isOpen) return

    function handlePointerDown(e: PointerEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false)
    }

    document.addEventListener("pointerdown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen])

  async function handleToggle() {
    const opening = !isOpen
    setIsOpen(opening)
    if (opening && unreadCount > 0) {
      try {
        await fetch("/api/notifications/mark-read", { method: "POST" })
        setUnreadCount(0)
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      } catch {
        // ignore
      }
    }
  }

  const badgeLabel = unreadCount > 9 ? "9+" : `${unreadCount}`

  return (
    <div className="relative" ref={containerRef}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : "Notifications"
        }
        aria-expanded={isOpen}
        aria-controls="notification-bell-panel"
        onClick={handleToggle}
      >
        <Bell size={16} />
      </Button>

      {unreadCount > 0 && (
        <span className="pointer-events-none absolute -right-1.5 -top-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-[color:var(--destructive)] px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
          {badgeLabel}
        </span>
      )}

      {isOpen && (
        <div
          id="notification-bell-panel"
          className="absolute right-0 top-full z-50 mt-3 w-[min(360px,calc(100vw-3rem))] rounded-3xl border border-[color:var(--border)] bg-[color:var(--background-elevated)] shadow-[var(--shadow-card)]"
        >
          <div className="border-b border-[color:var(--border)] px-4 py-3">
            <span className="text-sm font-semibold text-[color:var(--foreground-strong)]">
              Notifications
            </span>
          </div>

          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-[color:var(--foreground-soft)]">
              No notifications yet
            </div>
          ) : (
            <ul className="max-h-[360px] divide-y divide-[color:var(--border)] overflow-y-auto">
              {notifications.map((n) => (
                <li key={n.id}>
                  <Link
                    href={getNotificationHref(n, userRole)}
                    onClick={() => setIsOpen(false)}
                    className={`block px-4 py-3 transition-colors hover:bg-[color:var(--muted)]${
                      !n.isRead
                        ? " border-l-2 border-[color:var(--accent)]"
                        : ""
                    }`}
                  >
                    <p
                      className={`text-sm ${
                        !n.isRead
                          ? "font-semibold text-[color:var(--foreground-strong)]"
                          : "text-[color:var(--foreground)]"
                      }`}
                    >
                      {n.title}
                    </p>
                    {n.body && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-[color:var(--foreground-soft)]">
                        {n.body}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-[color:var(--foreground-soft)]">
                      {relativeTime(new Date(n.createdAt))}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <div className="border-t border-[color:var(--border)] px-4 py-2.5">
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs text-[color:var(--foreground-soft)] transition-colors hover:text-[color:var(--foreground-strong)]"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
