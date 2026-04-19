import { useState, useRef, useCallback } from "react";

const TIERS = [
  { id: "S", label: "God-tier", color: "#dc2626", bg: "rgba(220,38,38,0.12)", border: "rgba(220,38,38,0.35)" },
  { id: "A", label: "Dominant", color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.35)" },
  { id: "B", label: "Strong", color: "#22c55e", bg: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.35)" },
  { id: "C", label: "Decent", color: "#3b82f6", bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.35)" },
  { id: "D", label: "Skip it", color: "#8b5cf6", bg: "rgba(139,92,246,0.12)", border: "rgba(139,92,246,0.35)" },
];

const PIECES = [
  { id: "rocketman", name: "Rocketman", type: "king", emoji: "♚" },
  { id: "fission-reactor", name: "Fission Reactor", type: "queen", emoji: "♛" },
  { id: "phase-rook", name: "Phase Rook", type: "rook", emoji: "♜" },
  { id: "sumo-rook", name: "Sumo Rook", type: "rook", emoji: "♜" },
  { id: "aristocrat", name: "Aristocrat", type: "bishop", emoji: "♝" },
  { id: "basilisk", name: "Basilisk", type: "bishop", emoji: "♝" },
  { id: "blade-runner", name: "Blade Runner", type: "bishop", emoji: "♝" },
  { id: "bouncer", name: "Bouncer", type: "bishop", emoji: "♝" },
  { id: "cardinal", name: "Cardinal", type: "bishop", emoji: "♝" },
  { id: "dancer", name: "Dancer", type: "bishop", emoji: "♝" },
  { id: "djinn", name: "Djinn", type: "bishop", emoji: "♝" },
  { id: "horde-mother", name: "Horde Mother", type: "bishop", emoji: "♝" },
  { id: "icicle", name: "Icicle", type: "bishop", emoji: "♝" },
  { id: "marauder", name: "Marauder", type: "bishop", emoji: "♝" },
  { id: "pilgrim", name: "Pilgrim", type: "bishop", emoji: "♝" },
  { id: "anti-violence", name: "Anti Violence", type: "bishop", emoji: "♝" },
  { id: "banker", name: "Banker", type: "knight", emoji: "♞" },
  { id: "camel", name: "Camel", type: "knight", emoji: "♞" },
  { id: "electroknight", name: "ElectroKnight", type: "knight", emoji: "♞" },
  { id: "fish", name: "Fish", type: "knight", emoji: "♞" },
  { id: "pinata", name: "Piñata", type: "knight", emoji: "♞" },
  { id: "knightmare", name: "Knightmare", type: "knight", emoji: "♞" },
  { id: "blueprint", name: "Blueprint", type: "pawn", emoji: "♟" },
  { id: "epee-pawn", name: "Epee Pawn", type: "pawn", emoji: "♟" },
  { id: "golden-pawn", name: "Golden Pawn", type: "pawn", emoji: "♟" },
  { id: "hero-pawn", name: "Hero Pawn", type: "pawn", emoji: "♟" },
  { id: "iron-pawn", name: "Iron Pawn", type: "pawn", emoji: "♟" },
  { id: "pawn-with-knife", name: "Pawn w/ Knife", type: "pawn", emoji: "♟" },
  { id: "war-automaton", name: "War Automaton", type: "pawn", emoji: "♟" },
  { id: "warp-jumper", name: "Warp Jumper", type: "pawn", emoji: "♟" },
  { id: "gunslinger", name: "Gunslinger", type: "pawn", emoji: "♟" },
];

const TYPE_COLORS = {
  king: { bg: "#fbbf24", text: "#78350f" },
  queen: { bg: "#f472b6", text: "#831843" },
  rook: { bg: "#34d399", text: "#064e3b" },
  bishop: { bg: "#818cf8", text: "#312e81" },
  knight: { bg: "#fb923c", text: "#7c2d12" },
  pawn: { bg: "#94a3b8", text: "#1e293b" },
};

function PieceCard({ piece, isDragging, onDragStart, onDragEnd, small }) {
  const tc = TYPE_COLORS[piece.type];
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, piece.id)}
      onDragEnd={onDragEnd}
      style={{
        width: small ? 72 : 80,
        padding: small ? "6px 4px" : "8px 6px",
        background: "#000000",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 8,
        cursor: "grab",
        textAlign: "center",
        opacity: isDragging ? 0.3 : 1,
        transition: "transform 0.15s, box-shadow 0.15s",
        userSelect: "none",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.3)";
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
      }}
    >
      <div style={{
        fontSize: small ? 22 : 26,
        lineHeight: 1,
        marginBottom: 4,
        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.4))",
      }}>{piece.emoji}</div>
      <div style={{
        fontSize: 10,
        fontWeight: 600,
        color: "#e2e8f0",
        lineHeight: 1.2,
        marginBottom: 3,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}>{piece.name}</div>
      <div style={{
        fontSize: 8,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        color: tc.text,
        background: tc.bg,
        borderRadius: 3,
        padding: "1px 5px",
        display: "inline-block",
      }}>{piece.type}</div>
    </div>
  );
}

