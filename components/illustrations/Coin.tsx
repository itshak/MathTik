export function Coin({ size = 28 }: { size?: number }) {
  const s = size
  const stroke = Math.max(1, Math.round(s * 0.04))
  const r = Math.round(s / 2)
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="gold" cx="50%" cy="40%" r="70%">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="60%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f59e0b" />
        </radialGradient>
      </defs>
      <circle cx={r} cy={r} r={r - stroke} fill="url(#gold)" stroke="#b45309" strokeWidth={stroke} />
      <circle cx={r} cy={r} r={Math.round(r * 0.55)} fill="none" stroke="#d97706" strokeWidth={stroke} />
    </svg>
  )
}

export function CoinStack({ count = 1, size = 40 }: { count?: 1|2|3|4|5; size?: number }) {
  const coinSize = Math.round(size * 0.8)
  const overlap = Math.round(size * 0.2)
  const items = Array.from({ length: Math.min(5, Math.max(1, count)) })
  const totalH = coinSize + overlap * (items.length - 1)
  return (
    <div style={{ width: size, height: '100%', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
        <div style={{ position: 'relative', width: coinSize, height: totalH }}>
          {items.map((_, i) => (
            <div key={i} style={{ position: 'absolute', left: 0, right: 0, bottom: i * overlap, display: 'grid', placeItems: 'center' }}>
              <Coin size={coinSize} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
