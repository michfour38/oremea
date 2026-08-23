"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import Image from "next/image";
import { ChangeEvent, useEffect, useRef, useState } from "react";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const OUTPUT_SIZE = 512;

type ImageSize = { width: number; height: number };

function initials(name: string, email: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length > 1) return `${words[0][0]}${words.at(-1)?.[0] ?? ""}`.toUpperCase();
  if (words[0]) return words[0].slice(0, 2).toUpperCase();
  return email.slice(0, 2).toUpperCase();
}

function cropGeometry(
  image: ImageSize,
  viewport: number,
  zoom: number,
  horizontal: number,
  vertical: number,
) {
  const scale = Math.max(viewport / image.width, viewport / image.height) * zoom;
  const width = image.width * scale;
  const height = image.height * scale;
  const overflowX = Math.max(0, width - viewport);
  const overflowY = Math.max(0, height - viewport);

  return {
    width,
    height,
    left: (viewport - width) / 2 - (horizontal / 100) * (overflowX / 2),
    top: (viewport - height) / 2 - (vertical / 100) * (overflowY / 2),
  };
}

export function WorksAccountButton({ afterSignOutUrl = "/works" }: { afterSignOutUrl?: string }) {
  const { isLoaded, user } = useUser();
  const { openUserProfile, signOut } = useClerk();
  const [open, setOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function closeOnOutsideClick(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  if (!isLoaded || !user) return null;

  const email = user.primaryEmailAddress?.emailAddress ?? "";
  const name = user.fullName || email.split("@")[0] || "WORKS account";
  const fallback = initials(name, email);

  return (
    <>
      <div ref={rootRef} className="relative">
        <button
          type="button"
          aria-label="Open account menu"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-[#156b45] text-sm font-semibold tracking-[0.08em] text-white shadow-[0_0_0_1px_rgba(31,28,23,0.14),0_8px_24px_rgba(31,28,23,0.14)] transition hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-[#16834f]/35 focus:ring-offset-2"
        >
          {user.hasImage ? (
            <Image src={user.imageUrl} alt="" width={44} height={44} unoptimized className="h-full w-full object-cover" />
          ) : (
            fallback
          )}
        </button>

        {open ? (
          <div role="menu" className="absolute right-0 z-50 mt-3 w-72 overflow-hidden rounded-2xl border border-black/10 bg-white text-[#1f1c17] shadow-[0_20px_60px_rgba(31,28,23,0.22)]">
            <div className="flex items-center gap-3 border-b border-black/8 p-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#156b45] text-sm font-semibold tracking-[0.08em] text-white">
                {user.hasImage ? (
                  <Image src={user.imageUrl} alt="" width={44} height={44} unoptimized className="h-full w-full object-cover" />
                ) : (
                  fallback
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{name}</p>
                <p className="mt-0.5 truncate text-xs text-black/45">{email}</p>
              </div>
            </div>

            <div className="grid p-2 text-sm">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  setEditingPhoto(true);
                }}
                className="rounded-xl px-3 py-2.5 text-left transition hover:bg-[#f3eee4]"
              >
                Adjust profile photo
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  openUserProfile();
                }}
                className="rounded-xl px-3 py-2.5 text-left transition hover:bg-[#f3eee4]"
              >
                Manage account
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => void signOut({ redirectUrl: afterSignOutUrl })}
                className="rounded-xl px-3 py-2.5 text-left transition hover:bg-[#f3eee4]"
              >
                Sign out
              </button>
            </div>

            <p className="border-t border-black/8 px-4 py-3 text-center text-[10px] text-black/35">Account security by Clerk</p>
          </div>
        ) : null}
      </div>

      {editingPhoto ? <WorksPhotoEditor onClose={() => setEditingPhoto(false)} /> : null}
    </>
  );
}

