"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import AppHeader from "@/components/layout/app-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function NewHorsePage() {

  const router = useRouter()

  const [loading,setLoading] = useState(false)

  async function handleSubmit(e:any){
    e.preventDefault()

    const form = new FormData(e.target)

    setLoading(true)

    const res = await fetch("/api/horses/create",{
      method:"POST",
      body:form
    })

    setLoading(false)

    if(res.ok){
      router.push("/seller/horses")
    }
  }

  return (
    <main className="min-h-screen bg-stone-50">
      <AppHeader variant="seller"/>

      <section className="mx-auto max-w-3xl px-6 py-10">

        <h1 className="font-serif text-3xl mb-8">
          Add Horse
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">

          <div>
            <Label>Name</Label>
            <Input name="name" required />
          </div>

          <div>
            <Label>Breed</Label>
            <Input name="breed" />
          </div>

          <div>
            <Label>Age</Label>
            <Input name="age" />
          </div>

          <div>
            <Label>Price</Label>
            <Input name="price" />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea name="description" />
          </div>

          <div>
            <Label>Horse Image</Label>
            <Input type="file" name="image"/>
          </div>

          <Button type="submit">
            {loading ? "Creating..." : "Create Horse"}
          </Button>

        </form>

      </section>
    </main>
  )
}