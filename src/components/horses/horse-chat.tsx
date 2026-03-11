"use client"

import { useEffect, useState } from "react"

export default function HorseChat({ horseId }: { horseId: string }) {

  const [messages, setMessages] = useState<any[]>([])
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(false)

  async function loadMessages() {

    const res = await fetch(`/api/horses/${horseId}/messages`)
    const data = await res.json()

    setMessages(data)
  }

  useEffect(() => {
    loadMessages()
  }, [])

  async function sendMessage() {

    if (!text.trim()) return

    setLoading(true)

    await fetch(`/api/horses/${horseId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        body: text
      })
    })

    setText("")
    setLoading(false)

    loadMessages()
  }

  return (

    <div className="mt-12 border rounded-xl p-6 bg-white">

      <h3 className="font-semibold mb-4">
        Contact Seller
      </h3>

      <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">

        {messages.map((m) => (
          <div key={m.id} className="text-sm bg-stone-100 p-3 rounded">
            {m.body}
          </div>
        ))}

      </div>

      <div className="flex gap-2">

        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 border rounded px-3 py-2"
          placeholder="Write a message..."
        />

        <button
          onClick={sendMessage}
          disabled={loading}
          className="bg-black text-white px-4 rounded"
        >
          Send
        </button>

      </div>

    </div>
  )
}