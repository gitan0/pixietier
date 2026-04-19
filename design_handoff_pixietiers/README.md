# Handoff: Pixietiers Redesign

## Overview
A full visual redesign of **pixietiers.com** — a chess tier-list maker for the Pixie NFT ecosystem. The redesign covers three screens: the tier-list editor, the public tier-list / share page, and the on-chain stats dashboard. The new look is dark, cinematic, premium-gaming — pulling design DNA (multi-hue glowing metric cards, pill nav, Cinzel logo glow, neon chart strokes) from the sister property **pixiechess.xyz**.

**Yes — Sonnet can handle this comfortably.** The work is well-scoped: three screens, one shared component library, one small set of design tokens. The only interaction of real complexity is drag-and-drop in the editor (use `@dnd-kit`).

## About the Design Files
The files in this bundle are **design references created in HTML** — prototypes showing intended look and behavior, not production code to copy directly. The task is to **recreate these designs in the existing pixietiers codebase** using its established framework and libraries. If the project has no framework yet, React + Vite + CSS Modules (or Tailwind) is a sensible default.

The key file, `Pixietiers Redesign.html`, is a single self-contained HTML+CSS prototype. Read its `<style>` block as the spec for tokens and component styling; read the body markup as component composition guidance.

## Fidelity
**High-fidelity (hifi).** Colors, typography, spacing, glow treatments, and interactions are final. Recreate pixel-accurately, then connect to live data and real piece artwork.

---

## Design Tokens

Paste directly into `tokens.css` or port to your Tailwind / CSS-in-JS theme.

### Colors
```css
:root {
  /* Backgrounds */
  --bg:      #0a0810;    /* page bg */
  --bg-2:    #120e1c;
  --bg-3:    #1a1429;
  --card:    #140f20;    /* card bg base */
  --card-2:  #1c1530;    /* card bg elevated */

  /* Lines & dividers */
  --line:    #2a2140;
  --line-2:  #3a2d55;

  /* Text */
  --ink:     #ece7ff;    /* primary */
  --muted:   #7a6fa0;    /* secondary */
  --muted-2: #4d4468;    /* tertiary */

  /* Accent ramp (used for metric cards, tier colors, chart strokes) */
  --purple:   #9d6cff;   --purple-2: #7c3cff;
  --pink:     #ff57a8;
  --red:      #ff4d5e;
  --orange:   #ff8c3d;
  --yellow:   #ffd04d;
  --green:    #4cd694;
  --blue:     #4da0ff;
  --cyan:     #5de8ff;
}
```

### Typography
```css
/* Fonts — Google Fonts */
--font-display: 'Cinzel', serif;          /* Logo, tier letters, section titles (600/800) */
--font-ui:      'Space Grotesk', sans-serif; /* Body + UI (400/500/600/700) */
--font-mono:    'JetBrains Mono', monospace; /* Numbers, captions, eyebrows (400/500/700) */
```

| Role | Font | Size | Weight | Letter-spacing |
|---|---|---|---|---|
| Logo "PIXIE" | Cinzel | 56px | 800 | 6px |
| H1 (page titles) | Cinzel | 38px | 800 | 1px |
| Hero H1 (share page) | Cinzel | 68px | 800 | 1.5px |
| Tier letter | Cinzel | 110px (84px compact) | 800 | 2px |
| Metric value | JetBrains Mono | 44px | 700 | -1px |
| Eyebrow / label | JetBrains Mono | 10–11px | 400 | 2–2.5px UPPER |
| Body | Space Grotesk | 13–14px | 400/500 | normal |
| Chip / button | Space Grotesk | 11–13px | 600 | 0.3px |

### Spacing
Follow an 8-pt grid. Common values used: `4 / 6 / 8 / 10 / 14 / 16 / 18 / 22 / 28 / 36 / 40`.

### Radii
- Chips / pills: `999px`
- Small buttons / kbd: `5–10px`
- Cards (metric, chart): `16px`
- Pieces (large): `14px`; (small): `10–12px`
- Tier letters: `12px`

