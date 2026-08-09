"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type RecognitionRecord = {
  active: boolean;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
};

type ResonanceCourseRecord = {
  weekNumber: number;
  runNumber: number;
  courseTitle: string;
  completedAt: string | null;
};

type ResonanceRecord = {
  active: boolean;
  status: string;
  completedCount: number;
  completedRunCount: number;
  completedCourseNumbers: number[];
  totalCourses: number;
  activeRun: {
    weekNumber: number;
    courseTitle: string;
    dayNumber: number | null;
    startedAt: string;
  } | null;
  completedCourses: ResonanceCourseRecord[];
};

type CompassRecord = {
  active: boolean;
  status: string;
  phase: string;
  updatedAt: string;
};

type ProfileProductsPayload = {
  recognition: RecognitionRecord | null;
  resonance: ResonanceRecord | null;
  compass: CompassRecord | null;
};

function formatStatus(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/^./, (letter) => letter.toUpperCase());
}

function formatDate(value: string | null) {
  if (!value) return "on file";

  return new Intl.DateTimeFormat("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function ProfileProducts() {
  const [products, setProducts] = useState<ProfileProductsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadProducts() {
      try {
        const response = await fetch("/api/profile/products", {
          signal: controller.signal,
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.error || "Your participation record could not be loaded.",
          );
        }

        setProducts(data.products);
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === "AbortError")
          return;

        setError(
          caught instanceof Error
            ? caught.message
            : "Your participation record could not be loaded.",
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadProducts();
    return () => controller.abort();
  }, []);

  const openedSpaces = products
    ? [products.recognition, products.resonance, products.compass].filter(
        Boolean,
      ).length
    : 0;
  const activeSpaces = products
    ? [products.recognition, products.resonance, products.compass].filter(
        (product) => product?.active,
      ).length
    : 0;
  const completedResonanceCourses = products?.resonance?.completedCount || 0;
  const hasProducts = openedSpaces > 0;

  return (
    <section className="border-b border-white/5 bg-zinc-950/60">
      <div className="mx-auto max-w-6xl px-5 py-8 md:py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-[#b79a63]">
              Participation record
            </p>
            <h2 className="mt-3 text-3xl font-light text-white md:text-4xl">
              Your Oremea spaces
            </h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-zinc-400 sm:text-right">
            Live progress drawn from the work saved to your account.
          </p>
        </div>

        {loading ? <ProfileLoadingState /> : null}

        {!loading && error ? (
          <div className="mt-6 rounded-2xl border border-[#b79a63]/20 bg-[#b79a63]/[0.05] p-5">
            <p className="text-sm text-zinc-100">{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 text-sm text-zinc-200 underline decoration-white/30 underline-offset-4 transition hover:decoration-white"
            >
              Try again
            </button>
          </div>
        ) : null}

        {!loading && !error ? (
          <>
            <div className="mt-6 grid overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-3">
              <ParticipationMetric
                label="Spaces opened"
                value={String(openedSpaces).padStart(2, "0")}
              />
              <ParticipationMetric
                label="Resonance courses completed"
                value={String(completedResonanceCourses).padStart(2, "0")}
                accent
              />
              <ParticipationMetric
                label="Active now"
                value={String(activeSpaces).padStart(2, "0")}
              />
            </div>

            {products?.resonance ? (
              <ResonanceRecordCard resonance={products.resonance} />
            ) : null}

            {hasProducts ? (
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                {products?.recognition ? (
                  <ProductCard
                    eyebrow="Recognition"
                    title={formatStatus(products.recognition.status)}
                    description="Your entry reflection and its completed record are connected to this account."
                    href="/recognition"
                    action="Open Recognition"
                    completed={products.recognition.status === "completed"}
                  />
                ) : null}

                {products?.compass ? (
                  <ProductCard
                    eyebrow="Compass"
                    title={formatStatus(
                      products.compass.phase || products.compass.status,
                    )}
                    description="Your direction-setting session is saved and ready to continue or review."
                    href="/compass"
                    action="Open Compass"
                    completed={products.compass.status === "completed"}
                  />
                ) : null}
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.025] p-5 md:p-6">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                  Your first space is ready when you are
                </p>
                <p className="mt-4 max-w-2xl text-lg leading-8 text-zinc-300">
                  Begin with the product that matches the movement you are here
                  to make. Your record will build here as you participate.
                </p>
                <Link
                  href="/explore"
                  className="mt-5 inline-flex rounded-full border border-[#b79a63]/30 bg-[#b79a63]/[0.05] px-4 py-2.5 text-sm tracking-[0.08em] text-[#b79a63] transition hover:border-[#b79a63]/65 hover:bg-[#b79a63]/10"
                >
                  Explore Oremea →
                </Link>
              </div>
            )}
          </>
        ) : null}
      </div>
    </section>
  );
}

function ProfileLoadingState() {
  return (
    <div className="mt-6 space-y-4" aria-label="Loading participation record">
      <div className="grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-28 animate-pulse bg-zinc-950/80" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]" />
    </div>
  );
}

function ParticipationMetric({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-zinc-950/90 p-5 md:p-6">
      <p
        className={`text-4xl font-light tabular-nums md:text-5xl ${
          accent ? "text-[#b79a63]" : "text-zinc-100"
        }`}
      >
        {value}
      </p>
      <p className="mt-3 text-[11px] uppercase leading-5 tracking-[0.18em] text-zinc-500">
        {label}
      </p>
    </div>
  );
}

