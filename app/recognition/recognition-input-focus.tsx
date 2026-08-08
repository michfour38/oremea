"use client";

import { useEffect } from "react";

const ROOT_SELECTOR = '[data-recognition-root="true"]';
const INPUT_SELECTOR =
  'textarea:not(:disabled), input:not(:disabled):not([type="hidden"]), [contenteditable="true"]';

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

function getValue(element: HTMLElement) {
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    return element.value.trim();
  }

  return element.textContent?.trim() ?? "";
}

function focusRecognitionInput() {
  const root = document.querySelector<HTMLElement>(ROOT_SELECTOR);
  if (!root) return;

  const active = document.activeElement;
  if (isEditableElement(active) && active instanceof HTMLElement && root.contains(active)) {
    active.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    return;
  }

  const inputs = Array.from(
    root.querySelectorAll<HTMLElement>(INPUT_SELECTOR),
  ).filter(isVisible);

  if (inputs.length === 0) return;

  const nextInput = inputs.find((input) => getValue(input).length === 0) ?? inputs[0];

  nextInput.scrollIntoView({
    behavior: "smooth",
    block: "center",
  });

  window.setTimeout(() => {
    const currentActive = document.activeElement;
    if (!isEditableElement(currentActive) || !root.contains(currentActive)) {
      nextInput.focus({ preventScroll: true });
    }
  }, 180);
}

export default function RecognitionInputFocus() {
  useEffect(() => {
    let timer = window.setTimeout(focusRecognitionInput, 220);

    const observer = new MutationObserver(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(focusRecognitionInput, 180);
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
