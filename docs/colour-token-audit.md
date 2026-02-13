# Colour token audit

All UI colours in the app are tokenised and tied to brand colour shades where possible. This document records the audit and any remaining exceptions.

## Semantic tokens (globals.css)

All semantic tokens map to the palette:

| Token | Light | Dark | Palette |
|-------|--------|------|--------|
| `--background` | ghost-white-500 | soft-black-990 | ✓ |
| `--foreground` | soft-black-600 | ghost-white-500 | ✓ |
| `--card` / `--popover` | ghost-white-50 | soft-black-975 | ✓ |
| `--primary` | soft-black-600 | find-gold-500 | ✓ |
| `--primary-foreground` | ghost-white-500 | soft-black-950 | ✓ |
| `--secondary` / `--muted` | storm-blue-500 | soft-black-700/800 | ✓ |
| `--accent` | find-gold-500 | find-gold-500 | ✓ |
| `--destructive` | destructive-500 | destructive-600 | ✓ |
| `--destructive-foreground` | ghost-white-500 | ghost-white-500 | ✓ |
| `--inverse-foreground` | ghost-white-500 | ghost-white-500 | ✓ (text on dark surfaces, e.g. slate-blue) |
| `--ring` | sky-blue-500 | sky-blue-500 | ✓ |
| `--border` / `--input` | rgba(slate-blue, α) / rgba(white, α) | rgba(white, α) | Slate blue / white; palette-adjacent |

## Changes made (audit fixes)

- **Button (destructive):** `text-white` → `text-destructive-foreground` (palette: ghost-white-500).
- **Dialog overlay:** `bg-black/80` → `bg-soft-black-990/80`.
- **Navigation (active item):** `text-white`, `bg-white/20`, `text-white/80` → `text-inverse-foreground`, `bg-inverse-foreground/20`, `text-inverse-foreground/80`.
- **Dropdown / Select / Combobox (highlight):** `text-white` → `text-inverse-foreground` (slate-blue bg already tokenised).
- **Admin images:** Highlight ring/border/bg `#cfe02d` → `accent`; delete button and error text `red-500/600` → `destructive`; success text `green-500` → `text-muted-foreground` (no success colour in palette).
- **Home (YouTube card):** Gradient `from-red-600 to-red-800` → `from-destructive to-destructive-600`.
- **Style guide swatches:** Usage badge `bg-black/40`, `#fff` → `bg-soft-black-990/40`, `text-inverse-foreground`; info button `bg-black/0 hover:bg-black/20` → `bg-transparent hover:bg-soft-black-990/20`; experiment modal overlay `bg-black/80` → `bg-soft-black-990/80`.

## Intentional non-token / hex usage

- **Style guide colour cards:** Inline `backgroundColor: bg` and `color: textColor` use the swatch hex and contrast colour (#1F2024 / #E7ECEE) by design; they match palette (soft-black-600, ghost-white-500).
- **Brand assets (public):** `getContrastColor()` returns `#000000` or `#ffffff` for text on colour swatches; could be switched to palette equivalents if desired.
- **Brand assets (admin):** Default `colorHex` and fallbacks like `#000000` for missing hex; optional to replace with a single constant from palette.
- **Interactive dots (home):** Default `dotColor = 'rgba(207, 224, 45)'` (Find.co Gold / accent); canvas API needs a resolved colour string.
- **App page dotColor prop:** `rgba(207, 224, 45)` passed to dots; matches accent.
- **YouTube thumbnail (canvas):** `#000000`, `#FFFFFF`, `#FFD700` for canvas drawing; could be replaced with palette hex constants (soft-black, ghost-white, find-gold) if we centralise them.
- **Transparency checkerboard:** `rgba(255,255,255,0.2)` in brand-assets; generic pattern, not brand colour.

## Palette reference (brand shades)

- **Find.co Gold** `#CFE02D` → accent, primary (dark)
- **Soft Black** `#1F2024` (scale 400–990) → foreground, primary (light), dark surfaces
- **Slate Blue** `#42525E` → highlight (dropdown/select/combobox), chart-2, border/input tint
- **Sky Blue** `#2BACC1` → ring, chart-1
- **Storm Blue** `#BEDBDC` → secondary, muted, chart-3
- **Ghost White** `#E7ECEE` → background (light), primary-foreground, card (light), inverse-foreground
- **Destructive** `#DC2626` / `#B41F1F` → errors, destructive actions

No green in palette; “success” states use `text-muted-foreground` or could get a dedicated token later.
