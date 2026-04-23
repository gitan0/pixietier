import { useState, useEffect, useCallback, Fragment } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line,
} from "recharts";
import { fetchDuneQuery, normalizeAddress, formatTimeAgo, formatDate } from "./dune.js";
import { snapshotPlayerStats, getPlayerSnapshots } from "./supabase.js";

// ─── Query IDs ────────────────────────────────────────────────────────────────
const QUERIES = {
  totalMinted:      7327562,
  totalBurns:       7323388,
  netSupply:        7327563,
  totalEth:         7327570,
  uniquePlayers:    7327572,
  pieceMarket:      7323712,
  whaleLeaderboard: 7323356,
  dailyBurns:       7323330,
  revenueSplit:     7323363,
  newVsReturning:   7323372,
  supplyOverTime:   7323283,
  dailyMintsByType: 7323349,
  cohortRetention:  7329664,
  revenueSplitDaily: 7329740,
};

// ─── Piece type colors ────────────────────────────────────────────────────────
const TYPE_COLORS = {
  King:   { bg: "#fbbf24", text: "#78350f" },
  Queen:  { bg: "#f472b6", text: "#831843" },
  Rook:   { bg: "#34d399", text: "#064e3b" },
  Bishop: { bg: "#818cf8", text: "#312e81" },
  Knight: { bg: "#fb923c", text: "#7c2d12" },
  Pawn:   { bg: "#94a3b8", text: "#1e293b" },
};

// Per-piece colors, visually grouped by type
const PIECE_COLORS = {
  // King
  "Rocketman":      "#fbbf24",
  // Queen
  "Fission Reactor":"#f472b6",
  // Rooks
  "Phase Rook":     "#34d399",
  "Sumo Rook":      "#059669",
  // Bishops (indigo/purple family)
  "Aristocrat":     "#818cf8",
  "Basilisk":       "#6366f1",
  "Blade Runner":   "#a5b4fc",
  "Bouncer":        "#7c3aed",
  "Cardinal":       "#8b5cf6",
  "Dancer":         "#a78bfa",
  "Djinn":          "#c4b5fd",
  "Gunslinger":     "#3730a3",
  "Horde Mother":   "#5b21b6",
  "Icicle":         "#4f46e5",
  "Marauder":       "#4338ca",
  "Pilgrim":        "#6d28d9",
  // Knights (orange family)
  "Anti Violence":  "#fca5a5",
  "Banker":         "#fb923c",
  "Camel":          "#f97316",
  "ElectroKnight":  "#ea580c",
  "Fish":           "#fed7aa",
  "Knightmare":     "#9a3412",
  "Piñata":         "#c2410c",
  // Pawns (slate/blue family)
  "Blueprint":      "#94a3b8",
  "Epee Pawn":      "#64748b",
  "Golden Pawn":    "#cbd5e1",
  "Hero Pawn":      "#475569",
  "Iron Pawn":      "#b0bec5",
  "Pawn w/ Knife":  "#78909c",
  "Shrike":         "#90a4ae",
  "War Automaton":  "#546e7a",
  "Warp Jumper":    "#334155",
};

// ─── Piece images ─────────────────────────────────────────────────────────────
const PIECE_IMGS = {
  "Rocketman": "/rocketman.webp",
  "Fission Reactor": "/fission.webp",
  "Phase Rook": "/phaserook.webp",
  "Sumo Rook": "/sumo.webp",
  "Aristocrat": "/aristorcrat.webp",
  "Basilisk": "/basilisk.webp",
  "Blade Runner": "/bladerunner.webp",
  "Bouncer": "/bouncer.webp",
  "Cardinal": "/cardinal.webp",
  "Dancer": "/dancer.webp",
  "Djinn": "/djinn.webp",
  "Horde Mother": "/hordenmother.webp",
  "Icicle": "/icicle.webp",
  "Marauder": "/maruader.webp",
  "Pilgrim": "/pilgrim.webp",
  "Gunslinger": "/gunslinger.webp",
  "Anti Violence": "/antiviolence.webp",
  "Banker": "/banker.webp",
  "Camel": "/camel.webp",
  "ElectroKnight": "/electroknight.webp",
  "Fish": "/fish.webp",
  "Piñata": "/pinata.webp",
  "Knightmare": "/knightmare.webp",
  "Blueprint": "/blueprint.webp",
  "Epee Pawn": "/epee.webp",
  "Golden Pawn": "/goldenpawn.webp",
  "Hero Pawn": "/heropawn.webp",
  "Iron Pawn": "/ironpawn.webp",
  "Pawn w/ Knife": "/pawnknife.webp",
  "Shrike": "/shrike.webp",
  "War Automaton": "/warauto.webp",
  "Warp Jumper": "/warpjumper.webp",
};

// ─── Piece metadata ───────────────────────────────────────────────────────────
const PIECE_TYPE = {
  "Rocketman": "King",
  "Fission Reactor": "Queen",
  "Phase Rook": "Rook", "Sumo Rook": "Rook",
  "Aristocrat": "Bishop", "Basilisk": "Bishop", "Blade Runner": "Bishop",
  "Bouncer": "Bishop", "Cardinal": "Bishop", "Dancer": "Bishop", "Djinn": "Bishop",
  "Gunslinger": "Bishop", "Horde Mother": "Bishop", "Icicle": "Bishop",
  "Marauder": "Bishop", "Pilgrim": "Bishop",
  "Anti Violence": "Knight", "Banker": "Knight", "Camel": "Knight",
  "ElectroKnight": "Knight", "Fish": "Knight", "Knightmare": "Knight", "Piñata": "Knight",
  "Blueprint": "Pawn", "Epee Pawn": "Pawn", "Golden Pawn": "Pawn", "Hero Pawn": "Pawn",
  "Iron Pawn": "Pawn", "Pawn w/ Knife": "Pawn", "Shrike": "Pawn",
  "War Automaton": "Pawn", "Warp Jumper": "Pawn",
};

const PIECE_BLURBS = {
  "Rocketman":       "Launch-day legend. Crowns the board on liftoff.",
  "Fission Reactor": "Board-splitting power. Goes critical in the midgame.",
  "Phase Rook":      "Slides through walls as if they weren't there.",
  "Sumo Rook":       "Heavy, slow, immovable once it sets its stance.",
  "Aristocrat":      "Polished diagonals, unbothered by pressure.",
  "Basilisk":        "Gaze-locked. Freezes lanes without moving.",
  "Blade Runner":    "Darts between squares on a drawn edge.",
  "Bouncer":         "Guards the door. Quietly decisive.",
  "Cardinal":        "Ceremony and steel in equal measure.",
  "Dancer":          "Light-footed skirmisher — a feint in every tempo.",
  "Djinn":           "Bends the diagonal. Grants wishes, rarely kind ones.",
  "Gunslinger":      "One shot, perfectly timed. That's the whole plan.",
  "Horde Mother":    "Nurtures a swarm. Breaks structure from the back rank.",
  "Icicle":          "Silent pressure. Snaps when you stop watching.",
  "Marauder":        "Opportunist. Thrives in open files and open chaos.",
  "Pilgrim":         "Long march, quiet faith, sudden arrival.",
  "Anti Violence":   "Disarms threats instead of meeting them head-on.",
  "Banker":          "Collector of debts. Every trade is logged.",
  "Camel":           "Ungainly stride, unexpected angle of attack.",
  "ElectroKnight":   "Hops with a crackle — defenders stutter on contact.",
  "Fish":            "Slips past structure through currents no one mapped.",
  "Knightmare":      "Wakes up deep in your lines. Bad dreams from here.",
  "Piñata":          "Looks fragile. Explodes on the last hit.",
  "Blueprint":       "Textbook pawn. Everything else builds off this frame.",
  "Epee Pawn":       "Clean parry, cleaner riposte.",
  "Golden Pawn":     "Promotes loud. Worth the wait.",
  "Hero Pawn":       "Steps into the lane every other pawn walked around.",
  "Iron Pawn":       "A wall of discipline. Refuses to break.",
  "Pawn w/ Knife":   "Ends the pretense. Pawns do what they have to.",
  "Shrike":          "Pins and impales — a pawn with predator instinct.",
  "War Automaton":   "Programmed march. Doesn't flinch, doesn't stop.",
  "Warp Jumper":     "Skips a rank when the geometry lets it. It usually does.",
};

