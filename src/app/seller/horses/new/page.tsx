"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function NewHorse() {
  const router = useRouter()

  const [name, setName] = useState("")
  const [breed, setBreed] = useState("")
  const [age, setAge] = useState("")
  const [price, setPrice] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const res = await fetch("/api/horses/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        breed,
        age: Number(age),
        price: Number(price),
      }),
    })

    if (res.ok) router.push("/seller/horses")
  }

  return (
    <main style={{ padding: 40 }}>
      <h1>Add Horse</h1>

      <form onSubmit={handleSubmit}>
        <input placeholder="Name" onChange={(e) => setName(e.target.value)} />
        <input placeholder="Breed" onChange={(e) => setBreed(e.target.value)} />
        <input placeholder="Age" onChange={(e) => setAge(e.target.value)} />
        <input placeholder="Price" onChange={(e) => setPrice(e.target.value)} />

        <button>Create</button>
      </form>
    </main>
  )
}