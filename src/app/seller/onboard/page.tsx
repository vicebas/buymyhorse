"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function SellerOnboard() {
  const router = useRouter()

  const [displayName, setDisplayName] = useState("")
  const [location, setLocation] = useState("")
  const [website, setWebsite] = useState("")
  const [bio, setBio] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const res = await fetch("/api/seller/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        displayName,
        location,
        website,
        bio,
      }),
    })

    if (res.ok) {
      router.push("/seller")
    }
  }

  return (
    <main style={{ padding: 40 }}>
      <h1>Create Seller Profile</h1>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input
          placeholder="Stable name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />

        <input
          placeholder="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />

        <input
          placeholder="Website"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />

        <textarea
          placeholder="Bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />

        <button>Create seller profile</button>
      </form>
    </main>
  )
}