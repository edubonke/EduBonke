"use client";

import { useCallback, useEffect, useState } from "react";

export function useNavigationDisclosure(id: string) {
  const [open, setOpen] = useState(false);
  const toggleId = id + "-toggle";
  const close = useCallback((returnFocus = true) => {
    setOpen(false);
    const button = document.getElementById(toggleId);
    if (returnFocus && button?.getClientRects().length) button.focus();
  }, [toggleId]);

  useEffect(() => {
    if (!open) return;
    const panel = document.getElementById(id);
    const button = document.getElementById(toggleId);
    panel?.querySelector<HTMLElement>("button, a[href], select")?.focus();

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") { event.preventDefault(); close(); }
    }
    function onOutside(event: PointerEvent) {
      const target = event.target;
      if (target instanceof Node && !panel?.contains(target) && !button?.contains(target)) close(false);
    }
    const desktop = window.matchMedia("(min-width: 901px)");
    function onResize() { if (desktop.matches) close(false); }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onOutside);
    desktop.addEventListener("change", onResize);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onOutside);
      desktop.removeEventListener("change", onResize);
    };
  }, [close, id, open, toggleId]);

  return { id, open, toggleId, close, toggle: () => setOpen(value => !value) };
}

export function NavigationToggle({ menu, label }: {
  menu: ReturnType<typeof useNavigationDisclosure>;
  label: string;
}) {
  return (
    <button type="button" id={menu.toggleId} className="mobile-menu"
      aria-label={label} aria-controls={menu.id} aria-expanded={menu.open} onClick={menu.toggle}>
      <span aria-hidden="true">{menu.open ? "×" : "☰"}</span>
    </button>
  );
}

export function PublicNavigation() {
  const menu = useNavigationDisclosure("public-navigation");
  return (
    <div className="public-navigation">
      <NavigationToggle menu={menu} label="Site navigation" />
      <nav id={menu.id} className={menu.open ? "open" : undefined} aria-label="Primary navigation">
        {["Platform", "Safeguards", "Pilot"].map(label => (
          <a key={label} href={"#" + label.toLowerCase()} onClick={() => menu.close(false)}>{label}</a>
        ))}
      </nav>
    </div>
  );
}
