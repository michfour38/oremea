"use client";

import { useMemo, useState } from "react";

import type { PartnerExperience } from "@/src/lib/oremea/partner-experiences";
import { safePartnerBackgroundAsset } from "@/src/lib/oremea/partner-theme";
import { getResonanceSceneBackgrounds } from "@/src/lib/resonance/resonance-backgrounds";

type Brand = PartnerExperience["brand"];
type Scene = "entry" | "archive" | number;
type Mode = Brand["resonanceScenes"]["mode"];
type Screen = "desktop" | "mobile";
type AssetDraft = { desktop: string; mobile: string };

const roomLabels = [
  "Hearth", "Mirror", "Garden", "Compass", "Pulse", "Shadow",
  "Forge", "Vision", "The Gathering", "The Becoming",
] as const;

const scenes: readonly { key: string; scene: Scene; label: string }[] = [
  { key: "entry", scene: "entry", label: "Entry" },
  ...roomLabels.map((label, index) => ({
    key: String(index + 1),
    scene: index + 1,
    label,
  })),
  { key: "archive", scene: "archive", label: "Archive" },
];

function existingScene(brand: Brand, scene: Scene): AssetDraft {
  const selected = scene === "entry" ? brand.resonanceScenes.entry
    : scene === "archive" ? brand.resonanceScenes.archive
      : brand.resonanceScenes.rooms[scene] ?? null;
  return {
    desktop: selected?.desktop ?? "",
    mobile: selected?.mobile ?? "",
  };
}

