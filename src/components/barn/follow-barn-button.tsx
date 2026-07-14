"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Heart, HeartMinus } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FollowBarnButtonProps {
  barnSlug: string
  initialIsFollowing: boolean
  isAuthenticated: boolean
}

export function FollowBarnButton({ barnSlug, initialIsFollowing, isAuthenticated }: FollowBarnButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleClick = async () => {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }
    setIsLoading(true)
    const prev = isFollowing
    setIsFollowing(!isFollowing) // optimistic
    try {
      const res = await fetch(`/api/barns/${barnSlug}/follow`, { method: "POST" })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setIsFollowing(data.isFollowing)
    } catch {
      setIsFollowing(prev) // revert
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={isLoading}
      className="gap-1.5"
    >
      {isFollowing ? (
        <>
          <HeartMinus className="h-3.5 w-3.5" />
          Unfollow
        </>
      ) : (
        <>
          <Heart className="h-3.5 w-3.5" />
          Follow
        </>
      )}
    </Button>
  )
}
