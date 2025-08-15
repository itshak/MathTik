export function Apple({ size=28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ff8a8a" />
          <stop offset="100%" stopColor="#ff3b3b" />
        </linearGradient>
      </defs>
      <path d="M44 22c4 1 8 5 8 12 0 10-8 18-20 18S12 44 12 34c0-7 4-11 8-12 3-1 6 0 8 1 2 1 4 1 6 0 2-1 5-2 8-1z" fill="url(#g)"/>
      <path d="M34 18c-2-6 4-9 8-8-2 5-5 7-8 8z" fill="#6b7280"/>
      <path d="M34 14c0-2 2-4 4-4" stroke="#15803d" strokeWidth="4" strokeLinecap="round"/>
    </svg>
  )
}