export function PartnerAppearancePreview({
  partnerName,
  initialBrand,
}: {
  partnerName: string;
  initialBrand: Brand;
}) {
  const [selected, setSelected] = useState("1");
  const [mode, setMode] = useState<Mode>(initialBrand.resonanceScenes.mode);
  const [screen, setScreen] = useState<Screen>("desktop");
  const [drafts, setDrafts] = useState<Record<string, AssetDraft>>({});

  const scene = scenes.find(item => item.key === selected)?.scene ?? 1;
  const label = scenes.find(item => item.key === selected)?.label ?? "Hearth";
  const draft = drafts[selected] ?? existingScene(initialBrand, scene);

  function updateAsset(kind: Screen, value: string) {
    setDrafts(previous => ({
      ...previous,
      [selected]: { ...draft, [kind]: value },
    }));
  }

  const selectedBrand = useMemo<Brand>(() => ({
    ...initialBrand,
    resonanceScenes: {
      ...initialBrand.resonanceScenes,
      mode,
      entry: scene === "entry"
        ? { desktop: draft.desktop || null, mobile: draft.mobile || null }
        : initialBrand.resonanceScenes.entry,
      archive: scene === "archive"
        ? { desktop: draft.desktop || null, mobile: draft.mobile || null }
        : initialBrand.resonanceScenes.archive,
      rooms: typeof scene === "number"
        ? {
            ...initialBrand.resonanceScenes.rooms,
            [scene]: { desktop: draft.desktop || null, mobile: draft.mobile || null },
          }
        : initialBrand.resonanceScenes.rooms,
    },
  }), [initialBrand, mode, scene, draft.desktop, draft.mobile]);

  const backgrounds = getResonanceSceneBackgrounds(scene, selectedBrand);
  const chosen = screen === "desktop" ? backgrounds.desktop : backgrounds.mobile;
  const unapprovedAsset = mode === "custom" &&
    ((draft.desktop.trim() !== "" && !safePartnerBackgroundAsset(draft.desktop.trim())) ||
      (draft.mobile.trim() !== "" && !safePartnerBackgroundAsset(draft.mobile.trim())));

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
      <div className="space-y-6 rounded-2xl border border-white/15 bg-black/40 p-5">
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-300" htmlFor="partner-scene">
            Scene
          </label>
          <select
            id="partner-scene"
            className="w-full rounded-lg border border-white/25 bg-[#161616] p-3 text-white"
            value={selected}
            onChange={event => setSelected(event.target.value)}
          >
            {scenes.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}
          </select>
        </div>
        <fieldset className="space-y-2">
          <legend className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-300">
            Background choice
          </legend>
          {([
            ["original", "Keep OREMEA artwork"],
            ["custom", "Use optional partner artwork"],
            ["plain", "Plain background"],
          ] as const).map(([value, title]) => (
            <label key={value} className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/15 px-3 py-3 text-sm">
              <input
                type="radio"
                name="partner-preview-mode"
                value={value}
                checked={mode === value}
                onChange={() => setMode(value)}
                className="accent-amber-500"
              />
              <span>{title}</span>
            </label>
          ))}
        </fieldset>
        {mode === "custom" && (
          <div className="space-y-3">
            <p className="text-xs leading-6 text-zinc-400">
              Optional files already placed under /partner-assets/{partnerName.toLowerCase()}/.
              Leave a field empty to keep the OREMEA scene.
            </p>
            {(["desktop", "mobile"] as const).map(kind => (
              <label key={kind} className="block space-y-2 text-xs text-zinc-300">
                <span className="capitalize">{kind} image path</span>
                <input
                  type="text"
                  value={draft[kind]}
                  placeholder={`/partner-assets/${partnerName.toLowerCase()}/${kind}.webp`}
                  onChange={event => updateAsset(kind, event.target.value)}
                  className="w-full rounded-lg border border-white/25 bg-[#161616] p-3 text-sm text-white"
                  spellCheck={false}
                />
              </label>
            ))}
            {unapprovedAsset && (
              <p role="alert" className="text-xs text-amber-200">
                Unsupported asset path. Preview will fall back to the original scene.
              </p>
            )}
          </div>
        )}
        <p className="border-t border-white/15 pt-4 text-xs leading-6 text-zinc-400">
          Preview only — selections are not saved, published or uploaded.
          Customer records, subscriptions and product access are unchanged.
        </p>
      </div>

      <div className="space-y-4 rounded-2xl border border-white/15 bg-black/30 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-400">{partnerName} · Resonance</p>
            <h2 className="text-xl font-medium">{label}</h2>
          </div>
          <div className="flex gap-2" aria-label="Screen size">
            {(["desktop", "mobile"] as const).map(value => (
              <button
                key={value}
                type="button"
                aria-pressed={screen === value}
                onClick={() => setScreen(value)}
                className={`rounded-lg border px-3 py-2 text-xs capitalize ${screen === value ? "border-[var(--oremea-gold)] bg-[var(--oremea-gold-10)]" : "border-white/20"}`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
        <div className="flex min-h-[360px] items-center justify-center rounded-xl border border-white/10 bg-[#080808] p-4">
          <div
            role="img"
            aria-label={`${label} ${screen} background preview in ${mode} mode`}
            className={`relative flex w-full flex-col items-center justify-center overflow-hidden rounded-xl border border-white/20 ${screen === "desktop" ? "aspect-video" : "aspect-[9/16] max-w-[280px]"}`}
            style={{
              backgroundColor: initialBrand.background,
              backgroundImage: chosen ? `linear-gradient(rgb(0 0 0 / 0.34), rgb(0 0 0 / 0.66)), url("${chosen}")` : undefined,
              backgroundPosition: "center",
              backgroundSize: "cover",
            }}
          >
            <div className="max-w-[85%] rounded-xl bg-black/55 px-5 py-4 text-center backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.3em]" style={{ color: initialBrand.accent }}>
                Resonance
              </p>
              <h3 className="mt-3 text-2xl text-white">{label}</h3>
              <p className="mt-2 text-xs text-white/80">Your own words · your own meaning</p>
            </div>
          </div>
        </div>
        <p className="text-xs text-zinc-400">
          {mode === "plain"
            ? "Plain background: no room image."
            : mode === "original"
              ? "Original OREMEA artwork selected."
              : chosen && chosen.startsWith("/partner-assets/")
                ? "Partner artwork shown for this preview."
                : "No valid partner image selected for this scene; original OREMEA artwork shown."}
        </p>
      </div>
    </div>
  );
}
