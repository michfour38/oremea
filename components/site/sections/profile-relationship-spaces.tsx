"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

function modeLabel(mode?: string) {
  if (mode === "couple") return "Couple"
  if (mode === "family_adults") return "Family Adults"
  if (mode === "team") return "Team"
  if (mode === "parallel_parenting_adults") {
    return "Parallel Parenting Adults"
  }

  return "Harmonize"
}

export function ProfileRelationshipSpaces() {
  const [systems, setSystems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editedName, setEditedName] = useState("")
  const [savingId, setSavingId] = useState<string | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    async function loadSpaces() {
      try {
        const response = await fetch("/api/harmonize/systems")
        const data = await response.json()

        if (response.ok && data.success) {
          setSystems(data.systems || [])
        }
      } finally {
        setLoading(false)
      }
    }

    loadSpaces()
  }, [])

async function saveName(systemId: string) {
  setSavingId(systemId)
  setError("")

  try {
    const response = await fetch("/api/harmonize/system/name", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemId,
        name: editedName,
      }),
    })

    const data = await response.json()

    if (!response.ok || !data.success) {
      throw new Error(data.error || "Unable to rename relationship space.")
    }

    setSystems((current) =>
      current.map((system) =>
        system.id === systemId
          ? {
              ...system,
              name: data.system.name,
            }
          : system,
      ),
    )

    setEditingId(null)
    setEditedName("")
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Unable to rename relationship space.",
    )
  } finally {
    setSavingId(null)
  }
}

  return (
    <section className="mx-auto max-w-5xl px-6 py-10">
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <h2 className="text-lg font-medium text-[#f4f1ea]">
          Relationship Spaces
        </h2>

        <p className="mt-3 text-sm leading-6 text-[#bfb8aa]">
          View and manage the relationship spaces you own.
        </p>

{error ? (
  <p className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
    {error}
  </p>
) : null}

        {loading ? (
          <p className="mt-6 text-sm text-[#bfb8aa]">
            Loading relationship spaces...
          </p>
        ) : null}

        {!loading &&
          systems.map((system) => (
            <div
              key={system.id}
              className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  {editingId === system.id ? (
  <input
    value={editedName}
    onChange={(event) => setEditedName(event.target.value)}
    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-[#f4f1ea]"
  />
) : (
  <h3 className="text-base font-medium text-[#f4f1ea]">
    {system.name || modeLabel(system.mode)}
  </h3>
)}

                  <p className="mt-1 text-sm text-[#8f8778]">
                    {modeLabel(system.mode)}
                  </p>
                </div>

                <div className="flex gap-4">
  {editingId === system.id ? (
    <>
      <button
        type="button"
        onClick={() => saveName(system.id)}
        disabled={savingId === system.id}
        className="text-sm text-[#c6a96b] disabled:opacity-50"
      >
        {savingId === system.id ? "Saving..." : "Save"}
      </button>

      <button
        type="button"
        onClick={() => {
          setEditingId(null)
          setEditedName("")
          setError("")
        }}
        className="text-sm text-[#8f8778]"
      >
        Cancel
      </button>
    </>
  ) : (
    <>
      <button
        type="button"
        onClick={() => {
          setEditingId(system.id)
          setEditedName(system.name || "")
          setError("")
        }}
        className="text-sm text-[#c6a96b]"
      >
        Edit
      </button>

      <Link
        href={`/harmonize/system/${system.id}`}
        className="text-sm text-[#c6a96b]"
      >
        Open →
      </Link>
    </>
  )}
</div>
              </div>
            </div>
          ))}
      </div>
    </section>
  )
}