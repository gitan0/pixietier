# Pixietiers Design System — Project Rules

**Read this file before writing any UI code in this project.** These are non-negotiable rules for keeping the Pixietiers design coherent as it grows.

---

## 1. Tokens only. Never invent values.

All colors, font sizes, spacings, radii, and shadows live in `tokens.css` (or your theme equivalent). **Do not write raw hex codes, raw pixel values, or raw shadow strings in component styles.** If you need a value that doesn't exist:

1. Stop.
2. Ask whether the existing ramp genuinely can't express this.
3. If it can't, propose the addition to the token file — don't inline it.

Banned in component CSS:
- Raw hex (`#ff5577`) — use `var(--pink)` / `var(--purple)` / etc.
- Magic pixel sizes outside the 8pt scale (`17px`, `23px`, `31px`)
- One-off `box-shadow` values — use the glow mixins
- Fonts other than Cinzel / Space Grotesk / JetBrains Mono

---

## 2. Build with primitives. Don't rebuild them.

The following components exist. Use them. Do not write new ones that overlap:

| Need | Use |
|---|---|
| Page wordmark | `<Logo>` |
| Top nav | `<PillNav>` |
| Any tappable action | `<Button variant="primary\|default\|ghost\|icon">` |
| Any filter/toggle chip | `<Chip on={bool}>` |
| Any chess piece / NFT | `<Piece piece={...} size="lg\|sm">` |
| Any tier row (S/A/B/C/F/D) | `<TierRow tier="..." pieces={...} verdict?>` |
| Any big number | `<MetricCard hue="purple\|red\|green\|yellow\|pink\|blue" label value delta>` |
| Any chart | `<ChartCard>` wrapping `<ChartLine>` / `<ChartBar>` |

If you think you need a new primitive, it should be small, composable, and added to this list via PR — not invented ad hoc in a single page.

---

## 3. Page composition rules

Every page follows this outer shell:

```
<PageBackground>          // the 3-layer radial-gradient stack
  <Logo />
  <PillNav active={...} />
  <main>
    {/* page content */}
  </main>
</PageBackground>
```

- Max content width: `1240px`, centered, padding `28px` horizontal.
- Section spacing: `28–40px` between major blocks.
- Cards use `16px` radius. Pieces use `14px` (large) / `10–12px` (small). Chips/pills `999px`. No other radii.

---

## 4. Hue discipline

The accent ramp is **purple, pink, red, orange, yellow, green, blue, cyan**. Each color has a defined role:

- **Purple** — primary brand, active states, "positive supply" (Total Minted)
- **Pink** — hero accents, legendary rarity, S-tier
- **Red** — destructive, "burned/lost", F-tier
- **Orange** — warnings, A-tier, ETH-spent
- **Yellow** — caution, B-tier, ETH metrics
- **Green** — positive deltas, net supply, new users
- **Blue** — informational, returning users, rare rarity, C-tier
- **Cyan** — secondary informational accent

Don't use colors decoratively or at random. Each hue in a dashboard should correspond to a category readable in the legend.

---

## 5. Chart rules

- **Never hardcode axis tick positions or labels.** Let the chart library (Recharts / visx / etc.) handle tick placement based on data. If you catch hand-placed `<span>`s in an axis row, that's a bug.
- Every chart stroke gets a `filter: drop-shadow(0 0 6px <hue>)` for the neon glow. Stroke width `2–2.5px`.
- Dashed strokes mean "derived" (e.g. Net Supply = Minted − Burned). Solid = raw data.
- Area fills use a gradient from `35% opacity → 0` over ~200px height.
- Bar charts: `border-radius: 4px 4px 0 0`, vertical hue gradient + matching glow.

---

## 6. `<Piece>` rules

`<Piece>` is the single source of truth for how custom NFT artwork renders anywhere in the product.

