export function Box({ size=28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="16" width="48" height="36" rx="6" fill="#fed7aa" stroke="#fb923c" strokeWidth="3"/>
      <path d="M8 26h48" stroke="#fb923c" strokeWidth="3"/>
    </svg>
  )
}
