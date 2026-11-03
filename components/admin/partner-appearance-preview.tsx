"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";

import type { PartnerExperience } from "@/src/lib/oremea/partner-experiences";
import type { PartnerAppearanceDraft } from "@/src/lib/oremea/partner-appearance-contract";
import { MAX_PARTNER_IMAGE_BYTES } from "@/src/lib/oremea/partner-appearance-limits";
import { safePartnerBackgroundAsset } from "@/src/lib/oremea/partner-theme";
import { getResonanceSceneBackgrounds } from "@/src/lib/resonance/resonance-backgrounds";

type Brand = PartnerExperience["brand"];
type Mode = Brand["resonanceScenes"]["mode"];
type Screen = "desktop" | "mobile";
type Scene = "entry" | "archive" | number;
type SceneAsset = { desktop: string | null; mobile: string | null };

const roomLabels = [
  "Hearth", "Mirror", "Garden", "Compass", "Pulse", "Shadow",
  "Forge", "Vision", "The Gathering", "The Becoming",
] as const;
const scenes: readonly { key: string; scene: Scene; label: string }[] = [
  { key: "entry", scene: "entry", label: "Entry" },
  ...roomLabels.map((label, index) => ({
    key: String(index + 1), scene: index + 1, label,
  })),
  { key: "archive", scene: "archive", label: "Archive" },
];

function getScene(draft: PartnerAppearanceDraft, scene: Scene): SceneAsset {
  if (scene === "entry") return draft.resonanceScenes.entry;
  if (scene === "archive") return draft.resonanceScenes.archive;
  return draft.resonanceScenes.rooms[scene] ?? { desktop: null, mobile: null };
}
function updateScene(
  draft: PartnerAppearanceDraft, scene: Scene, screen: Screen, path: string | null,
): PartnerAppearanceDraft {
  const updated = { ...getScene(draft, scene), [screen]: path };
  const old = draft.resonanceScenes;
  return {
    ...draft,
    resonanceScenes: {
      ...old,
      entry: scene === "entry" ? updated : old.entry,
      archive: scene === "archive" ? updated : old.archive,
      rooms: typeof scene === "number"
        ? { ...old.rooms, [scene]: updated }
        : old.rooms,
    },
  };
}