function ResonanceRecordCard({ resonance }: { resonance: ResonanceRecord }) {
  const completedCourses = new Set(resonance.completedCourseNumbers);
  const completionLabel = `${resonance.completedCount} ${
    resonance.completedCount === 1 ? "course" : "courses"
  } completed`;
  const primaryHref = resonance.activeRun ? "/resonance" : "/entry";
  const primaryAction = resonance.activeRun
    ? "Continue current course"
    : resonance.completedCount > 0
      ? "Choose the next course"
      : "Begin Resonance";

  return (
    <article className="relative mt-4 overflow-hidden rounded-2xl border border-[#b79a63]/20 bg-zinc-950/80 shadow-xl shadow-black/20">
      <div className="relative grid gap-0 lg:grid-cols-[minmax(0,1.25fr)_minmax(19rem,0.75fr)]">
        <div className="p-6 md:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11px] uppercase tracking-[0.24em] text-[#b79a63]">
              Resonance
            </p>
            <span className="rounded-full border border-[#b79a63]/25 bg-black/25 px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] text-[#b79a63]">
              {resonance.activeRun
                ? "In progress"
                : resonance.completedCount > 0
                  ? "Record saved"
                  : "Ready"}
            </span>
          </div>

          <h3 className="mt-4 text-3xl font-light text-zinc-100 md:text-4xl">
            {completionLabel}
          </h3>
          <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-300">
            {resonance.activeRun
              ? `${resonance.activeRun.courseTitle} is open${
                  resonance.activeRun.dayNumber
                    ? ` at day ${resonance.activeRun.dayNumber}`
                    : ""
                }.`
              : resonance.completedCount > 0
                ? resonance.completedCount === 1
                  ? "Your completed course is held here as part of your continuing Resonance record."
                  : "Your completed courses are held here as part of your continuing Resonance record."
                : "Your Resonance access is ready. The first completed course will appear here."}
          </p>

          <div className="mt-6">
            <div className="flex items-center justify-between gap-4 text-[10px] uppercase tracking-[0.18em] text-zinc-500">
              <span>Course progression</span>
              <span>
                {resonance.completedCount} / {resonance.totalCourses}
              </span>
            </div>
            <div
              className="mt-3 grid gap-1.5"
              style={{
                gridTemplateColumns: `repeat(${resonance.totalCourses}, minmax(0, 1fr))`,
              }}
              aria-label={`${resonance.completedCount} of ${resonance.totalCourses} Resonance courses completed`}
            >
              {Array.from({ length: resonance.totalCourses }, (_, index) => {
                const courseNumber = index + 1;
                const isCompleted = completedCourses.has(courseNumber);
                const isActive =
                  resonance.activeRun?.weekNumber === courseNumber;

                return (
                  <span
                    key={courseNumber}
                    title={`Course ${courseNumber}: ${
                      isCompleted
                        ? "completed"
                        : isActive
                          ? "in progress"
                          : "not yet completed"
                    }`}
                    className={`h-2 rounded-full ${
                      isCompleted
                        ? "bg-[#b79a63]"
                        : isActive
                          ? "bg-[#b79a63]/45 ring-1 ring-[#b79a63]/60"
                          : "bg-white/10"
                    }`}
                  />
                );
              })}
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href={primaryHref}
              className="inline-flex items-center justify-center rounded-full bg-[#b79a63] px-5 py-2.5 text-sm font-medium text-zinc-950 transition hover:brightness-110"
            >
              {primaryAction} →
            </Link>
            <Link
              href="/resonance/archive"
              className="inline-flex items-center justify-center rounded-full border border-white/15 bg-black/20 px-5 py-3 text-sm text-zinc-200 transition hover:border-white/35 hover:text-white"
            >
              View Resonance archive
            </Link>
          </div>
        </div>

        <div className="border-t border-white/10 bg-black/25 p-6 lg:border-l lg:border-t-0 md:p-7">
          <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
            Completed courses
          </p>

          {resonance.completedCourses.length > 0 ? (
            <ol className="mt-5 space-y-3">
              {resonance.completedCourses.map((course) => (
                <li
                  key={`${course.weekNumber}-${course.runNumber}`}
                  className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"
                >
                  <div className="flex items-start gap-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#b79a63]/25 bg-[#b79a63]/[0.06] text-sm text-[#b79a63]">
                      {course.weekNumber}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm text-zinc-100">
                        {course.courseTitle}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        Completed {formatDate(course.completedAt)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-5 text-sm leading-6 text-zinc-400">
              Completed Resonance courses will collect here in order.
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

function ProductCard({
  eyebrow,
  title,
  description,
  href,
  action,
  completed,
}: {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  action: string;
  completed: boolean;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-white/10 bg-white/[0.025] p-6 transition hover:-translate-y-0.5 hover:border-[#b79a63]/25 hover:bg-white/[0.045]"
    >
      <div className="flex items-center justify-between gap-4">
        <p className="text-[11px] uppercase tracking-[0.22em] text-[#b79a63]">
          {eyebrow}
        </p>
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            completed ? "bg-[#b79a63]" : "bg-zinc-600"
          }`}
          aria-hidden="true"
        />
      </div>
      <h3 className="mt-5 text-3xl font-light text-white">{title}</h3>
      <p className="mt-4 text-sm leading-7 text-zinc-400">{description}</p>
      <p className="mt-5 text-sm text-zinc-200 transition group-hover:text-[#b79a63]">
        {action} →
      </p>
    </Link>
  );
}
