# CLAUDE CODE HANDOFF: Pixie Chess Tier List Maker

## What this is
A drag-and-drop tier list maker for Pixie Chess pieces. Think tiermaker.com but specifically for Pixie Chess, built to share in their Discord and on X.

## Why it exists
Luke is trying to get noticed by Josh Harris (founder of Pixie Chess, EIR at Paradigm). He's already active in their Discord and has DM'd Josh. This tool + a Dune analytics dashboard are the "show don't tell" plays to demonstrate value before asking about a role.

## Current state
There's a working React component at `/mnt/user-data/outputs/pixie-tier-list.jsx` that renders as a Claude artifact. It needs to be turned into a standalone deployable web app.

### What works now:
- All 31 Pixie Chess pieces with names, types, and chess emoji placeholders
- 5 tier rows (S/A/B/C/D) with drag-and-drop
- Unranked piece pool at the bottom
- Editable tier list title
- Piece counter and reset button
- Color-coded piece type badges (king, queen, rook, bishop, knight, pawn)
- Dark theme matching Pixie Chess branding exactly:
  - Main bg: #0a0910
  - Card/row bg: #0d0c1c
  - Piece card bg: #000000 (for PNG blending)

### Piece list (31 pieces):
**King (1):** Rocketman
**Queen (1):** Fission Reactor
**Rooks (2):** Phase Rook, Sumo Rook
**Bishops (12):** Aristocrat, Basilisk, Blade Runner, Bouncer, Cardinal, Dancer, Djinn, Horde Mother, Icicle, Marauder, Pilgrim, Anti Violence
**Knights (6):** Banker, Camel, ElectroKnight, Fish, Piñata, Knightmare
**Pawns (9):** Blueprint, Epee Pawn, Golden Pawn, Hero Pawn, Iron Pawn, Pawn w/ Knife, War Automaton, Warp Jumper, Gunslinger

## What needs to happen next

### Priority 1: Get real piece artwork
- The piece images on pixiechess.xyz have black backgrounds
- Cards are already set to #000000 bg so PNGs will blend seamlessly
- Need to: inspect pixiechess.xyz, find image URLs (likely CDN or IPFS)
- Replace the emoji placeholders with actual `<img>` tags
- If images can't be scraped, try the Pixie Chess Discord — someone may have them

### Priority 2: Make it a deployable web app
- Convert from React artifact to a standalone Next.js or Vite app
- Deploy to Vercel or Netlify (free tier)
- Domain: something like pixie-tierlist.vercel.app

### Priority 3: Screenshot/share functionality
- Add a "Share" button that captures the tier list as an image (use html2canvas)
- This is the viral mechanic — people screenshot and share their rankings
- Should include the Pixie Chess branding and the user's title in the capture
- Optional: generate a shareable URL with tier data encoded in the hash

### Priority 4: Mobile support
- Current drag-and-drop is desktop-only (HTML5 drag events)
- Add touch support: either use a library like @dnd-kit/core or implement touch events manually
- Tap-to-select then tap-tier-to-place is simpler than true touch drag on mobile

### Priority 5: Polish
- Add piece ability tooltips on hover (all 31 abilities are documented in the dashboard project's 00_FOUNDATION.sql)
- Animate piece placement (scale bounce on drop)
- Add a "randomize" button for fun
- Consider adding custom tier labels (let users rename S/A/B/C/D)

## Tech decisions
- **Framework:** Vite + React is simplest for fast deploy
- **Styling:** Keep inline styles or move to Tailwind — the current aesthetic is intentional (dark Pixie theme), don't change the colors
- **Fonts:** DM Sans (body) + Orbitron (headers) — loaded from Google Fonts
- **Screenshot:** html2canvas or dom-to-image for the share feature
- **Drag & drop:** Current vanilla HTML5 drag works for desktop. @dnd-kit for mobile support.
- **Deploy:** Vercel (one-click from GitHub)

## Related project
There's also a Dune analytics dashboard project in the same outputs folder (`/mnt/user-data/outputs/pixie-chess-dashboard/`). That's a separate effort — SQL queries for tracking Pixie Chess onchain economy data. The tier list and dashboard are two prongs of the same strategy.

## File location
`/mnt/user-data/outputs/pixie-tier-list.jsx` — the complete React component
