"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"

type DailyGoal = {
  id: string
  content: string
  scheduledFor: string
  status: string
  completedAt: string | null
  completedOn: string | null
  createdAt: string
  updatedAt: string
}

type GoalsResponse = {
  goals?: DailyGoal[]
  error?: string
}

export function CompassDailyGoals() {
  const [goals, setGoals] = useState<DailyGoal[]>([])
  const [newGoal, setNewGoal] = useState("")
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState("")
  const day = useMemo(() => localDateKey(), [])

  const activeGoals = useMemo(
    () => goals.filter((goal) => goal.status === "active"),
    [goals],
  )
  const completedGoals = useMemo(
    () => goals.filter((goal) => goal.status === "completed"),
    [goals],
  )

  useEffect(() => {
    void loadGoals()
  }, [day])

  async function loadGoals() {
    setLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/compass/daily-goals?date=${day}`, {
        cache: "no-store",
      })
      const data = (await response.json().catch(() => null)) as GoalsResponse | null

      if (!response.ok) {
        setError(data?.error ?? "Today's goals could not be loaded.")
        return
      }

      setGoals(data?.goals ?? [])
    } catch {
      setError("Today's goals could not be loaded.")
    } finally {
      setLoading(false)
    }
  }

  async function addGoal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const content = newGoal.trim()
    if (!content || adding) return

    setAdding(true)
    setError("")

    try {
      const nextGoals = await sendAction({ action: "add", content, date: day })
      if (nextGoals) {
        setGoals(nextGoals)
        setNewGoal("")
      }
    } finally {
      setAdding(false)
    }
  }

  async function updateGoal(
    goal: DailyGoal,
    action: "complete" | "restore" | "archive" | "edit",
    content?: string,
  ) {
    if (busyId) return
    setBusyId(goal.id)
    setError("")

    try {
      const nextGoals = await sendAction({
        action,
        id: goal.id,
        date: day,
        ...(content ? { content } : {}),
      })
      if (nextGoals) setGoals(nextGoals)
    } finally {
      setBusyId(null)
    }
  }

  async function editGoal(goal: DailyGoal) {
    const content = window.prompt("Edit this goal", goal.content)?.trim()
    if (!content || content === goal.content) return
    await updateGoal(goal, "edit", content)
  }

  async function sendAction(body: Record<string, unknown>) {
    try {
      const response = await fetch("/api/compass/daily-goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = (await response.json().catch(() => null)) as GoalsResponse | null

      if (!response.ok) {
        setError(data?.error ?? "That goal could not be updated.")
        return null
      }

      return data?.goals ?? []
    } catch {
      setError("That goal could not be updated.")
      return null
    }
  }

  return (
    <section className="mt-8 rounded-[1.75rem] border border-[#4a402d] bg-[#0e0d0b] p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[#d8b15f]">Today</p>
          <h2 className="mt-2 text-2xl font-light text-zinc-100">Your goals</h2>
        </div>
        {!loading ? (
          <span className="rounded-full border border-zinc-800 px-3 py-1 text-xs text-zinc-500">
            {completedGoals.length} completed
          </span>
        ) : null}
      </div>

      <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">
        Add what you choose to complete today. Compass does not add, rewrite, or
        prioritise these for you.
      </p>

      <form onSubmit={addGoal} className="mt-5 flex gap-2">
        <input
          value={newGoal}
          onChange={(event) => setNewGoal(event.target.value)}
          placeholder="Add a goal for today"
          maxLength={500}
          className="min-w-0 flex-1 rounded-xl border border-zinc-800 bg-[#111111] px-4 py-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-700 focus:border-[#8b7445]"
        />
        <button
          type="submit"
          disabled={!newGoal.trim() || adding}
          className="rounded-xl border border-[#6a5732] bg-[#21190f] px-4 py-3 text-sm text-[#e7c98b] transition hover:border-[#9a7d47] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {adding ? "Adding..." : "Add"}
        </button>
      </form>

      {error ? <p className="mt-4 text-sm text-amber-200/80">{error}</p> : null}

      {loading ? (
        <p className="mt-6 text-sm text-zinc-600">Loading today...</p>
      ) : (
        <div className="mt-6 space-y-3">
          {activeGoals.length === 0 ? (
            <div className="rounded-xl border border-zinc-800/80 px-4 py-4 text-sm leading-6 text-zinc-600">
              Nothing is waiting to be ticked off today.
            </div>
          ) : null}

          {activeGoals.map((goal) => (
            <div
              key={goal.id}
              className="flex gap-3 rounded-xl border border-zinc-800 bg-[#111111] p-4"
            >
              <button
                type="button"
                aria-label={`Complete ${goal.content}`}
                onClick={() => void updateGoal(goal, "complete")}
                disabled={busyId !== null}
                className="mt-0.5 h-5 w-5 shrink-0 rounded border border-zinc-600 transition hover:border-[#d8b15f] disabled:opacity-40"
              />

              <div className="min-w-0 flex-1">
                <p className="text-sm leading-6 text-zinc-200">{goal.content}</p>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-zinc-600">
                  {goal.scheduledFor < day ? <span>Carried forward</span> : <span>Today</span>}
                  <button
                    type="button"
                    onClick={() => void editGoal(goal)}
                    disabled={busyId !== null}
                    className="transition hover:text-zinc-300 disabled:opacity-40"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void updateGoal(goal, "archive")}
                    disabled={busyId !== null}
                    className="transition hover:text-zinc-300 disabled:opacity-40"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}

          {completedGoals.length > 0 ? (
            <div className="pt-3">
              <p className="mb-3 text-xs uppercase tracking-[0.16em] text-zinc-700">
                Completed today
              </p>
              <div className="space-y-2">
                {completedGoals.map((goal) => (
                  <div
                    key={goal.id}
                    className="flex items-center gap-3 rounded-xl border border-zinc-900 px-4 py-3"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-[#6a5732] text-xs text-[#d8b15f]">
                      ✓
                    </span>
                    <p className="min-w-0 flex-1 text-sm text-zinc-600 line-through decoration-zinc-800">
                      {goal.content}
                    </p>
                    <button
                      type="button"
                      onClick={() => void updateGoal(goal, "restore")}
                      disabled={busyId !== null}
                      className="text-xs text-[#9f8652] transition hover:text-[#d8b15f] disabled:opacity-40"
                    >
                      Undo
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </section>
  )
}

function localDateKey() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}
