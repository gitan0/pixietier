import React, { forwardRef } from "react";

const TIER_META = {
  S: { cssClass: "tier-s", glow: "rgba(255,87,168,.9)" },
  A: { cssClass: "tier-a", glow: "rgba(255,140,61,.85)" },
  B: { cssClass: "tier-b", glow: "rgba(255,208,77,.85)" },
  C: { cssClass: "tier-c", glow: "rgba(76,214,148,.8)" },
  D: { cssClass: "tier-f", glow: "rgba(77,160,255,.85)" },
};

const TYPE_COLOR = {
  king:   "var(--pink)",
  queen:  "var(--purple)",
  rook:   "var(--orange)",
  bishop: "var(--yellow)",
  knight: "var(--green)",
  pawn:   "var(--blue)",
};

function formatRelative(iso) {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return null;
  const diffSec = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (diffSec < 60) return "just now";
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  const diffMo = Math.round(diffDay / 30);
  if (diffMo < 12) return `${diffMo}mo ago`;
  return `${Math.round(diffMo / 12)}y ago`;
}

function TierPiece({ piece }) {
  return (
    <div
      className="sc-piece"
      style={{ "--piece-color": TYPE_COLOR[piece.type] || "var(--muted)" }}
      title={piece.name}
    >
      <img className="sc-art" src={piece.img} alt="" />
      <div className="sc-dot" />
    </div>
  );
}

function TierRow({ tier, pieces }) {
  const meta = TIER_META[tier];
  return (
    <div className={`sc-tier ${meta.cssClass}`}>
      <div className="sc-letter">{tier}</div>
      <div className="sc-well">
        {pieces.length === 0 ? (
          <div className="sc-empty">—</div>
        ) : (
          pieces.map(p => <TierPiece key={p.id} piece={p} />)
        )}
      </div>
    </div>
  );
}

const ShareCard = forwardRef(function ShareCard(
  { title, tiers, piecesById, format = "landscape", creatorName, viewCount, updatedAt, slug, totalPieces },
  ref
) {
  const resolveTier = (tierId) =>
    (tiers?.[tierId] || []).map(id => piecesById.get(id)).filter(Boolean);

  const rankedCount = ["S", "A", "B", "C", "D"].reduce(
    (n, t) => n + (tiers?.[t]?.length || 0), 0
  );

  const bylineBits = [];
  if (creatorName) bylineBits.push(`by @${creatorName}`);
  if (typeof viewCount === "number") bylineBits.push(`${viewCount.toLocaleString()} views`);
  bylineBits.push(`${rankedCount}/${totalPieces} ranked`);
  const rel = formatRelative(updatedAt);
  if (rel) bylineBits.push(`updated ${rel}`);

  const footerUrl = slug ? `pixietiers.com/t/${slug}` : "pixietiers.com";

  return (
    <div
      ref={ref}
      className={`pixie-share-card pixie-share-card--${format}`}
      data-format={format}
    >
      <div className="sc-bg" aria-hidden="true" />
      <div className="sc-inner">
        <header className="sc-header">
          <div className="sc-wordmark">PIXIE</div>
          <div className="sc-url">pixietiers.com</div>
        </header>

        <div className="sc-hero">
          <div className="sc-kicker">PIXIE GEN 1 · {totalPieces} CUSTOM PIECES</div>
          <h1 className="sc-title">{title || "My Pixie Chess tier list"}</h1>
          <div className="sc-byline">{bylineBits.join(" · ")}</div>
        </div>

        <div className="sc-stack">
          {["S", "A", "B", "C", "D"].map(t => (
            <TierRow key={t} tier={t} pieces={resolveTier(t)} />
          ))}
        </div>

        <footer className="sc-footer">remix at {footerUrl}</footer>
      </div>
    </div>
  );
});

export default ShareCard;