### Shadows & Glows
The cinematic look lives in glows, not drop-shadows. Each accent color has a matching glow:
```css
/* Generic pattern */
.glow-purple { box-shadow: 0 0 24px rgba(157,108,255,.45), inset 0 1px 0 rgba(255,255,255,.25); }
.text-glow-purple { text-shadow: 0 0 30px rgba(157,108,255,.8); }
```
Every metric card uses a **radial-gradient in `::before`** for the soft hue wash (cheaper than filter/blur).

### Page background
Three layered radial gradients plus the base:
```css
body {
  background:
    radial-gradient(1200px 600px at 50% -10%, rgba(157,108,255,.14), transparent 60%),
    radial-gradient(800px 500px at 10% 110%, rgba(255,87,168,.08), transparent 60%),
    radial-gradient(900px 500px at 100% 100%, rgba(77,160,255,.06), transparent 60%),
    var(--bg);
}
```

---

## Core Components

Build these once, reuse across all three screens.

### `<Logo />`
Cinzel 56px, letter-spacing 6px. Text-shadow stack:
```
0 0 8px rgba(157,108,255,.9),
0 0 28px rgba(157,108,255,.55),
0 0 60px rgba(124,60,255,.45)
```
Plus a `::after` underline (60% width, linear gradient purple-to-transparent).

### `<PillNav items={['Editor','Tier List','Stats']} />`
- Container: `padding 6px`, `border 1px solid var(--line)`, `border-radius 999px`, translucent bg with `backdrop-filter: blur(12px)`.
- Inactive tab: `color: var(--muted)`, transparent bg.
- Active tab: `background: linear-gradient(180deg, #a878ff 0%, #7c3cff 100%)`, `color: #fff`, `box-shadow: 0 0 20px rgba(157,108,255,.6), inset 0 1px 0 rgba(255,255,255,.3)`.

### `<Button variant="primary|default|ghost|icon" />`
- Default: `border 1px solid var(--line-2)`, `bg rgba(28,21,48,.6)`, hover → `border-color var(--purple)`.
- Primary: purple gradient + glow (same as active pill).
- Ghost: transparent bg.
- Radius 10px, padding 9×16.

### `<Chip on={bool} />`
Small pill for filters. `border 1px solid var(--line-2)`, `radius 999px`, padding 6×12, font 11/600. On-state gains purple border + subtle inner glow.

### `<Piece piece={piece} size="lg|sm" />` ★ Drop-in for custom NFT artwork

**This is the component to wire to real data.** The mock uses procedural gradients (`.p1`–`.p15`) — replace with real images.

```jsx
function Piece({ piece, size = 'lg' }) {
  return (
    <div className={`piece ${size === 'sm' ? 'sm' : ''}`} title={piece.name}>
      <img
        className="art"
        src={piece.imageUrl}
        alt={piece.name}
        loading="lazy"
      />
      <div className="badge">#{piece.tokenId}</div>
      <div
        className="rarity"
        style={{ '--rarity': rarityColor(piece.rarity) }}
      />
      <div className="label">{piece.name}</div>
    </div>
  );
}
```

Add to CSS (the mock uses a `<div class="art">` — for real images use this):
```css
.piece .art {
  position: absolute; inset: 0;
  width: 100%; height: 100%;
  object-fit: contain;        /* or `cover`, depending on artwork style */
  background: #0f0a1c;         /* fallback while image loads */
}
```

Styling spec (see `Pixietiers Redesign.html` for full source):
- Large: 100×100, radius 14px
- Small: 64×64, radius 10px (hides badge + label)
- `border: 1px solid var(--line-2)`, `overflow: hidden`
- Hover: `translateY(-3px)`, purple border glow
- Badge (top-left): token ID, tiny mono, black-translucent chip
- Rarity dot (top-right): 8×8 circle colored by rarity tier
- Label (bottom): auto-hidden on small; gradient scrim + mono uppercase name
- Loading state: `.loading` class enables shimmer keyframe

**Rarity → color map:**
```js
const rarityColor = (r) => ({
  legendary: 'var(--pink)',
  epic:      'var(--purple)',
  rare:      'var(--blue)',
  uncommon:  'var(--green)',
  common:    'var(--muted)',
})[r] || 'var(--muted)';
```