export function PartnerAppearancePreview({
  partnerSlug,
  partnerName,
  initialBrand,
}: {
  partnerSlug: string;
  partnerName: string;
  initialBrand: Brand;
}) {
  // Client previews need only the one brand sent by the server, never the
  // complete partner offer registry (which includes non-public pricing plans).
  const fallback = useMemo<PartnerAppearanceDraft>(() => ({
    background: initialBrand.background,
    foreground: initialBrand.foreground,
    accent: initialBrand.accent,
    backgroundAssetPath: initialBrand.backgroundAssetPath,
    mobileBackgroundAssetPath: initialBrand.mobileBackgroundAssetPath,
    resonanceScenes: initialBrand.resonanceScenes,
  }), [initialBrand]);
  const [draft, setDraft] = useState<PartnerAppearanceDraft>(fallback);
  const [revision, setRevision] = useState(0);
  const [selected, setSelected] = useState("1");
  const [screen, setScreen] = useState<Screen>("desktop");
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch(`/api/partner-appearance/${partnerSlug}`, { cache: "no-store" });
        if (!response.ok) throw new Error("Could not load partner settings.");
        const data = await response.json();
        if (cancelled) return;
        setDraft(data.appearance);
        setRevision(data.revision);
        setLoadFailed(false);
      } catch {
        if (!cancelled) {
          setLoadFailed(true);
          setFeedback("Saved settings could not be loaded. Reload the page to retry.");
        }
        return;
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [partnerSlug]);

  const item = scenes.find(value => value.key === selected) ?? scenes[1];
  const scene = item.scene;
  const chosenScene = getScene(draft, scene);
  const brand: Brand = { ...initialBrand, ...draft };
  const backgrounds = getResonanceSceneBackgrounds(scene, brand);
  const chosen = screen === "desktop" ? backgrounds.desktop : backgrounds.mobile;
  const mode: Mode = draft.resonanceScenes.mode;
  const saveDisabled = loading || busy || loadFailed;

  function chooseMode(next: Mode) {
    setDraft(current => ({
      ...current,
      resonanceScenes: { ...current.resonanceScenes, mode: next },
    }));
    setFeedback("");
  }

  async function upload(event: ChangeEvent<HTMLInputElement>, which: Screen) {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    if (!file) return;
    if (file.size > MAX_PARTNER_IMAGE_BYTES || file.size < 12) {
      setFeedback("Choose a PNG, JPEG or WebP image no larger than 1.5 MB.");
      return;
    }
    const targetScene = scene;
    setBusy(true);
    setFeedback("");
    try {
      const body = new FormData();
      body.append("image", file);
      const response = await fetch(`/api/partner-appearance/${partnerSlug}/assets`, {
        method: "POST",
        body,
      });
      const result = await response.json();
      if (!response.ok || typeof result.path !== "string") {
        throw new Error(result.error || "Image upload failed.");
      }
      setDraft(current => updateScene(current, targetScene, which, result.path));
      setFeedback("Image uploaded privately. Select Save changes to keep this selection.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Image upload failed.");
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (saveDisabled) return;
    setBusy(true);
    setFeedback("");
    try {
      const response = await fetch(`/api/partner-appearance/${partnerSlug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revision, appearance: draft }),
      });
      const result = await response.json();
      if (!response.ok || !result.saved) {
        throw new Error(result.error || "Could not save partner settings.");
      }
      setDraft(result.appearance);
      setRevision(result.revision);
      setFeedback("Draft saved. It is not published and customers are unchanged.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
      <div className="space-y-6 rounded-2xl border border-white/15 bg-black/40 p-5">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-300" htmlFor="partner-scene">
            Resonance scene
          </label>
          <select id="partner-scene" value={selected}
            onChange={event => { setSelected(event.target.value); setFeedback(""); }}
            className="mt-2 w-full rounded-lg border border-white/25 bg-[#161616] p-3 text-white">
            {scenes.map(value => <option key={value.key} value={value.key}>{value.label}</option>)}
          </select>
        </div>
        <fieldset className="space-y-2" disabled={loading || busy || loadFailed}>
          <legend className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-300">
            Background choice
          </legend>
          {([
            ["original", "Keep original OREMEA artwork"],
            ["custom", "Optional partner artwork"],
            ["plain", "Plain background"],
          ] as const).map(([value, title]) => (
            <label key={value} className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/15 px-3 py-3 text-sm">
              <input type="radio" name="partner-background-mode"
                checked={mode === value} onChange={() => chooseMode(value)}
                className="accent-amber-500" />
              <span>{title}</span>
            </label>
          ))}
        </fieldset>
        {mode === "custom" && (
          <div className="space-y-4">
            <p className="text-xs leading-6 text-zinc-400">
              Upload optional imagery per scene. Empty slots retain the original
              OREMEA artwork. Desktop and mobile images are separate.
            </p>
            {(["desktop", "mobile"] as const).map(which => (
              <div key={which} className="space-y-2">
                <label htmlFor={`partner-upload-${which}`} className="block text-xs capitalize text-zinc-200">
                  {which} scene image
                </label>
                <input id={`partner-upload-${which}`} type="file" accept="image/png,image/jpeg,image/webp"
                  onChange={event => void upload(event, which)}
                  disabled={loading || busy}
                  className="block w-full text-xs text-zinc-200 file:mr-3 file:rounded-lg file:border-0 file:bg-white/15 file:px-3 file:py-2 file:text-white" />
                {chosenScene[which] ? (
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[11px] text-zinc-400">{chosenScene[which]}</span>
                    <button type="button" disabled={loading || busy}
                      onClick={() => setDraft(current => updateScene(current, scene, which, null))}
                      className="text-xs underline">Clear</button>
                  </div>
                ) : <p className="text-[11px] text-zinc-500">Using original scene for this size.</p>}
              </div>
            ))}
          </div>
        )}
        <fieldset disabled={loading || busy} className="space-y-3 border-t border-white/15 pt-4">
          <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-300">
            Partner colours
          </legend>
          {([
            ["background", "Background"],
            ["foreground", "Text"],
            ["accent", "Accent"],
          ] as const).map(([key, title]) => (
            <label key={key} className="flex items-center justify-between gap-3 text-xs text-zinc-300">
              <span>{title}</span>
              <input type="color" value={draft[key]}
                onChange={event => setDraft(current => ({ ...current, [key]: event.target.value }))}
                className="h-9 w-16 cursor-pointer rounded" />
            </label>
          ))}
        </fieldset>

        <button type="button" onClick={() => void save()} disabled={saveDisabled}
          className="w-full rounded-xl border border-[var(--oremea-gold-border)] bg-[var(--oremea-gold-10)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-40">
          {busy ? "Working…" : loading ? "Loading…" : "Save changes"}
        </button>
        {feedback && <p role="status" aria-live="polite" className="text-xs leading-6 text-amber-100">{feedback}</p>}
        <p className="text-xs leading-6 text-zinc-400">
          Saved as a private draft only. No Whop products, subscriptions,
          customers or live brand settings are changed.
        </p>
      </div>

      <div className="space-y-4 rounded-2xl border border-white/15 bg-black/30 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-400">{partnerName} · Resonance</p>
            <h2 className="text-xl font-medium">{item.label}</h2>
          </div>
          <div className="flex gap-2" aria-label="Screen size">
            {(["desktop", "mobile"] as const).map(value => (
              <button key={value} type="button" aria-pressed={screen === value}
                onClick={() => setScreen(value)}
                className={`rounded-lg border px-3 py-2 text-xs capitalize ${screen === value ? "border-[var(--oremea-gold)] bg-[var(--oremea-gold-10)]" : "border-white/20"}`}>
                {value}
              </button>
            ))}
          </div>
        </div>
        <div className="flex min-h-[360px] items-center justify-center rounded-xl border border-white/10 bg-[#080808] p-4">
          <div role="img" aria-label={`${item.label} ${screen} background in ${mode} mode`}
            className={`relative flex w-full flex-col items-center justify-center overflow-hidden rounded-xl border border-white/20 ${screen === "desktop" ? "aspect-video" : "aspect-[9/16] max-w-[280px]"}`}
            style={{
              backgroundColor: draft.background,
              backgroundImage: chosen ? `linear-gradient(rgb(0 0 0 / 0.34), rgb(0 0 0 / 0.66)), url("${chosen}")` : undefined,
              backgroundPosition: "center",
              backgroundSize: "cover",
            }}>
            <div className="max-w-[85%] rounded-xl bg-black/55 px-5 py-4 text-center backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.3em]" style={{ color: draft.accent }}>Resonance</p>
              <h3 className="mt-3 text-2xl text-white">{item.label}</h3>
              <p className="mt-2 text-xs text-white/80">Your own words · your own meaning</p>
            </div>
          </div>
        </div>
        <p className="text-xs text-zinc-400">
          {mode === "plain" ? "Plain background selected."
            : mode === "original" ? "Original OREMEA artwork selected."
              : chosen && safePartnerBackgroundAsset(chosen) ? "Partner artwork preview."
                : "Original OREMEA artwork is the fallback for this scene."}
        </p>
      </div>
    </div>
  );
}
