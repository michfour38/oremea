"use client";

import { useEffect } from "react";

const INPUT_SELECTOR =
  '[data-resonance-root="true"] textarea[data-resonance-input="true"]:not(:disabled)';

function isEditableElement(element: Element | null) {
  if (!(element instanceof HTMLElement)) return false;

  return (
    element.matches("textarea, input, [contenteditable='true']") ||
    element.closest("textarea, input, [contenteditable='true']") !== null
  );
}

function isInteractiveElement(element: Element | null) {
  if (!(element instanceof HTMLElement)) return false;

  return (
    isEditableElement(element) ||
    element.matches(
      "button, a[href], select, summary, [role='button'], [role='menuitem']",
    ) ||
    element.closest(
      "button, a[href], select, summary, [role='button'], [role='menuitem']",
    ) !== null
  );
}

function isVisible(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);

  return (
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    rect.width > 0 &&
    rect.height > 0
  );
}

function getNextInput() {
  const inputs = Array.from(
    document.querySelectorAll<HTMLTextAreaElement>(INPUT_SELECTOR),
  );

  return (
    inputs.find(
      (input) =>
        input.isConnected &&
        isVisible(input) &&
        input.value.trim().length === 0,
    ) ?? null
  );
}

function getDailyMirrorSection(input: HTMLTextAreaElement) {
  const section = input.closest<HTMLElement>("section");
  if (!section) return null;

  const text = section.textContent ?? "";
  return text.includes("Today's Mirror") ? section : null;
}

function focusNextResonanceInput() {
  // Never take focus away from something the participant deliberately chose,
  // including navigation buttons and menu links. Automatic focus is only for
  // transitions where the page itself has released focus.
  if (isInteractiveElement(document.activeElement)) return;

  const nextInput = getNextInput();
  if (!nextInput) return;

  // Confirm the candidate survived the render that unlocked it. This prevents
  // a transient input elsewhere in the tree from briefly stealing the viewport
  // while router.refresh() is replacing the saved card with the next one.
  window.setTimeout(() => {
    if (isInteractiveElement(document.activeElement)) return;

    const confirmedInput = getNextInput();
    if (!confirmedInput || confirmedInput !== nextInput) return;

    const dailyMirrorSection = getDailyMirrorSection(confirmedInput);

    if (dailyMirrorSection) {
      dailyMirrorSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      window.setTimeout(() => {
        if (
          !isInteractiveElement(document.activeElement) &&
          confirmedInput.isConnected
        ) {
          confirmedInput.focus({ preventScroll: true });
        }
      }, 180);

      return;
    }

    confirmedInput.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    window.setTimeout(() => {
      if (
        !isInteractiveElement(document.activeElement) &&
        confirmedInput.isConnected
      ) {
        confirmedInput.focus({ preventScroll: true });
      }
    }, 180);
  }, 140);
}

export default function ResonanceInputFocus() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(
      '[data-resonance-root="true"]',
    );
    if (!root) return;

    let timer = window.setTimeout(focusNextResonanceInput, 260);

    const observer = new MutationObserver((mutations) => {
      // Opening or closing MemberNav menus must not be treated as a Resonance
      // progression event. Those DOM changes previously re-fired autofocus and
      // pulled the participant back down to the current reflection textarea.
      const navigationOnly = mutations.every((mutation) => {
        const target =
          mutation.target instanceof Element
            ? mutation.target
            : mutation.target.parentElement;
        return target?.closest("nav") !== null;
      });

      if (navigationOnly) return;

      window.clearTimeout(timer);
      timer = window.setTimeout(focusNextResonanceInput, 240);
    });

    observer.observe(root, {
      childList: true,
      subtree: true,
    });

    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  return null;
}
