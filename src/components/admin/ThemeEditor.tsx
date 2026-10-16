"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { saveTheme } from "@/app/admin/actions";
import { FONT_OPTIONS, THEME_PRESETS, type ThemeSettings } from "@/lib/settings-types";
import { googleFontsHref } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { ColorField } from "./fields";
import { Button, Card, Label, Select, Toggle, useAction } from "./ui";

const COLOR_LABELS: Record<keyof ThemeSettings["colors"], string> = {
  background: "Background",
  surface: "Surface (tinted sections)",
  foreground: "Text",
  muted: "Muted text",
  accent: "Accent",
  accentForeground: "Text on accent",
  border: "Lines & borders",
  dark: "Dark sections",
  darkForeground: "Text on dark",
};

export function ThemeEditor({ initial }: { initial: ThemeSettings }) {
  const [t, setT] = useState(initial);
  const { run, pending } = useAction();
  const set = <K extends keyof ThemeSettings>(k: K, v: ThemeSettings[K]) => setT((p) => ({ ...p, [k]: v }));

  // Load fonts for the live preview.
  useEffect(() => {
    const id = "admin-theme-fonts";
    let link = document.getElementById(id) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    link.href = googleFontsHref(t);
  }, [t]);

  const c = t.colors;
  const btnRadius = t.buttonStyle === "pill" ? 999 : t.buttonStyle === "soft" ? Math.max(t.radius, 8) : 0;

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_460px]">
      <div className="space-y-6">
        <Card title="Presets" description="Start from a curated palette, then fine-tune.">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {Object.entries(THEME_PRESETS).map(([key, p]) => (
              <button
                key={key}
                onClick={() => setT({ ...t, preset: key, colors: p.colors })}
                className={cn("overflow-hidden rounded-xl border-2 text-left transition", t.preset === key ? "border-zinc-900" : "border-zinc-200 hover:border-zinc-400")}
              >
                <div className="flex h-16" style={{ background: p.colors.background }}>
                  <span className="m-auto font-serif text-2xl italic" style={{ color: p.colors.accent }}>
                    Aa
                  </span>
                  <span className="w-4" style={{ background: p.colors.dark }} />
                </div>
                <div className="flex items-center justify-between px-2.5 py-2 text-xs font-medium">
                  {p.label}
                  {t.preset === key && <Check size={13} />}
                </div>
              </button>
            ))}
          </div>
        </Card>

        <Card title="Colours">
          <div className="grid gap-5 sm:grid-cols-2">
            {(Object.keys(COLOR_LABELS) as (keyof ThemeSettings["colors"])[]).map((k) => (
              <div key={k}>
                <Label>{COLOR_LABELS[k]}</Label>
                <ColorField value={c[k]} onChange={(v) => setT({ ...t, preset: "custom", colors: { ...c, [k]: v } })} />
              </div>
            ))}
          </div>
        </Card>

        <Card title="Typography">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label>Headings</Label>
              <Select value={t.headingFont} onChange={(e) => set("headingFont", e.target.value)}>
                {FONT_OPTIONS.heading.map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Body</Label>
              <Select value={t.bodyFont} onChange={(e) => set("bodyFont", e.target.value)}>
                {FONT_OPTIONS.body.map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </Select>
            </div>
          </div>
        </Card>

        <Card title="Shape & layout">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <Label>Corner radius — {t.radius}px</Label>
              <input type="range" min={0} max={32} value={t.radius} onChange={(e) => set("radius", Number(e.target.value))} className="w-full accent-zinc-900" />
            </div>
            <div>
              <Label>Max content width — {t.containerWidth}px</Label>
              <input type="range" min={1100} max={1920} step={20} value={t.containerWidth} onChange={(e) => set("containerWidth", Number(e.target.value))} className="w-full accent-zinc-900" />
            </div>
            <div>
              <Label>Buttons</Label>
              <Select value={t.buttonStyle} onChange={(e) => set("buttonStyle", e.target.value as ThemeSettings["buttonStyle"])}>
                <option value="pill">Pill</option>
                <option value="soft">Soft rounded</option>
                <option value="sharp">Sharp</option>
              </Select>
            </div>
            <div>
              <Label>Header</Label>
              <Select value={t.headerStyle} onChange={(e) => set("headerStyle", e.target.value as ThemeSettings["headerStyle"])}>
                <option value="transparent">Transparent over hero</option>
                <option value="solid">Always solid</option>
              </Select>
            </div>
          </div>
        </Card>

        <Card title="Motion & effects">
          <div className="grid gap-5 sm:grid-cols-2">
            <Toggle label="Animations" help="Text reveals, parallax, transitions" checked={t.animations} onChange={(v) => set("animations", v)} />
            <Toggle label="Smooth scrolling" help="Inertia scrolling (Lenis)" checked={t.smoothScroll} onChange={(v) => set("smoothScroll", v)} />
            <Toggle label="Custom cursor" help="Gold cursor with hover labels" checked={t.customCursor} onChange={(v) => set("customCursor", v)} />
            <Toggle label="Film grain" help="Subtle analogue texture" checked={t.grain} onChange={(v) => set("grain", v)} />
            <Toggle label="Intro preloader" help="Brand reveal on first visit" checked={t.preloader} onChange={(v) => set("preloader", v)} />
            <Toggle label="3D jewellery" help="Interactive WebGL ring (falls back to image)" checked={t.enable3D} onChange={(v) => set("enable3D", v)} />
          </div>
        </Card>
      </div>

      <div className="xl:sticky xl:top-6 xl:h-fit">
        <div className="overflow-hidden rounded-2xl border border-zinc-200 shadow-sm">
          <div className="flex items-center gap-1.5 border-b border-zinc-200 bg-zinc-50 px-3 py-2">
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
            <span className="ml-2 text-xs text-zinc-500">Preview</span>
          </div>
          <div style={{ background: c.background, color: c.foreground, fontFamily: `"${t.bodyFont}", sans-serif` }}>
            <div className="flex items-center justify-between px-6 py-4 text-[10px] uppercase tracking-[0.18em]" style={{ borderBottom: `1px solid ${c.border}` }}>
              <span>Shop</span>
              <span style={{ fontFamily: `"${t.headingFont}", serif` }} className="text-xl normal-case tracking-normal">
                Kaaya
              </span>
              <span>Bag (2)</span>
            </div>
            <div className="px-6 py-8">
              <p className="text-[10px] uppercase tracking-[0.22em]" style={{ color: c.muted }}>
                Fine jewellery
              </p>
              <h3 className="mt-3 text-5xl leading-[0.95]" style={{ fontFamily: `"${t.headingFont}", serif` }}>
                Light, <em style={{ color: c.accent }}>held</em> for ever.
              </h3>
              <p className="mt-4 text-sm leading-relaxed" style={{ color: c.muted }}>
                Heirloom pieces drawn, set and polished by hand in our atelier.
              </p>
              <div className="mt-6 flex gap-3">
                <span className="px-5 py-3 text-[10px] uppercase tracking-[0.14em]" style={{ background: c.foreground, color: c.background, borderRadius: btnRadius }}>
                  Explore
                </span>
                <span className="px-5 py-3 text-[10px] uppercase tracking-[0.14em]" style={{ background: c.accent, color: c.accentForeground, borderRadius: btnRadius }}>
                  Accent
                </span>
              </div>
              <div className="mt-8 grid grid-cols-2 gap-3">
                {["Ember Ring", "Dewdrop"].map((n) => (
                  <div key={n}>
                    <div className="aspect-[4/5]" style={{ background: c.surface, borderRadius: t.radius }} />
                    <p className="mt-2 text-lg" style={{ fontFamily: `"${t.headingFont}", serif` }}>
                      {n}
                    </p>
                    <p className="text-xs" style={{ color: c.muted }}>
                      ₹48,500
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-6 py-8" style={{ background: c.dark, color: c.darkForeground }}>
              <p className="text-3xl" style={{ fontFamily: `"${t.headingFont}", serif` }}>
                Dark section
              </p>
              <p className="mt-2 text-xs opacity-60">Collections, footer and call-to-action blocks use these colours.</p>
            </div>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <Button className="flex-1" loading={pending} onClick={() => run(() => saveTheme(t), "Theme published")}>
            Save & publish theme
          </Button>
          <a href="/" target="_blank" className="inline-flex h-10 items-center rounded-lg border border-zinc-200 bg-white px-4 text-sm hover:bg-zinc-50">
            View site
          </a>
        </div>
      </div>
    </div>
  );
}
