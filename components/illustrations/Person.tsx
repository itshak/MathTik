export function Person({ size=28, skin='#f9c9b6', shirt='#93c5fd' }: { size?: number; skin?: string; shirt?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="22" r="12" fill={skin} />
      <rect x="16" y="36" width="32" height="20" rx="10" fill={shirt} />
      <circle cx="26" cy="24" r="2" fill="#111827"/>
      <circle cx="38" cy="24" r="2" fill="#111827"/>
      <path d="M24 30c4 3 12 3 16 0" stroke="#111827" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}