export default function PixieTierList() {
  const [tierPieces, setTierPieces] = useState({
    S: [], A: [], B: [], C: [], D: [],
  });
  const [unplaced, setUnplaced] = useState(PIECES.map(p => p.id));
  const [dragging, setDragging] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const [title, setTitle] = useState("My Pixie Chess tier list");

  const handleDragStart = useCallback((e, pieceId) => {
    setDragging(pieceId);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragEnd = useCallback(() => {
    setDragging(null);
    setDragOver(null);
  }, []);

  const handleDrop = useCallback((e, targetTier) => {
    e.preventDefault();
    if (!dragging) return;

    setTierPieces(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(k => {
        next[k] = next[k].filter(id => id !== dragging);
      });
      if (targetTier !== "unplaced") {
        next[targetTier] = [...next[targetTier], dragging];
      }
      return next;
    });

    setUnplaced(prev => {
      const without = prev.filter(id => id !== dragging);
      if (targetTier === "unplaced") {
        return [...without, dragging];
      }
      return without;
    });

    setDragging(null);
    setDragOver(null);
  }, [dragging]);

  const handleDragOver = useCallback((e, tierId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(tierId);
  }, []);

  const resetAll = () => {
    setTierPieces({ S: [], A: [], B: [], C: [], D: [] });
    setUnplaced(PIECES.map(p => p.id));
  };

  const getPiece = (id) => PIECES.find(p => p.id === id);
  const placedCount = PIECES.length - unplaced.length;

  return (
    <div style={{
      background: "#0a0910",
      minHeight: "100vh",
      color: "#e2e8f0",
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      padding: "24px 16px",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Orbitron:wght@700;900&display=swap" rel="stylesheet" />

      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: 32,
            fontWeight: 900,
            background: "linear-gradient(135deg, #c084fc, #f472b6, #fb923c)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: "0.08em",
            marginBottom: 4,
          }}>PIXIE</div>
          <div style={{
            fontSize: 11,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "#64748b",
            fontWeight: 600,
          }}>Tier list</div>
        </div>

        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 16, gap: 12,
        }}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              flex: 1,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 6,
              padding: "8px 12px",
              color: "#e2e8f0",
              fontSize: 13,
              fontWeight: 500,
              outline: "none",
            }}
            placeholder="Name your tier list..."
          />
          <div style={{ fontSize: 12, color: "#64748b", whiteSpace: "nowrap" }}>
            {placedCount}/{PIECES.length} placed
          </div>
          <button
            onClick={resetAll}
            style={{
              background: "rgba(239,68,68,0.15)",
              color: "#ef4444",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: 6,
              padding: "7px 14px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >Reset</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 20 }}>
          {TIERS.map(tier => (
            <div
              key={tier.id}
              onDrop={(e) => handleDrop(e, tier.id)}
              onDragOver={(e) => handleDragOver(e, tier.id)}
              onDragLeave={() => setDragOver(null)}
              style={{
                display: "flex",
                minHeight: 72,
                background: dragOver === tier.id ? tier.bg : "#0d0c1c",
                border: `1px solid ${dragOver === tier.id ? tier.border : "rgba(255,255,255,0.06)"}`,
                borderRadius: 10,
                overflow: "hidden",
                transition: "background 0.2s, border-color 0.2s",
              }}
            >
              <div style={{
                width: 56,
                minWidth: 56,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: tier.bg,
                borderRight: `1px solid ${tier.border}`,
                padding: "8px 0",
              }}>
                <div style={{
                  fontSize: 22,
                  fontWeight: 900,
                  fontFamily: "'Orbitron', sans-serif",
                  color: tier.color,
                  lineHeight: 1,
                }}>{tier.id}</div>
                <div style={{
                  fontSize: 7,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: tier.color,
                  opacity: 0.7,
                  fontWeight: 700,
                  marginTop: 2,
                }}>{tier.label}</div>
              </div>

              <div style={{
                flex: 1,
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                padding: "6px 8px",
                gap: 4,
                minHeight: 60,
              }}>
                {tierPieces[tier.id].length === 0 && (
                  <div style={{
                    fontSize: 11, color: "#475569", fontStyle: "italic", padding: "0 8px",
                  }}>Drop pieces here</div>
                )}
                {tierPieces[tier.id].map(id => {
                  const p = getPiece(id);
                  return p ? (
                    <PieceCard
                      key={id}
                      piece={p}
                      isDragging={dragging === id}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      small
                    />
                  ) : null;
                })}
              </div>
            </div>
          ))}
        </div>

        <div
          onDrop={(e) => handleDrop(e, "unplaced")}
          onDragOver={(e) => handleDragOver(e, "unplaced")}
          onDragLeave={() => setDragOver(null)}
          style={{
            background: dragOver === "unplaced" ? "rgba(255,255,255,0.06)" : "#0d0c1c",
            border: `1px solid ${dragOver === "unplaced" ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.06)"}`,
            borderRadius: 10,
            padding: 12,
            transition: "background 0.2s, border-color 0.2s",
          }}
        >
          <div style={{
            fontSize: 11, color: "#64748b", fontWeight: 600,
            textTransform: "uppercase", letterSpacing: "0.1em",
            marginBottom: 10,
          }}>Unranked pieces — drag to a tier</div>

          <div style={{
            display: "flex", flexWrap: "wrap", gap: 6,
            justifyContent: "center",
          }}>
            {unplaced.map(id => {
              const p = getPiece(id);
              return p ? (
                <PieceCard
                  key={id}
                  piece={p}
                  isDragging={dragging === id}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                />
              ) : null;
            })}
            {unplaced.length === 0 && (
              <div style={{ fontSize: 12, color: "#475569", padding: 16 }}>
                All pieces ranked! Nice.
              </div>
            )}
          </div>
        </div>

        <div style={{
          marginTop: 16, textAlign: "center",
          fontSize: 10, color: "#334155",
        }}>
          pixiechess.xyz
        </div>
      </div>
    </div>
  );
}