// ─── Username map ─────────────────────────────────────────────────────────────
const USERNAMES = {
  "0x5206b4a8267366574b8b9ebabd7e005958adce59": "Wes",
  "0x8889bc01df9b009612e25003eba5d07678dc18ad": "anne-hathaway",
  "0x853db182b8783fa8250d96e0d38f95e457e5f3d6": "stancifka",
  "0x6daf8248218180aa67f96f422d42ecd6dba95fa9": "binn4896",
  "0x7c0272e543cb178070892a013ad22ff43d2a4531": "ottosuwen",
  "0xef756a6d8e89a80b3cbf5e9f99f7e69e939a45c7": "ignisunus",
  "0x5e6bbf2a1d89b18e1839846289cc9fd154792bd6": "kejsi",
  "0xc2cb3847e92cbc8c82f5f5be076b409dbe6db585": "axax",
  "0x6d140bd6c0eff25e3a628d95be7864aca6e86a58": "mong",
  "0x51fea81471515466bd1dd1fae05c4cad8370aac6": "nothingtosay",
  "0xf24551ef25f81eb78f5874336f7f2124691bf90c": "paulypaul",
  "0xb1929df3f0596c619b46b7f6e3b9298f6bd05aba": "ozymandias",
  "0x86268dca8d0a7ecca7043d17c2f1ba823ad9ad83": "touchme",
  "0x6880add29b5e84c543ff745856a0f3368e58f165": "jelanka",
  "0xa22ea1235ca466e7e1a9214612924c311779084d": "sov",
  "0x3dbe52cfb29f4872d2727efe10af9a5b9570d950": "adamscochran",
  "0x066e8f09254eeca14e3c247c287408b1ede3ad12": "rl05",
  "0xd999ad87f550bdea462873eec02c7a6abb7dbc59": "barinthus",
  "0xceb780385e065697669e33a07266303598d085fb": "usagi",
  "0xa16321dbdbc43d8e3cd9d60cb7a2174a033faabe": "neko",
  "0xb52ce37d238174f2f1c613b4c272f1c69b8dcecd": "christian",
  "0x2ae84e9dea45beba038dc9ffafc96efb59a6f793": "zhuangzhou",
  "0xb50b400a21aeba36b1212f5873049be193593b7e": "majorty",
  "0x5e20ef7cbde051161aafbb8906666f9a092fb23e": "elpicudo",
  "0x59969787018df380c3aa3f5811c7bde3c0742f53": "binbun",
  "0xb68b2a307181bf21a6e376dcd6c3db3bfc5cfa52": "meow37",
  "0x02f95d4f31a62dd754747e73689aae122fbe7682": "0xiolo",
  "0xbddcd5ba6c7f98a0b560cc827e78dbff13bdea23": "mastrophot",
  "0x29d0d53e211c4c46cd02832e27c8434851452406": "larryloves69",
  "0xa9e8529bbb2877ba2871eae5b4da0b886001b703": "outcraft",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function resolvePlayer(addr) {
  if (!addr) return { name: "—", isAddress: false };
  if (!addr.match(/^0x[0-9a-fA-F]{40,}$/)) return { name: addr, isAddress: false };
  const norm = normalizeAddress(addr);
  const known = USERNAMES[norm];
  if (known) return { name: known, isAddress: false };
  return { name: norm.slice(0, 6) + "…" + norm.slice(-4), isAddress: true, norm };
}

function formatChartDate(dateStr) {
  if (!dateStr) return dateStr;
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const d = dateStr.slice(0, 10).split("-");
  if (d.length < 3) return dateStr;
  return months[parseInt(d[1]) - 1] + " " + parseInt(d[2]);
}

function pivotRevenueSplitDaily(rows) {
  if (!rows?.length) return [];
  const map = {};
  rows.forEach(r => {
    const d = r.day?.slice(0, 10);
    if (!d) return;
    if (!map[d]) map[d] = { day: formatChartDate(d) };
    map[d][r.mint_method] = (map[d][r.mint_method] ?? 0) + Number(r.eth_revenue ?? 0);
  });
  return Object.values(map);
}

function pivotByType(rows, dateKey, typeKey, valueKey) {
  const types = [...new Set(rows.map(r => r[typeKey]).filter(Boolean))].sort();
  const map = {};
  rows.forEach(r => {
    const d = r[dateKey]?.slice(0, 10);
    if (!d) return;
    if (!map[d]) map[d] = { day: d };
    map[d][r[typeKey]] = (map[d][r[typeKey]] ?? 0) + (r[valueKey] ?? 0);
  });
  return {
    data: Object.values(map).sort((a, b) => a.day < b.day ? -1 : 1),
    types,
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function Skeleton({ w = "100%", h = 32, radius = 6 }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: radius,
      background: "rgba(157,108,255,0.06)",
      animation: "shimmer 1.5s ease-in-out infinite",
    }} />
  );
}

function TypeBadge({ type }) {
  const tc = TYPE_COLORS[type] ?? { bg: "#374151", text: "#e2e8f0" };
  return (
    <span style={{
      display: "inline-block", background: tc.bg, color: tc.text,
      fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 999,
      letterSpacing: "0.05em", whiteSpace: "nowrap",
      fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
    }}>
      {type}
    </span>
  );
}

const DarkTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--card-2, #1c1530)",
      border: "1px solid var(--line-2, #3a2d55)",
      borderRadius: 10, padding: "10px 14px",
      fontFamily: "var(--font-ui, 'Space Grotesk', sans-serif)",
      fontSize: 13, color: "var(--ink, #ece7ff)",
      boxShadow: "0 8px 32px rgba(0,0,0,.5)",
    }}>
      <div style={{ marginBottom: 6, color: "var(--muted, #7a6fa0)", fontSize: 11, fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)", letterSpacing: "1px" }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontWeight: 600, fontSize: 13 }}>
          {p.name}: {typeof p.value === "number" ? p.value.toLocaleString() : p.value}
        </div>
      ))}
    </div>
  );
};

function SectionHeader({ children }) {
  return (
    <div style={{
      fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
      fontSize: 11, letterSpacing: "2.5px", textTransform: "uppercase",
      color: "var(--muted, #7a6fa0)", margin: "0 0 12px",
    }}>
      {children}
    </div>
  );
}

function hexToRgba(hex, a) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function KpiTier({ label, muted, children, isMobile, cols }) {
  const kids = Array.isArray(children) ? children : [children];
  const desktopCols = cols ?? 3;
  return (
    <div>
      <div style={{
        fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
        fontSize: 11, letterSpacing: "2.5px", textTransform: "uppercase",
        color: "var(--muted, #7a6fa0)", marginBottom: 10,
      }}>{label}</div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : `repeat(${desktopCols}, 1fr)`, gap: 12 }}>
        {kids.map((child, i) => (
          <div key={i} style={isMobile && i === 0 ? { gridColumn: "1 / -1" } : {}}>
            {child}
          </div>
        ))}
      </div>
    </div>
  );
}

function KpiCard({ label, value, loading, accent = "#9d6cff", small, delta, deltaSuffix = "" }) {
  const deltaNum = Number(delta);
  const hasDelta = !loading && !small && delta != null && Number.isFinite(deltaNum);
  const isPos = deltaNum > 0;
  const isNeg = deltaNum < 0;
  const deltaColor = isPos ? "var(--green, #4cd694)" : isNeg ? "var(--red, #ff4d5e)" : "var(--muted, #7a6fa0)";
  const deltaStr = hasDelta
    ? `${isPos ? "+" : ""}${deltaNum >= 10 || deltaNum <= -10 ? Math.round(deltaNum).toLocaleString() : deltaNum.toFixed(2)}${deltaSuffix}`
    : null;
  return (
    <div style={{
      minWidth: 0,
      background: `linear-gradient(180deg, ${hexToRgba(accent, 0.18)}, var(--card, #140f20))`,
      border: `1px solid ${hexToRgba(accent, 0.3)}`,
      borderRadius: 16,
      padding: small ? "14px 18px" : "18px 20px",
      display: "flex", flexDirection: "column", gap: small ? 6 : 8,
      position: "relative", overflow: "hidden", minHeight: small ? 90 : 120,
    }}>
      <div style={{
        position: "absolute", inset: -1,
        background: `radial-gradient(200px 120px at 20% 80%, ${hexToRgba(accent, 0.18)}, transparent 70%)`,
        pointerEvents: "none",
      }} />
      <div style={{
        position: "relative",
        fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
        fontSize: 10, letterSpacing: "2px", textTransform: "uppercase",
        color: "var(--muted, #7a6fa0)",
      }}>
        {label}
      </div>
      {loading
        ? <Skeleton h={small ? 24 : 36} />
        : <div style={{
            position: "relative",
            fontSize: small ? 22 : 36, fontWeight: 700, color: accent,
            fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)", lineHeight: 1,
            letterSpacing: "-0.5px",
            textShadow: `0 0 24px ${hexToRgba(accent, 0.55)}`,
          }}>
            {value ?? "—"}
          </div>
      }
      {hasDelta && (
        <div style={{
          position: "relative",
          display: "flex", alignItems: "center", gap: 6,
          fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
          fontSize: 11, lineHeight: 1, letterSpacing: "0.5px",
        }}>
          <span style={{ color: deltaColor, fontWeight: 700 }}>
            {isPos ? "▲" : isNeg ? "▼" : "·"} {deltaStr}
          </span>
          <span style={{ color: "var(--muted-2, #4d4468)", fontSize: 10 }}>24H</span>
        </div>
      )}
    </div>
  );
}

