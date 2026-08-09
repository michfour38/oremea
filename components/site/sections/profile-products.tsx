"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

export function ProfileProducts() {
  const [products, setProducts] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadProducts() {
      try {
        const response = await fetch("/api/profile/products")
        const data = await response.json()

        if (response.ok && data.success) {
          setProducts(data.products)
        }
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [])

  const hasProducts =
    products?.recognition ||
    products?.resonance ||
    products?.compass

  return (
    <section className="border-b border-white/5 bg-zinc-950/60">
      <div className="mx-auto max-w-6xl px-5 py-10 md:py-12">
        <p className="mb-5 text-xs uppercase tracking-[0.28em] text-amber-200/70">
          Your Oremea Spaces
        </p>

        {loading ? (
          <p className="text-sm text-zinc-500">Checking your active spaces...</p>
        ) : null}

        {!loading && !hasProducts ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
            <p className="text-sm uppercase tracking-[0.18em] text-zinc-500">
              No active spaces yet
            </p>

            <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-400">
              When you begin Recognition, Resonance, or Compass, your active spaces
              will appear here.
            </p>

            <Link
              href="/explore"
              className="mt-5 inline-flex rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:border-white/20 hover:text-white"
            >
              Explore Oremea
            </Link>
          </div>
        ) : null}

        {hasProducts ? (
          <div className="grid gap-4 md:grid-cols-2">
            {products?.recognition ? (
              <ProductCard
                title="Recognition"
                status={products.recognition.status}
                description="Your entry reflection space is connected to this account."
                href="/recognition"
                action="View Recognition"
              />
            ) : null}

            {products?.resonance ? (
              <ProductCard
                title="Resonance"
                status={products.resonance.status}
                description="Your Resonance journey is active or recorded on this account."
                href="/resonance"
                action="Resume Journey"
              />
            ) : null}

            {products?.compass ? (
              <ProductCard
                title="Compass"
                status={products.compass.phase || products.compass.status}
                description="Your Compass session is saved and can be continued or reviewed."
                href="/compass"
                action="Continue Compass"
              />
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  )
}

function ProductCard({
  title,
  status,
  description,
  href,
  action,
}: {
  title: string
  status: string
  description: string
  href: string
  action: string
}) {
  return (
    <Link
      href={href}
      className="block rounded-3xl border border-amber-200/20 bg-amber-100/[0.04] p-6 transition hover:border-amber-200/40 hover:bg-amber-100/[0.07]"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-amber-100/70">
            {title}
          </p>

          <h3 className="mt-2 text-xl font-light text-zinc-100">
            {status?.replaceAll("_", " ")}
          </h3>
        </div>

        <div className="rounded-full border border-amber-200/20 bg-amber-100/[0.06] px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-amber-100">
          Active
        </div>
      </div>

      <p className="mt-4 text-base leading-7 text-zinc-400">{description}</p>

      <p className="mt-5 text-sm text-zinc-300 transition">
        {action} →
      </p>
    </Link>
  )
}
