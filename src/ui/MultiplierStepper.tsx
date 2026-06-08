import { useEffect, useState } from 'react'

interface Props { value: number; onChange: (n: number) => void; min?: number }

export function MultiplierStepper({ value, onChange, min = 1 }: Props) {
  const clamp = (n: number) => Math.max(min, Math.min(99, Math.floor(n)))
  // 用本地文本态承载输入,允许临时清空,避免"删不掉最前面的1"
  const [text, setText] = useState(String(value))
  useEffect(() => { setText(String(value)) }, [value])

  function handleInput(raw: string) {
    const cleaned = raw.replace(/[^0-9]/g, '').replace(/^0+(?=\d)/, '')
    setText(cleaned)
    if (cleaned !== '') onChange(clamp(Number(cleaned)))
  }

  function handleBlur() {
    if (text === '') { onChange(min); setText(String(min)) }
  }

  const btn = 'w-12 h-12 rounded-xl bg-indigo-50 text-indigo-500 text-2xl font-extrabold active:scale-95'
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-400">倍数</span>
      <div className="flex items-center gap-4">
        <button className={btn} aria-label="减少倍数" onClick={() => onChange(clamp(value - 1))}>−</button>
        <input
          className="w-16 text-center text-3xl font-extrabold outline-none"
          inputMode="numeric"
          value={text}
          aria-label="倍数输入"
          onChange={e => handleInput(e.target.value)}
          onBlur={handleBlur}
        />
        <button className={btn} aria-label="增加倍数" onClick={() => onChange(clamp(value + 1))}>+</button>
      </div>
    </div>
  )
}
