"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function BottomNav() {
  const pathname = usePathname()
  const tabs: { href: '/play' | '/rewards' | '/profile'; label: string; icon: string }[] = [
    { href: '/play', label: 'Play', icon: '🎮' },
    { href: '/rewards', label: 'Rewards', icon: '🎁' },
    { href: '/profile', label: 'Profile', icon: '👤' },
  ]
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur shadow-soft border-t border-gray-200 bottom-safe">
      <div className="container">
        <ul className="grid grid-cols-3 py-2 text-sm">
          {tabs.map(t => (
            <li key={t.href} className="text-center">
              <Link href={t.href} className={`inline-flex flex-col items-center gap-0.5 p-2 rounded-xl ${pathname.startsWith(t.href) ? 'text-brand' : 'text-gray-500'}`}>
                <span className="text-xl">{t.icon}</span>
                <span className="text-[11px] font-bold">{t.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
