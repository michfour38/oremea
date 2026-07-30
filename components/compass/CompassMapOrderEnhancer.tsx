"use client";

import { useEffect } from "react";

type MapItemSnapshot = {
  id: string;
  content: string;
  status: "active" | "waiting" | string;
};

const MAP_HASH = "#compass-map";

export function CompassMapOrderEnhancer() {
  useEffect(() => {
    let stopped = false;
    let dragCard: HTMLElement | null = null;
    let saveTimer: number | null = null;

    async function loadSnapshot(): Promise<MapItemSnapshot[]> {
      const response = await fetch("/api/compass/ending", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) return [];
      const data = await response.json();
      const items = Array.isArray(data?.state?.mapItems)
        ? data.state.mapItems
        : [];

      return items.filter(
        (item: MapItemSnapshot) =>
          item?.status === "active" || item?.status === "waiting",
      );
    }

    function getMapButton(): HTMLButtonElement | null {
      return (
        Array.from(document.querySelectorAll("button")).find(
          (button) => button.textContent?.trim() === "Map",
        ) ?? null
      );
    }

    function openMapFromHash() {
      if (window.location.hash !== MAP_HASH) return;
      const button = getMapButton();
      if (!button) return;

      button.click();
      window.history.replaceState(
        {},
        "",
        `${window.location.pathname}${window.location.search}`,
      );
    }

    function findList(): HTMLElement | null {
      const heading = Array.from(document.querySelectorAll("p")).find(
        (node) => node.textContent?.trim() === "What's asking for attention",
      );
      const section = heading?.closest("section");
      if (!section) return null;

      return Array.from(section.querySelectorAll<HTMLElement>("div")).find(
        (node) =>
          node.classList.contains("mt-4") &&
          node.classList.contains("space-y-3"),
      ) ?? null;
    }

    function getCards(list: HTMLElement): HTMLElement[] {
      return Array.from(list.children).filter((node): node is HTMLElement => {
        if (!(node instanceof HTMLElement)) return false;
        return Boolean(
          node.querySelector('button[aria-label^="Complete "]'),
        );
      });
    }

    async function saveOrder(list: HTMLElement) {
      const itemIds = getCards(list)
        .map((card) => card.dataset.compassMapId)
        .filter((value): value is string => Boolean(value));

      if (itemIds.length === 0) return;

      const response = await fetch("/api/compass/ending/reorder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ itemIds }),
      });

      if (!response.ok) return;

      window.location.hash = MAP_HASH;
      window.location.reload();
    }

    function queueSave(list: HTMLElement) {
      if (saveTimer !== null) window.clearTimeout(saveTimer);
      saveTimer = window.setTimeout(() => void saveOrder(list), 180);
    }

    function moveCard(card: HTMLElement, direction: -1 | 1) {
      const list = card.parentElement;
      if (!list) return;
      const cards = getCards(list);
      const index = cards.indexOf(card);
      const target = cards[index + direction];
      if (!target) return;

      if (direction < 0) {
        list.insertBefore(card, target);
      } else {
        list.insertBefore(target, card);
      }

      queueSave(list);
    }

    function attachCardBehaviour(card: HTMLElement, list: HTMLElement) {
      if (card.dataset.compassReorderReady === "true") return;
      card.dataset.compassReorderReady = "true";
      card.draggable = true;

      const content =
        card.querySelector("p")?.textContent?.trim() ?? "Map item";
      const controls = card.querySelector<HTMLElement>(".min-w-0.flex-1");
      if (!controls) return;

      const handle = document.createElement("button");
      handle.type = "button";
      handle.textContent = "⋮⋮";
      handle.setAttribute(
        "aria-label",
        `Drag to reorder ${content}. Use the up and down arrow keys to move it.`,
      );
      handle.title = "Drag to reorder";
      handle.className =
        "mt-0.5 shrink-0 cursor-grab rounded-lg border border-[#5A4A2E] px-2 py-1 text-base leading-none text-[#E7C98B] active:cursor-grabbing";

      const completeButton = card.querySelector('button[aria-label^="Complete "]');
      if (completeButton) {
        card.insertBefore(handle, completeButton.nextSibling);
      } else {
        card.insertBefore(handle, card.firstChild);
      }

      card.addEventListener("dragstart", (event) => {
        dragCard = card;
        card.style.opacity = "0.55";
        event.dataTransfer?.setData("text/plain", card.dataset.compassMapId ?? "");
        if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
      });

      card.addEventListener("dragend", () => {
        card.style.opacity = "";
        dragCard = null;
        queueSave(list);
      });

      card.addEventListener("dragover", (event) => {
        if (!dragCard || dragCard === card) return;
        event.preventDefault();
        const rect = card.getBoundingClientRect();
        const after = event.clientY > rect.top + rect.height / 2;
        list.insertBefore(dragCard, after ? card.nextSibling : card);
      });

      handle.addEventListener("keydown", (event) => {
        if (event.key === "ArrowUp") {
          event.preventDefault();
          moveCard(card, -1);
        }
        if (event.key === "ArrowDown") {
          event.preventDefault();
          moveCard(card, 1);
        }
      });

      handle.addEventListener("pointerdown", (event) => {
        if (event.pointerType === "mouse") return;
        event.preventDefault();
        dragCard = card;
        card.style.opacity = "0.7";
        handle.setPointerCapture(event.pointerId);
      });

      handle.addEventListener("pointermove", (event) => {
        if (!dragCard || event.pointerType === "mouse") return;
        const target = document
          .elementFromPoint(event.clientX, event.clientY)
          ?.closest<HTMLElement>("[data-compass-reorder-ready='true']");
        if (!target || target === dragCard || target.parentElement !== list) return;

        const rect = target.getBoundingClientRect();
        const after = event.clientY > rect.top + rect.height / 2;
        list.insertBefore(dragCard, after ? target.nextSibling : target);
      });

      function endPointerDrag(event: PointerEvent) {
        if (!dragCard || event.pointerType === "mouse") return;
        dragCard.style.opacity = "";
        dragCard = null;
        queueSave(list);
      }

      handle.addEventListener("pointerup", endPointerDrag);
      handle.addEventListener("pointercancel", endPointerDrag);
    }

    async function enhance() {
      openMapFromHash();
      const list = findList();
      if (!list || list.dataset.compassMapEnhanced === "true") return;

      const cards = getCards(list);
      if (cards.length < 2) return;

      const snapshot = await loadSnapshot();
      if (stopped || snapshot.length !== cards.length) return;

      cards.forEach((card, index) => {
        card.dataset.compassMapId = snapshot[index]?.id ?? "";
        attachCardBehaviour(card, list);
      });

      const section = list.closest("section");
      if (section && !section.querySelector("[data-compass-order-note]")) {
        const note = document.createElement("p");
        note.dataset.compassOrderNote = "true";
        note.className = "mt-3 text-sm leading-6 text-zinc-200";
        note.textContent =
          "Drag items into the order that matches your available movement. Reordering saves automatically and returns the Map for confirmation.";
        list.before(note);
      }

      list.dataset.compassMapEnhanced = "true";
    }

    const observer = new MutationObserver(() => void enhance());
    observer.observe(document.body, { childList: true, subtree: true });
    void enhance();

    return () => {
      stopped = true;
      observer.disconnect();
      if (saveTimer !== null) window.clearTimeout(saveTimer);
    };
  }, []);

  return null;
}
