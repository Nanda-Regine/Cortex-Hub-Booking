import Link from 'next/link'

export default function FacilityCard({ id, name }: { id: string, name: string }) {
  return (
    <div className="card">
      <h3 className="text-lg font-semibold">{name}</h3>
      <p className="text-sm text-slate-600 mb-3">
        Choose date & hour. Already-booked slots are blocked.
      </p>

      {/* Web booking button */}
      <Link
        href={{ pathname: '/dashboard', query: { facility: id } }}
        className="btn"
      >
        Book Now
      </Link>

      {/* WhatsApp booking button */}
      <a
        href={`https://wa.me/27600000000?text=Hi%20CortexHub,%20I%20want%20to%20book%20${encodeURIComponent(
          name
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        className="btn mt-2 bg-green-600 hover:bg-green-700"
      >
        Book on WhatsApp
      </a>
    </div>
  )
}
