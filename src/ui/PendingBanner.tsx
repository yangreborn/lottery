interface Props { count: number; onClick: () => void }

export function PendingBanner({ count, onClick }: Props) {
  if (count <= 0) return null
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 bg-orange-50 border border-orange-200 text-orange-800 rounded-xl px-3.5 py-3 mb-4 text-sm font-semibold text-left"
    >
      <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0" />
      有 {count} 条公告未应用为规则 ›
    </button>
  )
}