### `<TierRow tier="S" pieces={...} verdict? />`
- Grid: `160px 1fr 48px` (compact: `130px 1fr 90px` on share page to fit verdict column).
- Rounded card, gradient bg, radial hue-wash overlay in `::before`.
- Letter cell: Cinzel 110px, own gradient bg + hue-specific glow, 1px hue border.
- Well: flex-wrap, gap 10, min-height 128, holds `<Piece />` children.
- Menu cell: vertical stack of icon buttons (↑, ⋮).

**Per-tier hue variants** (apply as class `tier-s`, `tier-a`, etc.). Each sets four CSS vars: `--tier-bg`, `--tier-border`, `--tier-glow`, `--glow`. See source file for exact values.

| Tier | Dominant hue |
|---|---|
| S | pink → purple |
| A | orange → red |
| B | yellow → orange |
| C | green → blue |
| F | blue → cyan |

### `<MetricCard hue="purple" label value delta />`
- Radius 16px, padding 18×20, min-height 130.
- Class variants: `mc-purple / mc-red / mc-green / mc-yellow / mc-pink / mc-blue`.
- Each sets: bg-top gradient, border color, radial glow color, foreground text color, text-shadow color, delta color.
- Label: mono 10px 2px uppercase.
- Value: mono 44px 700 -1px, tinted fg + strong text-shadow in its hue.
- Delta: mono 11px, green by default, red for `mc-red` variant.

### `<ChartCard title>` with `<ChartLine />` / `<ChartBar />`
- Card wrapper radius 16px, padding 18×22×14.
- Title: Space Grotesk 14/700 uppercase, letter-spacing 1.8px, margin-bottom 16.
- Line chart:
  - 260px tall area with 1px `--line-2` left + bottom axes.
  - Grid: repeating-linear-gradients for 40px × 60px cells.
  - Use `<svg viewBox="0 0 600 240" preserveAspectRatio="none">`; each series is a `<polyline>` with `stroke-width 2–2.5` and a `filter: drop-shadow(0 0 6px <hue>)` for the neon effect.
  - Optional area fill under primary series (gradient from 35% opacity to 0).
  - Legend underneath, mono 11px, small swatch + label.
- Bar chart:
  - `display:flex`, bars with `border-radius 4px 4px 0 0`, each a vertical linear-gradient of hue → darker hue + matching `box-shadow` glow.
  - Stacked variant: two bars inside same column, second uses `.blue` modifier.

Recommended chart lib in production: **Recharts** or **visx**. Wrap them in this styling.

---

## Screens

### 1. Editor
**Purpose:** drag custom pieces from the bench into S/A/B/C/F tier rows.

**Layout (top-to-bottom, max-width 1240px):**
1. **Top:** Logo + PillNav (centered, stacked).
2. **Arena header:** grid split — left: eyebrow + H1 + meta row (Ranked / Custom pieces / Bench / Tiers / Visibility); right: action buttons (Presentation, Export, **Publish →** primary). Bottom border `1px solid var(--line)`.
3. **Arena stage:** 5 `<TierRow />`s stacked with 12px gap.
4. **Bench:** own card, header = "BENCH" + count pill + filter chips (All sets / Pixie Gen 1 / Pixie Gen 2 / Community / My mints / + Import). Grid: `repeating(auto-fill, minmax(88px, 1fr))`, gap 10, `max-height 280px`, `overflow-y: auto`. Bottom row: upload button + keyboard shortcuts legend (⌨ 1–5 tier, ↑↓ move, ⌫ bench).

**Interactions:**
- Drag: `@dnd-kit`. Each `<Piece />` is a `<Draggable>`; each tier well + bench is a `<Droppable>`. On drop, update backing state array (one piece can only live in one container at a time).
- Keyboard: `1`–`5` moves the hovered/selected piece to tier S/A/B/C/F; `Backspace` returns to bench.
- Autosave: debounce 1s, show "autosaved Ns ago" in eyebrow (live-tick the N).
- Hover a piece → lift 3px, purple border glow.

