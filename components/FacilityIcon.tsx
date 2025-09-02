export default function FacilityIcon({ name }: { name: string }) {
  // Minimal icon set that reads well on both light/dark cards
  return (
    <div className="w-10 h-10 rounded-xl grid place-items-center bg-skysoft text-navy">
      {/* You can swap for lucide-react if you prefer */}
      <span className="text-xl">🔧</span>
    </div>
  );
}
