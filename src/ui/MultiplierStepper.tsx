interface Props { value: number; onChange: (n: number) => void }

const clamp = (n: number) => Math.max(1, Math.min(99, Math.round(n) || 1))

export function MultiplierStepper({ value, onChange }: Props) {
  const btn = 'w-12 h-12 rounded-xl bg-indigo-50 text-indigo-500 text-2xl font-extrabold active:scale-95'
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-400">倍数</span>
      <div className="flex items-center gap-4">
        <button className={btn} aria-label="减少倍数" onClick={() => onChange(clamp(value - 1))}>−</button>
        <input
          className="w-16 text-center text-3xl font-extrabold outline-none"
          inputMode="numeric"
          value={value}
          aria-label="倍数输入"
          onChange={e => onChange(clamp(Number(e.target.value)))}
        />
        <button className={btn} aria-label="增加倍数" onClick={() => onChange(clamp(value + 1))}>+</button>
      </div>
    </div>
  )
}