- Always pass a full piece object (`{ tokenId, name, type, imageUrl }`) — never partial. `type` is on-chain data: `king | queen | rook | bishop | knight | pawn`.
- `size="sm"` is for compact contexts (tier-row pieces, table row labels). It keeps a tiny name label (7px mono) but hides the token-ID badge. If you need even more compact (ribbon counts, dense tables), pass `size="xs"` which hides both.
- Loading state is the `.loading` class with shimmer keyframe. Use it. Don't show broken image icons.
- Type dot color is driven by `pieceTypeColor()` — extend that map, don't override per-call. Colors: king=pink, queen=purple, rook=orange, bishop=yellow, knight=green, pawn=blue.
- **The type dot must always be explainable.** Any page that renders `<Piece>` must also surface a type legend somewhere visible on that page (inline key in the bench header, footer strip on share pages, tooltip on hover — pick the one that fits). Never ship the dot without a key. Minimum key: `● King ● Queen ● Rook ● Bishop ● Knight ● Pawn` using the actual swatch colors.
- **Hover tooltip is the single source of truth** for piece metadata: name, token ID, type (spelled out), owner, mint date. Do not rebuild piece info panels elsewhere.
- **Optional indicator mode.** `<Piece>` supports `indicator="type" | "owned" | "ranked" | "burned" | "none"` to switch what the dot represents. Default is `type`. When a wallet is connected, expose a toggle so users can flip to `owned` (green = you own it). Only one mode at a time — never stack indicators.

---

## 7. Typography rules

- **Cinzel** = brand voice. Logo, H1s, tier letters, section anchors. Never body text.
- **Space Grotesk** = UI + body. All buttons, labels, descriptions.
- **JetBrains Mono** = numbers + technical metadata. Every number in a metric card, every timestamp, every token ID, every axis tick.

If a string is a number → mono. If it's a category label → Space Grotesk. If it's a Big Moment → Cinzel. No exceptions.

---

## 8. Interaction rules

- Hover on interactive elements: `translateY(-2 or -3px)` + purple border tint. Never `scale()`.
- Transitions: `180ms ease` default; `300ms ease-out` for larger movements.
- Focus rings: `outline: 2px solid var(--purple)`, `outline-offset: 2px`. Never remove focus without replacing.
- Drag state (editor): `cursor: grabbing`, piece lifts 6px with stronger glow. Drop zones get a purple dashed inset border when a valid drop is over them.

---

## 9. Mobile rules (under 640px)

See `Pixietiers Mobile.html` in the design handoff for the visual target.

- **Page padding** `28px → 16px` horizontal.
- **Logo** `56px → 34px`.
- **PillNav** becomes horizontally scrollable (`overflow-x: auto`, `scroll-snap-type: x mandatory`). No wrap — long nav scrolls.
- **Editor:** bench grid uses `repeat(3, 1fr)`. Tier letter column `160px → 88px`, letter font `110px → 56px`. Action bar collapses to primary **Share ↗** + `⋯` overflow menu — Copy PNG, Share Link, Reset live inside the menu.
- **Stats:** metric grids go `3-col → 2-col`. The first card of each section (Total Minted, ETH Spent, Burn Rate) spans full-width as a hero — the next two share a row.
- **Tap targets** ≥ 40px everywhere. Chips/pills and icon buttons must not go below this.
- **Type legend** must still be surfaced above the bench grid on mobile — don't drop it to "save space."

---

## 10. What to do when you need a new page

1. Start from `<PageBackground>` + `<Logo>` + `<PillNav>`.
2. Sketch the page as a composition of existing primitives. 90% of the time this works.
3. If you hit a gap, document it: *"This page needs X, no primitive covers it."* — then propose the smallest possible new primitive, not a page-specific one-off.
4. Add the new page to PillNav items in order of user flow priority.

---

## 11. What's out of scope for this codebase

- **Mint / buy flows** → pixiechess.xyz
- **Docs / FAQ / about** → pixiechess.xyz (link out only)
- **Wallet UI, connect-wallet modals** → use the project's existing wallet provider; don't redesign
- **User profile CRUD** → later scope, ask before building

If a request lands in any of these buckets, confirm scope before writing code.

---

## 12. Tailwind note

If this project uses Tailwind: configure `theme.extend` from `tokens.css` so class names map to CSS vars. **Do not** translate CSS tokens into arbitrary Tailwind classes like `bg-[#9d6cff]` — you'll lose the glow system and break dark-mode overrides. If you're doing `bg-[...]` or `shadow-[...]` in JSX, stop and add the token to the theme instead.
