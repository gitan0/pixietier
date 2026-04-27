import { PIECES, pieceTypeColor, TypeLegend } from "./PixieTierList.jsx";
import { PIECE_DESCRIPTIONS } from "./pieceDescriptions.js";

function typeLabel(t) {
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : "";
}

function PieceGuideCard({ piece, description, isMobile }) {
  const tc = pieceTypeColor(piece.type);
  const tooltip = `${piece.name} · #${piece.id.slice(0, 3).toUpperCase()} · ${typeLabel(piece.type)}`;
  return (
    <article
      className="piece-guide-card"
      style={{ "--piece-color": tc }}
      title={tooltip}
    >
      <div className="piece-guide-art">
        <img src={piece.img} alt={piece.name} draggable={false} />
        <span className="piece-guide-dot" />
      </div>
      <div className="piece-guide-body">
        <header>
          <h3>{piece.name}</h3>
          <span className="piece-guide-type-chip">{typeLabel(piece.type)}</span>
        </header>
        <p>{description || "—"}</p>
      </div>
    </article>
  );
}

export default function PiecesGuide({ isMobile }) {
  return (
    <section className="pieces-guide">
      <header className="pieces-guide-header">
        <h2>Pieces</h2>
        <p className="sub">Meet the {PIECES.length} Pixietiers — every piece on the roster and what it does.</p>
        <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
          <TypeLegend />
        </div>
      </header>
      <div className="pieces-guide-grid">
        {PIECES.map(p => (
          <PieceGuideCard
            key={p.id}
            piece={p}
            description={PIECE_DESCRIPTIONS[p.id]}
            isMobile={isMobile}
          />
        ))}
      </div>
    </section>
  );
}
