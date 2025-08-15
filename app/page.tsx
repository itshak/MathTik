import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="container pt-8">
      <section className="card p-6 text-center">
        <div className="text-5xl">🧮</div>
        <h1 className="text-2xl font-extrabold mt-2">MathTik</h1>
        <p className="text-gray-500 mt-1">Multiply & Divide with fun mini‑games</p>
        <div className="mt-4">
          <Link href="/play" className="btn btn-primary">Start Playing</Link>
        </div>
      </section>
    </main>
  )
}