function ChartCard({ title, loading, error, height = 200, children }) {
  return (
    <div style={{
      flex: "1 1 340px",
      background: "linear-gradient(180deg, rgba(28,21,48,.55), rgba(12,9,22,.85))",
      border: "1px solid var(--line, #2a2140)", borderRadius: 16,
      padding: "18px 20px 14px",
    }}>
      <div style={{
        fontFamily: "var(--font-ui, 'Space Grotesk', sans-serif)",
        fontWeight: 700, fontSize: 13, letterSpacing: "1.8px",
        textTransform: "uppercase", color: "var(--ink, #ece7ff)",
        marginBottom: 14,
      }}>{title}</div>
      {loading ? <Skeleton h={height} />
        : error ? <div style={{ color: "var(--red, #ff4d5e)", fontSize: 12 }}>{error}</div>
        : children}
    </div>
  );
}

// ─── Cohort retention heatmap ─────────────────────────────────────────────────
const MIN_COHORT_SIZE = 20;

function retentionCellColor(pct) {
  // Interpolate #0d0c1c (bg) → #818cf8 (indigo) by pct
  const t = Math.max(0, Math.min(1, pct));
  const r = Math.round(13  + (129 - 13)  * t);
  const g = Math.round(12  + (140 - 12)  * t);
  const b = Math.round(28  + (248 - 28)  * t);
  return `rgb(${r}, ${g}, ${b})`;
}