**State:**
```ts
type EditorState = {
  listId: string;
  title: string;
  collection: { id: string; name: string };   // e.g. Pixie Gen 1
  tiers: { id: 'S'|'A'|'B'|'C'|'F'; label: string; pieceIds: string[] }[];
  benchIds: string[];
  pieces: Record<string, Piece>;  // keyed for O(1) lookup
  filter: string;                 // selected collection filter
  dirty: boolean;
  lastSavedAt: number;
};
```

### 2. Tier List (Share / Public view)
**Purpose:** read-only display of a published list; CTA to remix / vote.

**Layout:**
1. Logo + PillNav.
2. **Hero:** centered. Kicker (purple mono 11px, "PIXIETIERS · {collection} · {N} CUSTOM PIECES"), H1 (Cinzel 68px, fill with white→light-purple linear-gradient + `text-shadow` purple glow), byline ("by @user · 312 votes · 1,284 views").
3. **Ribbon:** 5-col grid of tier cells. Each cell: card, big tier letter in its hue + glow, mono count label.
4. **Card stack:** same `<TierRow />` but grid `130px 1fr 90px` — third column holds a `<TierVerdict />` (italic mono-adjacent copy in `var(--muted)`, max-width 260).
5. **Actions:** bottom bar, top border. Primary "Remix this list", plus 👍 Agree · N, 👎 Disagree · N, Share, Export PNG.

**Interactions:**
- Vote buttons toggle (optimistic update), require auth if not signed in.
- "Export PNG" uses `html-to-image` on the card stack + ribbon.

### 3. Stats (Broadcast dashboard)
**Purpose:** pulled-from-pixiechess on-chain metrics.

**Layout:**
1. Logo + PillNav.
2. **Stats toolbar:** left — eyebrow + H1 "Network Stats" (Cinzel 34px); right — range pill group (24H / 7D · active / 30D / All) + "↻ Refresh data" icon button.
3. **Three sections**, each prefixed by a section-eyebrow (mono 11px 2.5px uppercase var(--muted)):
   - **Supply** — 3 `<MetricCard>`s: Total Minted (purple), Total Burned (red), Net Supply (green). Each with 24H delta.
   - **Demand** — ETH Spent (yellow), Unique Minters (pink), Ranked Players (blue).
   - **Ratios** — Burn Rate (red), Avg ETH/Mint (yellow), Avg Mints/Minter (blue).
4. **Net Supply over Time** — full-width `<ChartCard>`. 3 series (Burnt red, Net Supply blue dashed, Total Minted green w/ area fill). Y-axis labels on left, X-axis date ticks below, legend below that.
5. **Two-col row:** Daily Burns (purple bars) | New vs Returning Minters (green + blue stacked).
6. **Last-sync footer:** pulsing green dot + "Live · synced from contract 0x..." on left; "Last refresh · Ns ago" on right. `border-top: 1px dashed var(--line-2)`.

**Data shape:**
```ts
type StatsPayload = {
  range: '24H'|'7D'|'30D'|'ALL';
  supply: { totalMinted: number; totalBurned: number; netSupply: number; deltas: {...} };
  demand: { ethSpent: number; uniqueMinters: number; rankedPlayers: number; deltas: {...} };
  ratios: { burnRate: number; avgEthPerMint: number; avgMintsPerMinter: number; deltas: {...} };
  netSupplyOverTime: { date: string; burnt: number; net: number; totalMinted: number }[];
  dailyBurns:        { date: string; value: number }[];
  newVsReturning:    { date: string; new: number; returning: number }[];
  contractAddress:   string;
  lastSyncedAt:      number;
};
```

**Interactions:**
- Range pills trigger refetch.
- Refresh button does explicit refetch + animates the pulse dot.
- Charts interactive on hover (tooltip showing date + values in their respective hues).

---

## Extending to future pages

**The design is built to scale.** Any new page composed from the primitives (`<Logo>`, `<PillNav>`, `<Piece>`, `<TierRow>`, `<MetricCard>`, chart wrappers, page-background) will inherit the look automatically. Confirmed in-scope follow-up pages:

### Community Consensus
Aggregated ranking seeded by user submissions. Layout: PillNav → centered hero (H1 Cinzel 38px + muted subtitle) → 5× `<TierRow>` rendering the community's weighted ranking → card titled "NOT YET RANKED (N)" containing a `.bench-grid` of unplaced `<Piece>`s → primary CTA `<Button variant="primary">Build your own tier list →</Button>`.

