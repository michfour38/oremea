"use client";

import { useEffect } from "react";

const INPUT_SELECTOR =
  '[data-resonance-root="true"] textarea:not(:disabled)';

function isEditableElement(element: Element | null) {
  if (!(element instanceof HTMLElement)) return false;

  return (
    element.matches("textarea, input, [contenteditable='true']") ||
    element.closest("textarea, input, [contenteditable='true']") !== null
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

function focusNextResonanceInput() {
  if (isEditableElement(document.activeElement)) return;

  const inputs = Array.from(
    document.querySelectorAll<HTMLTextAreaElement>(INPUT_SELECTOR),
  );

  const nextInput = inputs.find(
    (input) => isVisible(input) && input.value.trim().length === 0,
  );

  if (!nextInput) return;

  nextInput.scrollIntoView({
    behavior: "smooth",
    block: "center",
  });

  window.setTimeout(() => {
    if (!isEditableElement(document.activeElement)) {
      nextInput.focus({ preventScroll: true });
    }
  }, 180);
}

export default function ResonanceInputFocus() {
  useEffect(() => {
    let timer = window.setTimeout(focusNextResonanceInput, 220);

    const observer = new MutationObserver(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(focusNextResonanceInput, 180);
    });

    observer.observe(document.body, {
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
