export function formatYuan(n: number): string {
  const fixed = Number.isInteger(n)
    ? n.toString()
    : n.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')
  const [int, dec] = fixed.split('.')
  const withSep = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return '¥' + (dec ? `${withSep}.${dec}` : withSep)
}