function CohortRetentionChart({ rows }) {
  if (!rows?.length) {
    return (
      <div style={{ color: "var(--muted, #7a6fa0)", fontSize: 12, fontFamily: "var(--font-ui, 'Space Grotesk', sans-serif)" }}>
        No cohort data available yet.
      </div>
    );
  }

  // Group flat rows into {cohort_week: {size, cells: {offset: pct}}}
  const byCohort = {};
  let maxOffset = 0;
  rows.forEach(r => {
    const key = r.cohort_week?.slice(0, 10);
    if (!key) return;
    if (!byCohort[key]) byCohort[key] = { cohort: key, size: r.cohort_size, cells: {} };
    byCohort[key].cells[r.week_offset] = r.retention_pct;
    if (r.week_offset > maxOffset) maxOffset = r.week_offset;
  });

  const cohorts = Object.values(byCohort).sort((a, b) => a.cohort < b.cohort ? -1 : 1);
  const offsets = Array.from({ length: maxOffset + 1 }, (_, i) => i);

  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{
        display: "inline-grid",
        gridTemplateColumns: `110px repeat(${maxOffset + 1}, 52px) 70px`,
        gap: 3,
        fontFamily: "Space Grotesk, sans-serif",
      }}>
        <div />
        {offsets.map(o => (
          <div key={`h-${o}`} style={{
            fontSize: 10, fontWeight: 700, color: "#64748b",
            textAlign: "center", padding: "4px 0", letterSpacing: "0.05em",
          }}>W{o}</div>
        ))}
        <div style={{
          fontSize: 10, fontWeight: 700, color: "#64748b",
          textAlign: "center", padding: "4px 0", letterSpacing: "0.05em",
        }}>PLAYERS</div>

        {cohorts.map(c => {
          const tooSmall = c.size < MIN_COHORT_SIZE;
          return (
            <Fragment key={c.cohort}>
              <div style={{
                fontSize: 11, color: "#94a3b8",
                padding: "0 8px", display: "flex", alignItems: "center",
              }}>
                {formatChartDate(c.cohort)}
              </div>
              {offsets.map(o => {
                const pct = c.cells[o];
                const hasData = pct != null;
                return (
                  <div key={o} style={{
                    background: !hasData ? "transparent"
                      : tooSmall ? "rgba(255,255,255,0.04)"
                      : retentionCellColor(pct),
                    color: !hasData ? "#334155"
                      : tooSmall ? "#64748b"
                      : pct > 0.45 ? "#0d0c1c" : "#e2e8f0",
                    fontSize: 11, fontWeight: 600,
                    textAlign: "center", padding: "8px 0",
                    borderRadius: 3,
                    border: hasData ? "none" : "1px dashed rgba(255,255,255,0.04)",
                  }}>
                    {hasData ? Math.round(pct * 100) + "%" : "—"}
                  </div>
                );
              })}
              <div style={{
                fontSize: 11, color: tooSmall ? "#475569" : "#64748b",
                textAlign: "center", padding: "8px 0",
              }}>
                {c.size}
              </div>
            </Fragment>
          );
        })}
      </div>
      <div style={{
        fontSize: 11, color: "#64748b", marginTop: 12, lineHeight: 1.5,
        fontFamily: "Space Grotesk, sans-serif",
      }}>
        <strong style={{ color: "#94a3b8" }}>Players</strong> = cohort size (first-mint in that week).
        <strong style={{ color: "#94a3b8" }}> Activity</strong> = any Transfer touch on the NFT contract (mints, burns, secondary).
        Cohorts under {MIN_COHORT_SIZE} players are greyed.
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function StatsPage({ isMobile }) {
  const [kpis, setKpis] = useState({});
  const [kpiLoading, setKpiLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const [pieceMarket, setPieceMarket] = useState([]);
  const [pieceMarketLoading, setPieceMarketLoading] = useState(true);
  const [pmSort, setPmSort] = useState({ col: "total_minted", dir: "desc" });
  const [pmFilter, setPmFilter] = useState("All");
  const [hoveredRow, setHoveredRow] = useState(null);

  const [dailyBurns, setDailyBurns] = useState([]);
  const [dailyBurnsLoading, setDailyBurnsLoading] = useState(true);

  const [newVsReturning, setNewVsReturning] = useState([]);
  const [newVsReturningLoading, setNewVsReturningLoading] = useState(true);

  const [revenueSplit, setRevenueSplit] = useState([]);
  const [revenueSplitLoading, setRevenueSplitLoading] = useState(true);

  const [whaleLeaderboard, setWhaleLeaderboard] = useState([]);
  const [whaleLoading, setWhaleLoading] = useState(true);

  const [supplyOverTime, setSupplyOverTime] = useState([]);
  const [supplyLoading, setSupplyLoading] = useState(true);

  const [mintsByType, setMintsByType] = useState({ data: [], types: [] });
  const [mintsByTypeLoading, setMintsByTypeLoading] = useState(true);

  const [cohortRetention, setCohortRetention] = useState([]);
  const [cohortRetentionLoading, setCohortRetentionLoading] = useState(true);

  const [revenueSplitDaily, setRevenueSplitDaily] = useState([]);
  const [revenueSplitDailyLoading, setRevenueSplitDailyLoading] = useState(true);

  const [rankedPlayers, setRankedPlayers] = useState(null);
  const [rankedPlayersLoading, setRankedPlayersLoading] = useState(true);
  const [games24h, setGames24h] = useState(null);
  const [activeNow, setActiveNow] = useState(null);
  const [playerSnapshots, setPlayerSnapshots] = useState([]);
  const [playerSnapshotsLoading, setPlayerSnapshotsLoading] = useState(true);

  const [errors, setErrors] = useState({});
  const setError = useCallback((key, err) => setErrors(prev => ({ ...prev, [key]: err.message })), []);
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(() => {
    Object.keys(localStorage)
      .filter(k => k.startsWith("dune_cache_"))
      .forEach(k => localStorage.removeItem(k));
    setErrors({});
    setKpiLoading(true);
    setPieceMarketLoading(true);
    setDailyBurnsLoading(true);
    setNewVsReturningLoading(true);
    setRevenueSplitLoading(true);
    setWhaleLoading(true);
    setSupplyLoading(true);
    setMintsByTypeLoading(true);
    setCohortRetentionLoading(true);
    setRevenueSplitDailyLoading(true);
    setRefreshing(true);
    setRefreshKey(k => k + 1);
    setTimeout(() => setRefreshing(false), 900);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("https://api.pixiechess.xyz/leaderboard?page=1");
        if (res.ok) {
          const json = await res.json();
          const s = json?.stats ?? json ?? {};
          const ranked = s.totalRankedPlayers ?? s.totalCount ?? json?.totalCount ?? null;
          const g24    = s.gamesToday ?? s.games24h ?? s.gamesLast24Hours ?? s.totalGames24h ?? null;
          const active = s.activeNow ?? s.activePlayers ?? s.onlinePlayers ?? null;
          setRankedPlayers(ranked);
          setGames24h(g24);
          setActiveNow(active);
          snapshotPlayerStats({ totalRankedPlayers: ranked, games24h: g24, activeNow: active });
        }
      } catch (_) {}
      finally { setRankedPlayersLoading(false); }
    })();
    getPlayerSnapshots().then(setPlayerSnapshots).catch(() => {}).finally(() => setPlayerSnapshotsLoading(false));
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [minted, burns, supply, eth, players] = await Promise.all([
          fetchDuneQuery(QUERIES.totalMinted),
          fetchDuneQuery(QUERIES.totalBurns),
          fetchDuneQuery(QUERIES.netSupply),
          fetchDuneQuery(QUERIES.totalEth),
          fetchDuneQuery(QUERIES.uniquePlayers),
        ]);
        setLastUpdated(minted.execution_time);
        setKpis({
          totalMinted:   minted.rows[0]?.total_minted,
          totalBurns:    burns.rows[0]?.total_burns,
          netSupply:     supply.rows[0]?.net_supply,
          totalEth:      eth.rows[0]?.total_eth_raised,
          uniquePlayers: players.rows[0]?.unique_players,
        });
      } catch (err) { setError("kpis", err); }
      finally { setKpiLoading(false); }
    })();
  }, [setError, refreshKey]);

  useEffect(() => {
    (async () => {
      try {
        const { rows } = await fetchDuneQuery(QUERIES.pieceMarket);
        setPieceMarket(rows);
      } catch (err) { setError("pieceMarket", err); }
      finally { setPieceMarketLoading(false); }
    })();
  }, [setError, refreshKey]);

  useEffect(() => {
    (async () => {
      try {
        const { rows } = await fetchDuneQuery(QUERIES.dailyBurns);
        setDailyBurns(rows.map(r => ({ ...r, day: formatChartDate(r.day) })));
      } catch (err) { setError("dailyBurns", err); }
      finally { setDailyBurnsLoading(false); }
    })();
  }, [setError, refreshKey]);

  useEffect(() => {
    (async () => {
      try {
        const { rows } = await fetchDuneQuery(QUERIES.newVsReturning);
        setNewVsReturning(rows.map(r => ({ ...r, day: formatChartDate(r.day) })));
      } catch (err) { setError("newVsReturning", err); }
      finally { setNewVsReturningLoading(false); }
    })();
  }, [setError, refreshKey]);

  useEffect(() => {
    (async () => {
      try {
        const { rows } = await fetchDuneQuery(QUERIES.revenueSplit);
        setRevenueSplit(rows);
      } catch (err) { setError("revenueSplit", err); }
      finally { setRevenueSplitLoading(false); }
    })();
  }, [setError, refreshKey]);

  useEffect(() => {
    (async () => {
      try {
        const { rows } = await fetchDuneQuery(QUERIES.whaleLeaderboard);
        setWhaleLeaderboard(rows);
      } catch (err) { setError("whaleLeaderboard", err); }
      finally { setWhaleLoading(false); }
    })();
  }, [setError, refreshKey]);

  useEffect(() => {
    (async () => {
      try {
        const { rows } = await fetchDuneQuery(QUERIES.supplyOverTime);
        setSupplyOverTime(rows.map(r => ({ ...r, day: formatChartDate(r.day) })));
      } catch (err) { setError("supplyOverTime", err); }
      finally { setSupplyLoading(false); }
    })();
  }, [setError, refreshKey]);

  useEffect(() => {
    (async () => {
      try {
        const { rows } = await fetchDuneQuery(QUERIES.dailyMintsByType);
        const pivoted = pivotByType(rows, "day", "piece_name", "daily_mints");
        setMintsByType({
          ...pivoted,
          data: pivoted.data.map(r => ({ ...r, day: formatChartDate(r.day) })),
        });
      } catch (err) { setError("mintsByType", err); }
      finally { setMintsByTypeLoading(false); }
    })();
  }, [setError, refreshKey]);

  useEffect(() => {
    if (!QUERIES.cohortRetention) { setCohortRetentionLoading(false); return; }
    (async () => {
      try {
        const { rows } = await fetchDuneQuery(QUERIES.cohortRetention);
        setCohortRetention(rows);
      } catch (err) { setError("cohortRetention", err); }
      finally { setCohortRetentionLoading(false); }
    })();
  }, [setError, refreshKey]);

  useEffect(() => {
    if (!QUERIES.revenueSplitDaily) { setRevenueSplitDailyLoading(false); return; }
    (async () => {
      try {
        const { rows } = await fetchDuneQuery(QUERIES.revenueSplitDaily);
        setRevenueSplitDaily(rows);
      } catch (err) { setError("revenueSplitDaily", err); }
      finally { setRevenueSplitDailyLoading(false); }
    })();
  }, [setError, refreshKey]);

  // ── Derived KPIs ──────────────────────────────────────────────────────────
  const burnRate = kpis.totalMinted > 0
    ? (kpis.totalBurns / kpis.totalMinted * 100).toFixed(1) + "%"
    : null;
  const avgEthPerMint = kpis.totalMinted > 0 && kpis.totalEth != null
    ? Number(kpis.totalEth / kpis.totalMinted).toFixed(4) + " Ξ"
    : null;
  const avgMintsPerPlayer = kpis.uniquePlayers > 0
    ? (kpis.totalMinted / kpis.uniquePlayers).toFixed(1)
    : null;

  // ── 24h deltas: use last *completed* day (skip today's partial row) ──
  const lastCompleted = supplyOverTime[supplyOverTime.length - 2];
  const deltaMinted = lastCompleted ? Number(lastCompleted.daily_minted ?? 0) : null;
  const deltaBurned = lastCompleted ? Number(lastCompleted.daily_burned ?? 0) : null;
  const deltaNet    = lastCompleted ? Number(lastCompleted.daily_minted ?? 0) - Number(lastCompleted.daily_burned ?? 0) : null;
  const lastRevDay = revenueSplitDaily.length ? revenueSplitDaily[revenueSplitDaily.length - 1].day?.slice(0, 10) : null;
  const deltaEth = lastRevDay
    ? revenueSplitDaily.filter(r => r.day?.slice(0, 10) === lastRevDay).reduce((s, r) => s + Number(r.eth_revenue ?? 0), 0)
    : null;
  const deltaNewMinters = newVsReturning.length ? Number(newVsReturning[newVsReturning.length - 1].new_minters ?? 0) : null;

  // ── Top pieces last 7 days (derived from mintsByType) ──────────────────
  const topPieces7d = (() => {
    const data = mintsByType.data;
    if (!data?.length) return [];
    const last7 = data.slice(-7);
    const totals = {};
    last7.forEach(row => {
      Object.keys(row).forEach(k => {
        if (k === "day") return;
        totals[k] = (totals[k] ?? 0) + (row[k] ?? 0);
      });
    });
    return Object.entries(totals)
      .map(([piece_name, count]) => ({ piece_name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  })();

  // ── Top Mints · Past 7 Days (up until 24h ago) ──────────────────────
  // Sum the last 7 completed days (drop today's partial row if present)
  // and compare to the 7 days before that for a week-over-week delta.
  const topMints7d = (() => {
    const data = mintsByType.data;
    if (!data?.length) return { rows: [], fromLabel: null, toLabel: null, stale: false };
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const todayUtc = new Date().toISOString().slice(0, 10);
    const [y, m, d] = todayUtc.split("-");
    const todayLabel = `${months[parseInt(m, 10) - 1]} ${parseInt(d, 10)}`;
    const completed = data[data.length - 1]?.day === todayLabel
      ? data.slice(0, -1)
      : data;
    if (completed.length === 0) return { rows: [], fromLabel: null, toLabel: null, stale: false };

    const last7 = completed.slice(-7);
    const prev7 = completed.slice(-14, -7);

    const sumByPiece = (rows) => {
      const totals = {};
      rows.forEach(r => Object.keys(r).forEach(k => {
        if (k === "day") return;
        totals[k] = (totals[k] ?? 0) + Number(r[k] ?? 0);
      }));
      return totals;
    };
    const curr = sumByPiece(last7);
    const prior = sumByPiece(prev7);

    const rows = Object.keys(curr)
      .map(name => ({ piece_name: name, count: curr[name], prior: prior[name] ?? 0 }))
      .filter(r => r.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const fromLabel = last7[0]?.day;
    const toLabel = last7[last7.length - 1]?.day;
    const lastMonthIdx = months.indexOf(toLabel?.split(" ")[0]);
    const lastDayNum = parseInt(toLabel?.split(" ")[1], 10);
    const todayMs = Date.parse(todayUtc + "T00:00:00Z");
    const lastMs = lastMonthIdx >= 0 && lastDayNum
      ? Date.UTC(parseInt(y, 10), lastMonthIdx, lastDayNum)
      : null;
    const stale = lastMs != null && (todayMs - lastMs) > 36 * 3600 * 1000;
    return { rows, fromLabel, toLabel, stale };
  })();

  // ── Piece Market ──────────────────────────────────────────────────────────
  const pieceTypes = ["All", ...Array.from(new Set(pieceMarket.map(r => r.piece_type).filter(Boolean))).sort()];
  const filteredMarket = pieceMarket
    .filter(r => pmFilter === "All" || r.piece_type === pmFilter)
    .sort((a, b) => {
      const va = a[pmSort.col] ?? 0, vb = b[pmSort.col] ?? 0;
      return pmSort.dir === "asc" ? va - vb : vb - va;
    });
  const maxTotalEth = Math.max(...filteredMarket.map(r => r.total_eth_spent ?? 0), 0.0001);

  function handleSort(col) {
    setPmSort(prev => prev.col === col
      ? { col, dir: prev.dir === "asc" ? "desc" : "asc" }
      : { col, dir: "desc" });
  }

  function SortIcon({ col }) {
    if (pmSort.col !== col) return <span style={{ opacity: 0.25, marginLeft: 4 }}>↕</span>;
    return <span style={{ marginLeft: 4, color: "#818cf8" }}>{pmSort.dir === "asc" ? "↑" : "↓"}</span>;
  }

  // ── Revenue split ─────────────────────────────────────────────────────────
  const REVENUE_COLORS = { Pack: "#818cf8", VRGDA: "#34d399", pack: "#818cf8", vrgda: "#34d399" };
  const getRevenueColor = name => REVENUE_COLORS[name] ?? REVENUE_COLORS[name?.toLowerCase()] ?? "#64748b";

  // ── Whale rank badges ──────────────────────────────────────────────────────
  const MEDALS = { 1: "🥇", 2: "🥈", 3: "🥉" };

  // ── Shared styles ─────────────────────────────────────────────────────────
  const thStyle = (sortable) => ({
    padding: "10px 12px", textAlign: "left", fontSize: 10, fontWeight: 700,
    color: "var(--muted, #7a6fa0)", letterSpacing: "1.5px", textTransform: "uppercase",
    borderBottom: "1px solid var(--line, #2a2140)",
    cursor: sortable ? "pointer" : "default",
    whiteSpace: "nowrap", userSelect: "none",
    fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
  });
  const tdStyle = {
    padding: "10px 12px", fontSize: 13, color: "var(--ink, #ece7ff)",
    borderBottom: "1px solid var(--line, #2a2140)",
    fontFamily: "Space Grotesk, sans-serif", whiteSpace: "nowrap",
  };
  const tableStyle = { width: "100%", borderCollapse: "collapse", fontSize: 13 };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "4px 0 60px" }}>
      <style>{`
        @keyframes shimmer { 0%,100%{opacity:1}50%{opacity:0.4} }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.35} }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Toolbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24, gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)", fontSize: 10, letterSpacing: "2.4px", textTransform: "uppercase", color: "var(--muted, #7a6fa0)", marginBottom: 8 }}>
            Pixie · On-chain
          </div>
          <h1 style={{ fontFamily: "var(--font-display, 'Cinzel', serif)", fontWeight: 800, fontSize: 30, letterSpacing: "1px", margin: 0, color: "var(--ink, #ece7ff)", textShadow: "0 0 20px rgba(157,108,255,.3)" }}>
            Network Stats
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {lastUpdated && (
            <span style={{ fontSize: 11, color: "var(--muted, #7a6fa0)", fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)", letterSpacing: "0.5px" }}>
              {formatTimeAgo(lastUpdated)}
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              padding: "7px 14px", borderRadius: 10,
              border: "1px solid var(--line-2, #3a2d55)",
              background: "rgba(28,21,48,.6)", color: "var(--ink, #ece7ff)",
              fontSize: 12, fontWeight: 600,
              cursor: refreshing ? "default" : "pointer",
              fontFamily: "var(--font-ui, 'Space Grotesk', sans-serif)",
              transition: "border-color .15s",
              opacity: refreshing ? 0.7 : 1,
              display: "inline-flex", alignItems: "center", gap: 6,
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "var(--purple, #9d6cff)"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "var(--line-2, #3a2d55)"}
          >
            <span style={{ display: "inline-block", animation: refreshing ? "spin 0.8s linear infinite" : "none" }}>↻</span>
            {refreshing ? "Refreshing…" : "Refresh data"}
          </button>
        </div>
      </div>

      {/* ── KPI grid: Supply / Demand / Ratios ───────────────────────── */}
      <div style={{ marginBottom: 36, display: "flex", flexDirection: "column", gap: 18 }}>
        <KpiTier label="Supply" isMobile={isMobile}>
          <KpiCard label="Total Minted"    value={kpis.totalMinted?.toLocaleString()}  loading={kpiLoading} accent="#818cf8" delta={deltaMinted} />
          <KpiCard label="Total Burned"    value={kpis.totalBurns?.toLocaleString()}   loading={kpiLoading} accent="#ef4444" delta={deltaBurned} />
          <KpiCard label="Net Supply"      value={kpis.netSupply?.toLocaleString()}    loading={kpiLoading} accent="#34d399" delta={deltaNet} />
        </KpiTier>
        <KpiTier label="Demand" isMobile={isMobile} cols={4}>
          <KpiCard label="ETH Spent"       value={kpis.totalEth != null ? Number(kpis.totalEth).toFixed(2) + " Ξ" : undefined} loading={kpiLoading} accent="#fbbf24" delta={deltaEth} deltaSuffix=" Ξ" />
          <KpiCard label="Unique Minters"  value={kpis.uniquePlayers?.toLocaleString()} loading={kpiLoading} accent="#f472b6" delta={deltaNewMinters} />
          <KpiCard label="Ranked Players"  value={rankedPlayers?.toLocaleString()} loading={rankedPlayersLoading} accent="#38bdf8" />
          <KpiCard label="Games (24h)"     value={games24h?.toLocaleString()}     loading={rankedPlayersLoading} accent="#34d399" />
        </KpiTier>
        <KpiTier label="Ratios" muted isMobile={isMobile}>
          <KpiCard label="Burn Rate"          value={burnRate}          loading={kpiLoading} accent="#f87171" small />
          <KpiCard label="Avg ETH / Mint"     value={avgEthPerMint}     loading={kpiLoading} accent="#fcd34d" small />
          <KpiCard label="Avg Mints / Minter" value={avgMintsPerPlayer} loading={kpiLoading} accent="#a78bfa" small />
        </KpiTier>
      </div>

      {/* ── Net Supply Over Time ───────────────────────────────────────── */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ background: "linear-gradient(180deg, rgba(28,21,48,.55), rgba(12,9,22,.85))", border: "1px solid var(--line, #2a2140)", borderRadius: 16, padding: "18px 20px 14px" }}>
        <div style={{ fontFamily: "var(--font-ui, 'Space Grotesk', sans-serif)", fontWeight: 700, fontSize: 13, letterSpacing: "1.8px", textTransform: "uppercase", color: "var(--ink, #ece7ff)", marginBottom: 14 }}>Net Supply Over Time</div>
          {supplyLoading ? <Skeleton h={220} /> : errors.supplyOverTime
            ? <div style={{ color: "#ef4444", fontSize: 12 }}>{errors.supplyOverTime}</div>
            : <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={supplyOverTime} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="supplyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="mintedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34d399" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#34d399" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="burnedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f87171" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f87171" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fill: "#64748b", fontSize: 11, fontFamily: "Space Grotesk" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 11, fontFamily: "Space Grotesk" }} tickLine={false} axisLine={false} />
                  <Tooltip content={<DarkTooltip />} cursor={{ stroke: "rgba(255,255,255,0.1)" }} />
                  <Legend wrapperStyle={{ fontSize: 12, fontFamily: "Space Grotesk", color: "#94a3b8", paddingTop: 8 }} />
                  <Area type="monotone" dataKey="cumulative_minted" name="Total Minted" stroke="#34d399" strokeWidth={2} fill="url(#mintedGrad)" dot={false} />
                  <Area type="monotone" dataKey="net_supply" name="Net Supply" stroke="#818cf8" strokeWidth={2} fill="url(#supplyGrad)" dot={false} />
                  <Area type="monotone" dataKey="cumulative_burned" name="Burnt" stroke="#f87171" strokeWidth={2} fill="url(#burnedGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
          }
        </div>
      </div>

      {/* ── Player Growth ─────────────────────────────────────────────── */}
      {(playerSnapshotsLoading || playerSnapshots.length > 0) && (
        <div style={{ marginBottom: 40 }}>
          <SectionHeader>Player Growth</SectionHeader>
          <ChartCard title="Ranked Players Over Time" loading={playerSnapshotsLoading}>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={playerSnapshots} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <filter id="playerGlow">
                    <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#38bdf8" floodOpacity="0.8" />
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="snapped_at" tick={{ fill: "#64748b", fontSize: 11, fontFamily: "JetBrains Mono, monospace" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 11, fontFamily: "JetBrains Mono, monospace" }} tickLine={false} axisLine={false} />
                <Tooltip content={<DarkTooltip />} />
                <Line type="monotone" dataKey="total_ranked_players" name="Ranked Players" stroke="#38bdf8" strokeWidth={2} dot={false} style={{ filter: "drop-shadow(0 0 6px #38bdf8)" }} />
                {playerSnapshots.some(r => r.games_24h != null) && (
                  <Line type="monotone" dataKey="games_24h" name="Games (24h)" stroke="#34d399" strokeWidth={2} dot={false} style={{ filter: "drop-shadow(0 0 6px #34d399)" }} />
                )}
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {/* ── Charts row: Burns + New vs Returning ─────────────────────── */}
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 40 }}>
        <ChartCard title="Daily Burns" loading={dailyBurnsLoading} error={errors.dailyBurns}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dailyBurns} margin={{ top: 0, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="burnsBarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#a78bfa" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.35} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: "#64748b", fontSize: 11, fontFamily: "Space Grotesk" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11, fontFamily: "Space Grotesk" }} tickLine={false} axisLine={false} />
              <Tooltip content={<DarkTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
              <Bar dataKey="daily_burns" name="Burns" fill="url(#burnsBarGrad)" stroke="#a78bfa" strokeWidth={1} radius={[3, 3, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="New vs Returning Minters" loading={newVsReturningLoading} error={errors.newVsReturning}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={newVsReturning} margin={{ top: 0, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="newBarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#6ee7b7" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#34d399" stopOpacity={0.35} />
                </linearGradient>
                <linearGradient id="returningBarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#a5b4fc" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#818cf8" stopOpacity={0.35} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: "#64748b", fontSize: 11, fontFamily: "Space Grotesk" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11, fontFamily: "Space Grotesk" }} tickLine={false} axisLine={false} />
              <Tooltip content={<DarkTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
              <Legend wrapperStyle={{ fontSize: 12, fontFamily: "Space Grotesk", color: "#94a3b8", paddingTop: 8 }} />
              <Bar dataKey="new_minters" name="New" stackId="a" fill="url(#newBarGrad)" stroke="#6ee7b7" strokeWidth={1} maxBarSize={32} />
              <Bar dataKey="returning_minters" name="Returning" stackId="a" fill="url(#returningBarGrad)" stroke="#a5b4fc" strokeWidth={1} radius={[3, 3, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── Cohort Retention + Revenue Split side by side ─────────────── */}
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 40, alignItems: "stretch" }}>
        <div style={{ flex: "1 1 420px", minWidth: 0, display: "flex", flexDirection: "column" }}>
          <SectionHeader>Cohort Retention</SectionHeader>
          <div style={{
            background: "var(--card, #140f20)", border: "1px solid var(--line, #2a2140)",
            borderRadius: 12, padding: "24px 20px", flex: 1, minHeight: 320,
            display: "flex", flexDirection: "column", justifyContent: "center",
          }}>
            {!QUERIES.cohortRetention
              ? <div style={{ fontSize: 12, color: "#64748b", fontFamily: "Space Grotesk, sans-serif" }}>
                  Create the Dune query from <code style={{ color: "#94a3b8" }}>cohort_retention.sql</code> and paste its ID into <code style={{ color: "#94a3b8" }}>QUERIES.cohortRetention</code>.
                </div>
              : cohortRetentionLoading
                ? <Skeleton h={240} />
                : errors.cohortRetention
                  ? <div style={{ color: "#ef4444", fontSize: 12 }}>{errors.cohortRetention}</div>
                  : <CohortRetentionChart rows={cohortRetention} />
            }
          </div>
        </div>

        <div style={{ flex: "1 1 420px", minWidth: 0, display: "flex", flexDirection: "column" }}>
          <SectionHeader>Revenue Split</SectionHeader>
          <div style={{ background: "var(--card, #140f20)", border: "1px solid var(--line, #2a2140)", borderRadius: 12, padding: "24px 20px", flex: 1, minHeight: 320, display: "flex", flexDirection: "column", gap: 16 }}>
            {revenueSplitLoading ? <Skeleton h={260} />
              : errors.revenueSplit ? <div style={{ color: "#ef4444", fontSize: 12 }}>{errors.revenueSplit}</div>
              : <>
                  <div style={{ flex: 1, minHeight: 180 }}>
                    {!QUERIES.revenueSplitDaily
                      ? <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", fontSize: 12, fontFamily: "Space Grotesk, sans-serif", textAlign: "center", padding: "0 16px" }}>
                          Daily split chart: create Dune query from <code style={{ color: "#94a3b8", margin: "0 4px" }}>daily_revenue_by_method.sql</code> and set <code style={{ color: "#94a3b8", marginLeft: 4 }}>QUERIES.revenueSplitDaily</code>.
                        </div>
                      : revenueSplitDailyLoading ? <Skeleton h={180} />
                      : errors.revenueSplitDaily ? <div style={{ color: "#ef4444", fontSize: 12 }}>{errors.revenueSplitDaily}</div>
                      : <ResponsiveContainer width="100%" height={200}>
                          <AreaChart data={pivotRevenueSplitDaily(revenueSplitDaily)} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                            <defs>
                              <linearGradient id="packGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={getRevenueColor("Pack")} stopOpacity={0.55} />
                                <stop offset="100%" stopColor={getRevenueColor("Pack")} stopOpacity={0.05} />
                              </linearGradient>
                              <linearGradient id="vrgdaGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={getRevenueColor("VRGDA")} stopOpacity={0.55} />
                                <stop offset="100%" stopColor={getRevenueColor("VRGDA")} stopOpacity={0.05} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis dataKey="day" tick={{ fill: "#64748b", fontSize: 11, fontFamily: "Space Grotesk" }} tickLine={false} axisLine={false} />
                            <YAxis tick={{ fill: "#64748b", fontSize: 11, fontFamily: "Space Grotesk" }} tickLine={false} axisLine={false} tickFormatter={v => v.toFixed(1)} />
                            <Tooltip content={<DarkTooltip />} cursor={{ stroke: "rgba(255,255,255,0.1)" }} />
                            <Area type="monotone" dataKey="Pack"  name="Pack"  stackId="1" stroke={getRevenueColor("Pack")}  strokeWidth={2} fill="url(#packGrad)"  dot={false} />
                            <Area type="monotone" dataKey="VRGDA" name="VRGDA" stackId="1" stroke={getRevenueColor("VRGDA")} strokeWidth={2} fill="url(#vrgdaGrad)" dot={false} />
                          </AreaChart>
                        </ResponsiveContainer>
                    }
                  </div>

                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    {revenueSplit.map((row, i) => (
                      <div key={i} style={{ flex: "1 1 140px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "12px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                          <div style={{ width: 10, height: 10, borderRadius: 2, background: getRevenueColor(row.mint_method) }} />
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", fontFamily: "Space Grotesk", letterSpacing: "0.04em", textTransform: "uppercase" }}>{row.mint_method}</div>
                          <div style={{ marginLeft: "auto", fontSize: 12, color: getRevenueColor(row.mint_method), fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)", fontWeight: 700 }}>
                            {Number(row.pct_of_total ?? 0).toFixed(1)}%
                          </div>
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: "var(--ink, #ece7ff)", fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)" }}>
                          {Number(row.total_eth ?? 0).toFixed(2)} Ξ
                        </div>
                        <div style={{ fontSize: 11, color: "#64748b", fontFamily: "Space Grotesk", marginTop: 2 }}>
                          {row.transactions?.toLocaleString()} txns
                        </div>
                      </div>
                    ))}
                  </div>
                </>
            }
          </div>
        </div>
      </div>

      {/* ── Top Mints · Last Full Day ─────────────────────────────────── */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap", marginBottom: 12 }}>
          <div style={{
            fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
            fontSize: 11, letterSpacing: "2.5px", textTransform: "uppercase",
            color: "var(--muted, #7a6fa0)",
          }}>
            Top Mints · Past 7 Days {topMints7d.fromLabel && topMints7d.toLabel ? `· ${topMints7d.fromLabel} – ${topMints7d.toLabel} UTC` : ""}
          </div>
          {topMints7d.stale && (
            <div style={{
              fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
              fontSize: 10, letterSpacing: "1px",
              color: "var(--yellow, #ffd04d)",
              padding: "3px 8px", borderRadius: 999,
              border: "1px solid rgba(255,208,77,0.35)",
              background: "rgba(255,208,77,0.06)",
            }}>
              Data gap — Dune query not returning recent days
            </div>
          )}
          <div style={{
            marginLeft: "auto",
            display: "flex", gap: 12, flexWrap: "wrap",
            fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
            fontSize: 10, letterSpacing: "1.5px", textTransform: "uppercase",
            color: "var(--muted, #7a6fa0)",
          }}>
            {Object.entries(TYPE_COLORS).map(([type, c]) => (
              <span key={type} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: 999, background: c.bg, display: "inline-block" }} />
                {type}
              </span>
            ))}
          </div>
        </div>

        {mintsByTypeLoading ? (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(5, 1fr)", gap: 16 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{
                background: "var(--card, #140f20)", border: "1px solid var(--line, #2a2140)",
                borderRadius: 16, padding: 14, minHeight: 320,
              }}>
                <Skeleton h={180} radius={12} />
                <div style={{ marginTop: 12 }}><Skeleton h={14} w={120} /></div>
                <div style={{ marginTop: 8 }}><Skeleton h={22} w={80} /></div>
              </div>
            ))}
          </div>
        ) : topMints7d.rows.length === 0 ? (
          <div style={{
            background: "var(--card, #140f20)", border: "1px solid var(--line, #2a2140)",
            borderRadius: 16, padding: "28px 20px",
            fontFamily: "var(--font-ui, 'Space Grotesk', sans-serif)",
            fontSize: 13, color: "var(--muted, #7a6fa0)", textAlign: "center",
          }}>
            No mints recorded in the last 7 days yet.
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(5, 1fr)",
            gap: 16,
          }}>
            {topMints7d.rows.map((row, i) => {
              const type = PIECE_TYPE[row.piece_name] ?? "Pawn";
              const tc = TYPE_COLORS[type] ?? { bg: "var(--muted, #7a6fa0)" };
              const accent = tc.bg;
              const img = PIECE_IMGS[row.piece_name];
              const blurb = PIECE_BLURBS[row.piece_name];
              const market = pieceMarket.find(m => m.piece_name === row.piece_name);
              const supply = market
                ? Math.max(0, Number(market.total_minted ?? 0) - Number(market.total_burns ?? 0))
                : null;
              return (
                <div key={row.piece_name} style={{
                  position: "relative",
                  background: `linear-gradient(180deg, ${hexToRgba(accent, 0.14)} 0%, var(--card, #140f20) 55%)`,
                  border: `1px solid ${hexToRgba(accent, 0.28)}`,
                  borderRadius: 16, padding: 14,
                  display: "flex", flexDirection: "column", gap: 10,
                  gridColumn: isMobile && i === 0 ? "1 / -1" : undefined,
                }}>
                  <div style={{
                    position: "absolute", top: 10, right: 12,
                    width: 8, height: 8, borderRadius: 999, background: accent,
                    boxShadow: `0 0 10px ${hexToRgba(accent, 0.7)}`,
                  }} />
                  <div style={{
                    position: "relative",
                    height: isMobile && i === 0 ? 220 : 160,
                    borderRadius: 12, overflow: "hidden",
                    background: `radial-gradient(circle at 50% 60%, ${hexToRgba(accent, 0.18)}, transparent 70%)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {img && (
                      <img src={img} alt={row.piece_name} style={{
                        maxWidth: "100%", maxHeight: "100%", objectFit: "contain",
                        filter: `drop-shadow(0 6px 20px ${hexToRgba(accent, 0.35)})`,
                      }} />
                    )}
                    <div style={{
                      position: "absolute", top: 8, left: 10,
                      fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                      fontSize: 11, fontWeight: 700, letterSpacing: "1px",
                      color: "var(--muted, #7a6fa0)",
                    }}>#{i + 1}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <div style={{
                      fontFamily: "var(--font-ui, 'Space Grotesk', sans-serif)",
                      fontWeight: 700, fontSize: 14, color: "var(--ink, #ece7ff)",
                      lineHeight: 1.2,
                    }}>
                      {row.piece_name}
                    </div>
                    <TypeBadge type={type} />
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <div style={{
                      fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                      fontSize: 24, fontWeight: 700, color: accent, lineHeight: 1,
                      textShadow: `0 0 18px ${hexToRgba(accent, 0.5)}`,
                    }}>
                      {row.count.toLocaleString()}
                    </div>
                    <div style={{
                      fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                      fontSize: 10, letterSpacing: "1.5px", textTransform: "uppercase",
                      color: "var(--muted-2, #4d4468)",
                    }}>
                      7d mints
                    </div>
                    {supply != null && (
                      <span style={{
                        marginLeft: "auto",
                        display: "inline-flex", alignItems: "baseline", gap: 6,
                        fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                      }}>
                        <span style={{
                          fontSize: 10, letterSpacing: "1.5px", textTransform: "uppercase",
                          color: "var(--muted-2, #4d4468)",
                        }}>
                          supply
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink, #ece7ff)" }}>
                          {supply.toLocaleString()}
                        </span>
                      </span>
                    )}
                  </div>
                  {blurb && (
                    <div style={{
                      fontFamily: "var(--font-ui, 'Space Grotesk', sans-serif)",
                      fontSize: 12, fontStyle: "italic",
                      color: "var(--muted, #7a6fa0)", lineHeight: 1.4,
                      display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}>
                      {blurb}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Piece Market Overview ──────────────────────────────────────── */}
      <div style={{ marginBottom: 40 }}>
        <SectionHeader>Piece Market Overview</SectionHeader>
        <div style={{
          display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 14,
          fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
          fontSize: 10, letterSpacing: "1.5px", textTransform: "uppercase",
          color: "var(--muted, #7a6fa0)",
        }}>
          {Object.entries(TYPE_COLORS).map(([type, c]) => (
            <span key={type} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: c.bg, display: "inline-block" }} />
              {type}
            </span>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          {pieceTypes.map(t => (
            <button key={t} onClick={() => setPmFilter(t)} style={{
              padding: "5px 14px", borderRadius: 6, border: "1px solid",
              borderColor: pmFilter === t ? "var(--purple, #9d6cff)" : "var(--line-2, #3a2d55)",
              background: pmFilter === t ? "rgba(157,108,255,0.15)" : "transparent",
              color: pmFilter === t ? "var(--purple, #9d6cff)" : "var(--muted, #7a6fa0)",
              fontSize: 12, fontWeight: 600, cursor: "pointer",
              fontFamily: "Space Grotesk, sans-serif", transition: "all 0.15s",
            }}>
              {t}
            </button>
          ))}
        </div>

        <div style={{ background: "var(--card, #140f20)", border: "1px solid var(--line, #2a2140)", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle(false)}>Piece</th>
                  <th style={thStyle(false)}>Type</th>
                  <th style={thStyle(true)} onClick={() => handleSort("total_minted")}>Minted<SortIcon col="total_minted" /></th>
                  <th style={thStyle(true)} onClick={() => handleSort("auction_mints")}>Auction<SortIcon col="auction_mints" /></th>
                  <th style={thStyle(true)} onClick={() => handleSort("pack_mints")}>Pack<SortIcon col="pack_mints" /></th>
                  <th style={thStyle(true)} onClick={() => handleSort("total_burns")}>Burns<SortIcon col="total_burns" /></th>
                  <th style={thStyle(true)} onClick={() => handleSort("low_eth")}>Low Ξ<SortIcon col="low_eth" /></th>
                  <th style={thStyle(true)} onClick={() => handleSort("high_eth")}>High Ξ<SortIcon col="high_eth" /></th>
                  <th style={thStyle(true)} onClick={() => handleSort("avg_eth")}>Avg Ξ<SortIcon col="avg_eth" /></th>
                  <th style={thStyle(true)} onClick={() => handleSort("total_eth_spent")}>Total Ξ<SortIcon col="total_eth_spent" /></th>
                </tr>
              </thead>
              <tbody>
                {pieceMarketLoading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i}>{Array.from({ length: 10 }).map((_, j) => <td key={j} style={tdStyle}><Skeleton h={16} /></td>)}</tr>
                    ))
                  : filteredMarket.map((row, i) => (
                      <tr
                        key={i}
                        onMouseEnter={() => setHoveredRow(i)}
                        onMouseLeave={() => setHoveredRow(null)}
                        style={{
                          background: hoveredRow === i
                            ? "rgba(129,140,248,0.08)"
                            : i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)",
                          transition: "background 0.1s",
                        }}
                      >
                        <td style={{ ...tdStyle, fontWeight: 600 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {PIECE_IMGS[row.piece_name] && (
                              <img
                                src={PIECE_IMGS[row.piece_name]}
                                alt={row.piece_name}
                                style={{ width: 28, height: 28, objectFit: "contain", flexShrink: 0 }}
                              />
                            )}
                            {row.piece_name}
                          </div>
                        </td>
                        <td style={tdStyle}><TypeBadge type={row.piece_type} /></td>
                        <td style={tdStyle}>{row.total_minted?.toLocaleString() ?? "—"}</td>
                        <td style={tdStyle}>{row.auction_mints?.toLocaleString() ?? "—"}</td>
                        <td style={tdStyle}>{row.pack_mints?.toLocaleString() ?? "—"}</td>
                        <td style={tdStyle}>{row.total_burns?.toLocaleString() ?? "—"}</td>
                        <td style={tdStyle}>{row.low_eth != null ? Number(row.low_eth).toFixed(4) : "—"}</td>
                        <td style={tdStyle}>{row.high_eth != null ? Number(row.high_eth).toFixed(4) : "—"}</td>
                        <td style={tdStyle}>{row.avg_eth != null ? Number(row.avg_eth).toFixed(4) : "—"}</td>
                        <td style={tdStyle}>
                          <div style={{ position: "relative", minWidth: 70 }}>
                            <div style={{
                              position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)",
                              height: "70%", width: `${((row.total_eth_spent ?? 0) / maxTotalEth) * 100}%`,
                              background: "rgba(129,140,248,0.2)", borderRadius: 3,
                            }} />
                            <span style={{ position: "relative", zIndex: 1 }}>
                              {row.total_eth_spent != null ? Number(row.total_eth_spent).toFixed(3) : "—"}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                }
              </tbody>
            </table>
          </div>
        </div>
        {errors.pieceMarket && <div style={{ color: "#ef4444", fontSize: 12, marginTop: 8 }}>{errors.pieceMarket}</div>}
      </div>

      {/* ── Whale Leaderboard ──────────────────────────────────────────── */}
      <div style={{ marginBottom: 40 }}>
        <SectionHeader>Whale Leaderboard</SectionHeader>
        <div style={{ background: "var(--card, #140f20)", border: "1px solid var(--line, #2a2140)", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle(false)}>#</th>
                  <th style={thStyle(false)}>Player</th>
                  <th style={thStyle(true)}>Held</th>
                  <th style={thStyle(true)}>Minted</th>
                  <th style={thStyle(true)}>Secondary</th>
                  <th style={thStyle(true)}>Burns</th>
                  <th style={thStyle(true)}>Sells</th>
                  <th style={thStyle(false)}>First Active</th>
                  <th style={thStyle(false)}>Last Active</th>
                </tr>
              </thead>
              <tbody>
                {whaleLoading
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i}>{Array.from({ length: 9 }).map((_, j) => <td key={j} style={tdStyle}><Skeleton h={16} /></td>)}</tr>
                    ))
                  : whaleLeaderboard.map((row, i) => {
                      const { name, isAddress, norm } = resolvePlayer(row.player);
                      return (
                        <tr
                          key={i}
                          onMouseEnter={() => setHoveredRow(`whale-${i}`)}
                          onMouseLeave={() => setHoveredRow(null)}
                          style={{
                            background: hoveredRow === `whale-${i}`
                              ? "rgba(129,140,248,0.08)"
                              : i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)",
                            transition: "background 0.1s",
                          }}
                        >
                          <td style={{ ...tdStyle, width: 40, textAlign: "center" }}>
                            {MEDALS[i + 1]
                              ? <span style={{ fontSize: 18 }}>{MEDALS[i + 1]}</span>
                              : <span style={{ color: "#64748b" }}>{i + 1}</span>}
                          </td>
                          <td style={{ ...tdStyle, fontWeight: 600 }}>
                            {isAddress
                              ? <a
                                  href={`https://basescan.org/address/${norm}`}
                                  target="_blank" rel="noopener noreferrer"
                                  style={{ color: "#c084fc", textDecoration: "none", fontFamily: "monospace", fontSize: 12 }}
                                  onMouseEnter={e => e.target.style.textDecoration = "underline"}
                                  onMouseLeave={e => e.target.style.textDecoration = "none"}
                                >
                                  {name}
                                </a>
                              : <span style={{ color: "#c084fc" }}>{name}</span>
                            }
                          </td>
                          <td style={{ ...tdStyle, fontWeight: 700 }}>{row.pieces_held?.toLocaleString() ?? "—"}</td>
                          <td style={tdStyle}>{row.total_mints?.toLocaleString() ?? "—"}</td>
                          <td style={tdStyle}>{row.secondary_purchases > 0 ? row.secondary_purchases.toLocaleString() : <span style={{ color: "#334155" }}>—</span>}</td>
                          <td style={tdStyle}>{row.burns > 0 ? <span style={{ color: "#f87171" }}>{row.burns.toLocaleString()}</span> : <span style={{ color: "#334155" }}>—</span>}</td>
                          <td style={tdStyle}>{row.sells > 0 ? row.sells.toLocaleString() : <span style={{ color: "#334155" }}>—</span>}</td>
                          <td style={{ ...tdStyle, color: "#64748b", fontSize: 12 }}>{formatDate(row.first_mint)}</td>
                          <td style={{ ...tdStyle, color: "#64748b", fontSize: 12 }}>{formatDate(row.last_mint)}</td>
                        </tr>
                      );
                    })
                }
              </tbody>
            </table>
          </div>
        </div>
        {errors.whaleLeaderboard && <div style={{ color: "#ef4444", fontSize: 12, marginTop: 8 }}>{errors.whaleLeaderboard}</div>}
      </div>
    </div>
  );
}
