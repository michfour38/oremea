"use client";

import { useEffect, useRef } from "react";

type FieldControl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

const ERROR_SELECTOR = [
  '[role="alert"]',
  '[aria-live="assertive"]',
  'p[class*="text-red-"]',
  'div[class*="text-red-"]',
  'span[class*="text-red-"]',
].join(",");

function isVisible(element: HTMLElement) {
  const style = window.getComputedStyle(element);
  const box = element.getBoundingClientRect();
  return style.display !== "none" && style.visibility !== "hidden" && box.width > 0 && box.height > 0;
}

function labelFor(control: FieldControl) {
  const wrapped = control.closest("label");
  if (wrapped instanceof HTMLLabelElement) return wrapped;
  if (!control.id) return null;
  return document.querySelector<HTMLLabelElement>(`label[for="${CSS.escape(control.id)}"]`);
}

function labelText(control: FieldControl) {
  return labelFor(control)?.textContent?.trim().toLowerCase() ?? "";
}

function numberValue(control?: FieldControl) {
  if (!control || control.value.trim() === "") return null;
  const value = Number(control.value);
  return Number.isFinite(value) ? value : null;
}

function addMarker(target: HTMLElement, before?: Element | null) {
  if (target.querySelector(":scope > [data-oremea-error-marker]")) return;
  const marker = document.createElement("span");
  marker.textContent = "*";
  marker.setAttribute("aria-hidden", "true");
  marker.dataset.oremeaErrorMarker = "true";
  if (before) target.insertBefore(marker, before);
  else target.appendChild(marker);
}

function markControl(control: FieldControl) {
  control.dataset.oremeaInvalid = "true";
  if (control.getAttribute("aria-invalid") !== "true") {
    control.setAttribute("aria-invalid", "true");
    control.dataset.oremeaManagedAriaInvalid = "true";
  }

  const label = labelFor(control);
  if (label) addMarker(label, control.closest("label") === label ? control : null);
}

function markHeading(scope: HTMLElement) {
  const heading = scope.querySelector<HTMLElement>("legend, h1, h2, h3, h4");
  if (!heading) return null;
  heading.dataset.oremeaInvalidHeading = "true";
  if (!heading.hasAttribute("tabindex")) {
    heading.tabIndex = -1;
    heading.dataset.oremeaManagedTabindex = "true";
  }
  addMarker(heading);
  return heading;
}

function clearGeneratedMarkers() {
  document.querySelectorAll<HTMLElement>("[data-oremea-error-marker]").forEach((marker) => marker.remove());
  document.querySelectorAll<FieldControl>('[data-oremea-invalid="true"]').forEach((control) => {
    delete control.dataset.oremeaInvalid;
    if (control.dataset.oremeaManagedAriaInvalid === "true") {
      control.removeAttribute("aria-invalid");
      delete control.dataset.oremeaManagedAriaInvalid;
    }
  });
  document.querySelectorAll<HTMLElement>('[data-oremea-invalid-heading="true"]').forEach((heading) => {
    delete heading.dataset.oremeaInvalidHeading;
    if (heading.dataset.oremeaManagedTabindex === "true") {
      heading.removeAttribute("tabindex");
      delete heading.dataset.oremeaManagedTabindex;
    }
  });
}

function inferInvalidControls(scope: HTMLElement) {
  const controls = Array.from(
    scope.querySelectorAll<FieldControl>("input:not([type='hidden']), select, textarea"),
  ).filter(isVisible);

  const explicit = controls.filter((control) => control.getAttribute("aria-invalid") === "true");
  if (explicit.length) return explicit;

  const nativeInvalid = controls.filter((control) => !control.validity.valid);
  if (nativeInvalid.length) return nativeInvalid;

  const minimum = controls.find((control) => labelText(control).includes("minimum"));
  const preferred = controls.find((control) => labelText(control).includes("preferred"));
  const maximum = controls.find((control) => labelText(control).includes("maximum"));

  if (minimum || preferred || maximum) {
    const minimumValue = numberValue(minimum);
    const preferredValue = numberValue(preferred);
    const maximumValue = numberValue(maximum);

    if (minimum && (minimumValue === null || minimumValue <= 0)) return [minimum];
    if (maximum && minimumValue !== null && (maximumValue === null || maximumValue < minimumValue)) return [maximum];
    if (
      preferred &&
      preferredValue !== null &&
      minimumValue !== null &&
      maximumValue !== null &&
      (preferredValue < minimumValue || preferredValue > maximumValue)
    ) {
      return [preferred];
    }
  }

  const emptyRequired = controls.filter((control) => control.required && control.value.trim() === "");
  if (emptyRequired.length) return emptyRequired;

  return [];
}

/**
 * Oremea-wide navigation rule:
 * every visible validation error identifies the nearest invalid field with a red
 * marker and moves keyboard focus to it. Explicit aria-invalid always wins;
 * native validity and common range relationships are used as safe fallbacks.
 */
export function ValidationNavigator() {
  const lastFocusedKey = useRef("");

  useEffect(() => {
    let frame = 0;
    const observer = new MutationObserver(() => schedule());

    function decorateErrors() {
      observer.disconnect();
      clearGeneratedMarkers();

      const errors = Array.from(document.querySelectorAll<HTMLElement>(ERROR_SELECTOR)).filter(
        (element) => isVisible(element) && Boolean(element.textContent?.trim()),
      );

      if (!errors.length) {
        lastFocusedKey.current = "";
        observe();
        return;
      }

      let firstTarget: HTMLElement | null = null;

      errors.forEach((error) => {
        const scope = error.closest<HTMLElement>(
          "[data-validation-scope], fieldset, section, form, main",
        );
        if (!scope) return;

        const invalidControls = inferInvalidControls(scope);
        if (invalidControls.length) {
          invalidControls.forEach(markControl);
          firstTarget ??= invalidControls[0];
          return;
        }

        firstTarget ??= markHeading(scope);
      });

      const key = `${window.location.pathname}|${errors
        .map((error) => error.textContent?.trim())
        .join("|")}`;

      if (firstTarget && lastFocusedKey.current !== key) {
        lastFocusedKey.current = key;
        firstTarget.focus({ preventScroll: true });
        firstTarget.scrollIntoView({ behavior: "smooth", block: "center" });
      }

      observe();
    }

    function schedule() {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(decorateErrors);
    }

    function observe() {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["aria-invalid", "class", "hidden"],
      });
    }

    observe();
    schedule();

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      clearGeneratedMarkers();
    };
  }, []);

  return null;
}
