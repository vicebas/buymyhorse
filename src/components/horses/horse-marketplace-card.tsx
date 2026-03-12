import Image from "next/image"
import Link from "next/link"

type Horse = {
  id: string
  name: string
  breed?: string | null
  age?: number | null
  height?: string | null
  gender?: string | null
  discipline?: string | null
  level?: string | null
  price?: number | null
  image?: string | null
  location?: string | null
  saleStatus?: string | null
  sellerProfile: {
    displayName: string
  }
}

export default function HorseMarketplaceCard({ horse }: { horse: Horse }) {

  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">

      {/* Seller Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">

        <div>
          <p className="font-semibold text-sm">
            {horse.sellerProfile.displayName}
          </p>

          <p className="text-xs text-stone-500">
            Horse listing
          </p>
        </div>

      </div>


      {/* Horse Section */}
      <Link href={`/horses/${horse.id}`}>
        <div className="flex gap-4 p-4 hover:bg-stone-50 transition">

          {/* Image */}
          <div className="w-40 h-32 relative flex-shrink-0">

            <Image
              src={horse.image || "/img/default-horse.png"}
              alt={horse.name}
              fill
              className="object-cover rounded-md"
            />

            {horse.saleStatus && (
              <span className="absolute top-2 left-2 text-xs bg-white px-2 py-1 rounded shadow">
                {horse.saleStatus.replace("_", " ")}
              </span>
            )}

          </div>


          {/* Info */}
          <div className="flex-1">

            <div className="flex justify-between">

              <h3 className="font-semibold text-lg">
                {horse.name}
              </h3>

              <p className="text-amber-600 font-semibold">
                {horse.price
                  ? `$${Number(horse.price).toLocaleString()}`
                  : "Price on Request"}
              </p>

            </div>

            <p className="text-sm text-stone-500 mt-1">
              {horse.discipline} {horse.level && `• ${horse.level}`}
            </p>

            <p className="text-sm text-stone-500 mt-2">
              {horse.age && `${horse.age} yrs`}
              {horse.height && ` • ${horse.height} hh`}
              {horse.gender && ` • ${horse.gender}`}
            </p>

            {horse.location && (
              <p className="text-xs text-stone-400 mt-1">
                {horse.location}
              </p>
            )}

          </div>

        </div>
      </Link>

      {/* Actions */}
      <div className="px-4 pb-4">

        <Link
          href={`/horses/${horse.id}`}
          className="block w-full border rounded-md text-center py-2 text-sm hover:bg-stone-100"
        >
          Message
        </Link>

      </div>

    </div>
  )
}