function WorksPhotoEditor({ onClose }: { onClose: () => void }) {
  const { user } = useUser();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [imageSize, setImageSize] = useState<ImageSize | null>(null);
  const [zoom, setZoom] = useState(1);
  const [horizontal, setHorizontal] = useState(0);
  const [vertical, setVertical] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Choose an image file.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("Choose an image smaller than 10 MB.");
      return;
    }

    const url = URL.createObjectURL(file);
    const image = new window.Image();
    image.onload = () => {
      setPreviewUrl(url);
      setImageSize({ width: image.naturalWidth, height: image.naturalHeight });
      setZoom(1);
      setHorizontal(0);
      setVertical(0);
      setError("");
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      setError("WORKS could not open that image.");
    };
    image.src = url;
  }

  async function savePhoto() {
    if (!user || !previewUrl || !imageSize) return;

    try {
      setSaving(true);
      setError("");
      const source = new window.Image();
      source.src = previewUrl;
      await source.decode();

      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Photo editing is unavailable in this browser.");

      const geometry = cropGeometry(imageSize, OUTPUT_SIZE, zoom, horizontal, vertical);
      context.fillStyle = "#f3eee4";
      context.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
      context.drawImage(source, geometry.left, geometry.top, geometry.width, geometry.height);

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
      if (!blob) throw new Error("WORKS could not prepare that photo.");

      await user.setProfileImage({ file: blob });
      await user.reload();
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "WORKS could not save that photo.");
    } finally {
      setSaving(false);
    }
  }

  const preview = imageSize ? cropGeometry(imageSize, 192, zoom, horizontal, vertical) : null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 p-4" role="dialog" aria-modal="true" aria-labelledby="works-photo-title">
      <div className="w-full max-w-lg rounded-3xl bg-[#fbfaf7] p-6 text-[#1f1c17] shadow-2xl md:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#16834f]">Profile photo</p>
            <h2 id="works-photo-title" className="mt-2 font-serif text-3xl">Choose the part people will see</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close photo editor" className="rounded-full border border-black/10 px-3 py-1.5 text-sm">Close</button>
        </div>

        <input ref={inputRef} type="file" accept="image/*" onChange={chooseFile} className="sr-only" />

        <div className="mt-6 grid gap-6 sm:grid-cols-[192px_minmax(0,1fr)] sm:items-center">
          <div className="mx-auto h-48 w-48 overflow-hidden rounded-full border-4 border-white bg-[#e8e0d1] shadow-[0_0_0_1px_rgba(31,28,23,0.12)]">
            {previewUrl && preview ? (
              <div
                className="h-full w-full bg-no-repeat"
                style={{
                  backgroundImage: `url("${previewUrl}")`,
                  backgroundPosition: `${preview.left}px ${preview.top}px`,
                  backgroundSize: `${preview.width}px ${preview.height}px`,
                }}
              />
            ) : (
              <div className="flex h-full items-center justify-center px-5 text-center text-sm leading-6 text-black/45">Choose a photo to preview it here.</div>
            )}
          </div>

          <div className="grid gap-4">
            <button type="button" onClick={() => inputRef.current?.click()} className="rounded-full border border-black/15 bg-white px-5 py-2.5 text-sm">
              {previewUrl ? "Choose another photo" : "Choose photo"}
            </button>
            <PhotoSlider label="Zoom" min={1} max={3} step={0.05} value={zoom} onChange={setZoom} disabled={!previewUrl} />
            <PhotoSlider label="Move left / right" min={-100} max={100} step={1} value={horizontal} onChange={setHorizontal} disabled={!previewUrl} />
            <PhotoSlider label="Move up / down" min={-100} max={100} step={1} value={vertical} onChange={setVertical} disabled={!previewUrl} />
          </div>
        </div>

        {error ? <p className="mt-5 text-sm text-red-700">{error}</p> : null}

        <div className="mt-7 flex justify-end gap-3 border-t border-black/10 pt-5">
          <button type="button" onClick={onClose} className="rounded-full px-5 py-2.5 text-sm text-black/55">Cancel</button>
          <button type="button" onClick={() => void savePhoto()} disabled={!previewUrl || saving} className="rounded-full bg-[#1f1c17] px-6 py-2.5 text-sm text-white disabled:opacity-40">
            {saving ? "Saving…" : "Save photo"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PhotoSlider({
  label,
  min,
  max,
  step,
  value,
  onChange,
  disabled,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  disabled: boolean;
}) {
  return (
    <label className="text-xs text-black/50">
      {label}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2 block w-full accent-[#16834f] disabled:opacity-30"
      />
    </label>
  );
}
