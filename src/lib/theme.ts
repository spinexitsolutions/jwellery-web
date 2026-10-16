import type { ThemeSettings } from "./settings-types";

export function themeToCss(theme: ThemeSettings) {
  const c = theme.colors;
  const radius = Math.max(0, Math.min(40, theme.radius));
  const btnRadius = theme.buttonStyle === "pill" ? "999px" : theme.buttonStyle === "soft" ? `${Math.max(radius, 8)}px` : "0px";
  return `:root{--bg:${c.background};--surface:${c.surface};--fg:${c.foreground};--muted:${c.muted};--accent:${c.accent};--accent-fg:${c.accentForeground};--line:${c.border};--dark:${c.dark};--dark-fg:${c.darkForeground};--radius:${radius}px;--btn-radius:${btnRadius};--container:${theme.containerWidth}px;--font-heading:"${theme.headingFont}",ui-serif,Georgia,serif;--font-body:"${theme.bodyFont}",ui-sans-serif,system-ui,sans-serif;}`;
}

export function googleFontsHref(theme: ThemeSettings) {
  const fam = (name: string, spec: string) => `family=${encodeURIComponent(name).replace(/%20/g, "+")}${spec}`;
  const heading = theme.headingFont;
  // Some display families only ship a regular weight; request italic where it exists.
  const singleWeight = ["Instrument Serif", "DM Serif Display", "Italiana", "Marcellus", "Gloock"];
  const headingSpec = singleWeight.includes(heading)
    ? heading === "Instrument Serif" || heading === "DM Serif Display"
      ? ":ital@0;1"
      : ""
    : ":ital,wght@0,400;0,500;0,600;1,400;1,500";
  const body = fam(theme.bodyFont, ":wght@300;400;500;600");
  return `https://fonts.googleapis.com/css2?${fam(heading, headingSpec)}&${body}&display=swap`;
}
