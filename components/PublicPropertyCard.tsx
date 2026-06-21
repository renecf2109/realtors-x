import Image from "next/image";
import Link from "next/link";
import type { Property } from "@/lib/types";
import { formatListingPrice } from "@/lib/listingPrice";

export function PublicPropertyCard({ property }: { property: Property }) {
  return <article className="card group overflow-hidden">
    <Link href={`/listings/${property.id}`} className="block">
      <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-lime to-white">
        {property.images?.[0] ? <Image src={property.images[0]} alt={`${property.title} property image`} fill unoptimized className="object-cover transition duration-500 group-hover:scale-105"/> : <div className="flex h-full items-center justify-center text-sm font-semibold text-sage">Realtors X Property</div>}
        {property.investment_opportunity && <span className="absolute left-4 top-4 rounded-full bg-sage px-3 py-1 text-xs font-bold text-white">Investment{property.expected_roi ? ` · ${property.expected_roi}% ROI` : ""}</span>}
      </div>
      <div className="p-5"><div className="flex justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-sage">{property.type}{property.project_name ? ` · ${property.project_name}` : ""}</p><h2 className="mt-2 text-xl font-black">{property.title}</h2><p className="mt-1 text-sm text-ink/50">{property.location}</p></div><p className="font-black">{formatListingPrice(property)}</p></div>
      <p className="mt-4 text-sm text-ink/55">{property.bedrooms} bd · {property.bathrooms} ba · {Number(property.size).toLocaleString()} sq ft</p></div>
    </Link>
  </article>;
}