### Matchups
Pairwise W/L data. Two sub-patterns, both reusing the existing system:
- **Table:** rows = pieces (use `<Piece size="sm">` as row labels), columns = opponents, cells = win%. Neon-tinted backgrounds per bucket (green = winning, red = losing, muted = neutral).
- **Heatmap:** same grid, colored only. Use the accent ramp directly.
Wrap in a `<ChartCard>`.

### Leaderboard / Players (optional)
Can live as a tab inside Stats or its own page. Reuses `<MetricCard>` header row + a table styled like Matchups.

### Patterns worth codifying now

1. **Centered hero pattern** — reuse on any marketing/landing-style page:
   ```jsx
   <section className="hero-centered">
     <h1>Page Title</h1>              {/* Cinzel 38–68px, white→purple gradient fill */}
     <p className="subtitle">...</p>   {/* Space Grotesk 14px var(--muted) */}
   </section>
   ```

2. **Read-only tier-row empty state** — inside `.well` when `pieces.length === 0`:
   ```html
   <div class="empty">No pieces at this tier yet</div>
   ```
   ```css
   .empty { font-style: italic; color: var(--muted); font-size: 13px; padding: 8px 4px; }
   ```

3. **Fifth tier "D"** — the editor uses S/A/B/C/F; community/consensus pages may want S/A/B/C/D. Add a `tier-d` hue variant (suggest purple — distinct from the hue set and mirrors the logo). Add alongside the existing tier classes in CSS:
   ```css
   .tier-d { --tier-bg: linear-gradient(135deg, #2a1a45, #1a1030);
             --tier-border: var(--purple);
             --tier-glow: rgba(157,108,255,.3);
             --glow: 0 0 20px rgba(157,108,255,.6); }
   ```

### The one rule for new pages
**Do not invent new tokens.** New colors, new font sizes, new card shapes — push back and use the existing ramp. If a use case truly can't be expressed with the tokens, treat that as a design-system conversation, not an ad-hoc override.

### Out of scope
- Mint / Buy page → belongs on pixiechess.xyz
- Docs / About / FAQ → link out to pixiechess.xyz

---

## Implementation Order

Build in this sequence — least state complexity first:

1. **Tokens + primitives** — tokens.css, `<Logo>`, `<PillNav>`, `<Button>`, `<Chip>`, page background layering.
2. **`<Piece>` component** — wire to the project's existing piece/NFT data source.
3. **`<MetricCard>` + chart wrappers** — read-only, stateless.
4. **Stats page** — easiest to ship; build-validate the visual system.
5. **Tier List (share) page** — read-only render of a saved list.
6. **Editor page** — `@dnd-kit` + autosave state machine. Ship last.

---

## Assets
- **Fonts:** Google Fonts — Cinzel (600, 800), Space Grotesk (400, 500, 600, 700), JetBrains Mono (400, 500, 700). Import via `<link>` or `@import`.
- **Chess pieces:** use the project's existing custom-piece artwork. The mock's procedural gradients (`.p1`–`.p15`) are **placeholders only** — discard once real `imageUrl`s are wired into `<Piece>`.
- **No custom icons needed.** Tier-row arrows, refresh glyphs, etc. use unicode (↑, ⋮, ↻, ▲, ▼, Ξ) or a small icon lib of the team's choice.

---

## Files in this bundle

- `Pixietiers Redesign.html` — hifi prototype (Arena editor + Tier List share + Broadcast stats). Open in a browser to interact; use its `<style>` block as the styling spec.
- `Wireframes.html` — lofi exploration of three directions (Broadcast / Arena / Codex) × three screens (Editor / Share / Stats). Useful context for *why* the chosen directions were picked; not required for implementation.
- `README.md` — this document.

---

## Can Sonnet handle this?

Yes. The scope is tightly bounded (3 screens, 1 token set, 1 component library, 1 real interaction). Give Claude Code the tokens file + `<Piece>` spec first, then hand it the screens in the order above. Each screen is 1–2 self-contained tasks.
