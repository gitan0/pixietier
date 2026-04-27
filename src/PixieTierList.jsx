import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import html2canvas from "html2canvas";
import StatsPage from "./StatsPage.jsx";
import PiecesGuide from "./PiecesGuide.jsx";
import ShareCard from "./ShareCard.jsx";
import { captureShareCardBlob } from "./captureShareCard.js";
import { saveTierList, loadTierList, incrementViewCount, getConsensus, isSupabaseConfigured } from "./supabase.js";

const SHARE_BASE = typeof window !== "undefined" ? window.location.origin : "";
const TIER_SCORES = { S: 5, A: 4, B: 3, C: 2, D: 1 };
function scoreToTier(avg) {
  if (avg >= 4.5) return "S";
  if (avg >= 3.5) return "A";
  if (avg >= 2.5) return "B";
  if (avg >= 1.5) return "C";
  return "D";
}

const TIERS = [
  { id: "S", cssClass: "tier-s", glowColor: "rgba(255,87,168,.22)" },
  { id: "A", cssClass: "tier-a", glowColor: "rgba(255,140,61,.18)" },
  { id: "B", cssClass: "tier-b", glowColor: "rgba(255,208,77,.15)" },
  { id: "C", cssClass: "tier-c", glowColor: "rgba(76,214,148,.15)" },
  { id: "D", cssClass: "tier-f", glowColor: "rgba(77,160,255,.15)" },
];

const MATCHUP_CATS = [
  { id: "strong", letter: "W", label: "Beats", cssClass: "tier-c" },
  { id: "even",   letter: "=", label: "Even",  cssClass: "tier-b" },
  { id: "weak",   letter: "L", label: "Loses", cssClass: "tier-a" },
];

export const PIECES = [
  { id: "rocketman",      name: "Rocketman",      type: "king",   img: "/rocketman.webp" },
  { id: "fission-reactor",name: "Fission Reactor", type: "queen",  img: "/fission.webp" },
  { id: "phase-rook",     name: "Phase Rook",      type: "rook",   img: "/phaserook.webp" },
  { id: "sumo-rook",      name: "Sumo Rook",       type: "rook",   img: "/sumo.webp" },
  { id: "aristocrat",     name: "Aristocrat",      type: "bishop", img: "/aristorcrat.webp" },
  { id: "basilisk",       name: "Basilisk",        type: "bishop", img: "/basilisk.webp" },
  { id: "blade-runner",   name: "Blade Runner",    type: "bishop", img: "/bladerunner.webp" },
  { id: "bouncer",        name: "Bouncer",         type: "bishop", img: "/bouncer.webp" },
  { id: "cardinal",       name: "Cardinal",        type: "bishop", img: "/cardinal.webp" },
  { id: "dancer",         name: "Dancer",          type: "bishop", img: "/dancer.webp" },
  { id: "djinn",          name: "Djinn",           type: "bishop", img: "/djinn.webp" },
  { id: "horde-mother",   name: "Horde Mother",    type: "bishop", img: "/hordenmother.webp" },
  { id: "icicle",         name: "Icicle",          type: "bishop", img: "/icicle.webp" },
  { id: "marauder",       name: "Marauder",        type: "bishop", img: "/maruader.webp" },
  { id: "pilgrim",        name: "Pilgrim",         type: "bishop", img: "/pilgrim.webp" },
  { id: "gunslinger",     name: "Gunslinger",      type: "bishop", img: "/gunslinger.webp" },
  { id: "anti-violence",  name: "Anti Violence",   type: "knight", img: "/antiviolence.webp" },
  { id: "banker",         name: "Banker",          type: "knight", img: "/banker.webp" },
  { id: "camel",          name: "Camel",           type: "knight", img: "/camel.webp" },
  { id: "electroknight",  name: "ElectroKnight",   type: "knight", img: "/electroknight.webp" },
  { id: "fish",           name: "Fish",            type: "knight", img: "/fish.webp" },
  { id: "pinata",         name: "Piñata",          type: "knight", img: "/pinata.webp" },
  { id: "knightmare",     name: "Knightmare",      type: "knight", img: "/knightmare.webp" },
  { id: "blueprint",      name: "Blueprint",       type: "pawn",   img: "/blueprint.webp" },
  { id: "epee-pawn",      name: "Epee Pawn",       type: "pawn",   img: "/epee.webp" },
  { id: "golden-pawn",    name: "Golden Pawn",     type: "pawn",   img: "/goldenpawn.webp" },
  { id: "hero-pawn",      name: "Hero Pawn",       type: "pawn",   img: "/heropawn.webp" },
  { id: "iron-pawn",      name: "Iron Pawn",       type: "pawn",   img: "/ironpawn.webp" },
  { id: "pawn-with-knife",name: "Pawn w/ Knife",   type: "pawn",   img: "/pawnknife.webp" },
  { id: "shrike",         name: "Shrike",          type: "pawn",   img: "/shrike.webp" },
  { id: "war-automaton",  name: "War Automaton",   type: "pawn",   img: "/warauto.webp" },
  { id: "warp-jumper",    name: "Warp Jumper",     type: "pawn",   img: "/warpjumper.webp" },
];

const PIECE_MAP = new Map(PIECES.map(p => [p.id, p]));

export function pieceTypeColor(t) {
  return ({
    king:   "var(--pink)",
    queen:  "var(--purple)",
    rook:   "var(--orange)",
    bishop: "var(--yellow)",
    knight: "var(--green)",
    pawn:   "var(--blue)",
  })[t] || "var(--muted)";
}

const TYPE_LEGEND = [
  { label: "King",   color: "var(--pink)" },
  { label: "Queen",  color: "var(--purple)" },
  { label: "Rook",   color: "var(--orange)" },
  { label: "Bishop", color: "var(--yellow)" },
  { label: "Knight", color: "var(--green)" },
  { label: "Pawn",   color: "var(--blue)" },
];

export function TypeLegend() {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
      fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)",
      letterSpacing: "0.5px",
    }}>
      {TYPE_LEGEND.map(({ label, color }) => (
        <span key={label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{
            width: 7, height: 7, borderRadius: "50%",
            background: color, boxShadow: `0 0 6px ${color}`,
            display: "inline-block", flexShrink: 0,
          }} />
          {label}
        </span>
      ))}
    </div>
  );
}

function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" && window.innerWidth < breakpoint
  );
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const handler = (e) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    setIsMobile(mql.matches);
    return () => mql.removeEventListener("change", handler);
  }, [breakpoint]);
  return isMobile;
}

function sanitizeTitle(raw) {
  return raw.replace(/<[^>]*>/g, "").slice(0, 50);
}

// ─── Piece card ───────────────────────────────────────────────────────────────
function PieceCard({ piece, isDragging, isSelected, onDragStart, onDragEnd, onClick, small, xs, isMobile }) {
  const tc = pieceTypeColor(piece.type);
  const sizeClass = xs ? " xs" : small ? " sm" : "";
  const typeLabel = piece.type ? piece.type.charAt(0).toUpperCase() + piece.type.slice(1) : "";
  const tooltip = `${piece.name} · #${piece.id.slice(0, 3).toUpperCase()} · ${typeLabel}`;

  return (
    <div
      draggable={!isMobile}
      onDragStart={isMobile ? undefined : (e) => onDragStart(e, piece.id)}
      onDragEnd={isMobile ? undefined : onDragEnd}
      onClick={() => onClick(piece.id)}
      className={`piece${sizeClass}${isSelected ? " selected" : ""}${isDragging ? " dragging" : ""}`}
      style={{ "--piece-color": tc }}
      title={tooltip}
    >
      <img className="art" src={piece.img} alt={piece.name} draggable={false} />
      {!small && !xs && <div className="badge">#{piece.id.slice(0, 3).toUpperCase()}</div>}
      <div className="type-dot" />
      <div className="label">{piece.name}</div>
    </div>
  );
}


// ─── Main component ───────────────────────────────────────────────────────────
export default function PixieTierList() {
  const isMobile = useIsMobile();

  const [activeTab, setActiveTab] = useState("stats");
  const [dragging, setDragging] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const [selected, setSelected] = useState(null);
  const [copyLabel, setCopyLabel] = useState("Copy PNG");
  const [capturing, setCapturing] = useState(false);
  const captureRef = useRef(null);

  const [tierPieces, setTierPieces] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("pixietier_v1") || "null");
      if (saved?.tierPieces) return saved.tierPieces;
    } catch {}
    return { S: [], A: [], B: [], C: [], D: [] };
  });
  const [unplaced, setUnplaced] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("pixietier_v1") || "null");
      if (saved?.unplaced) {
        // Add any pieces introduced after this state was saved
        const savedTiers = saved.tierPieces ?? { S: [], A: [], B: [], C: [], D: [] };
        const known = new Set([
          ...saved.unplaced,
          ...Object.values(savedTiers).flat(),
        ]);
        const newPieces = PIECES.map(p => p.id).filter(id => !known.has(id));
        return [...saved.unplaced, ...newPieces];
      }
    } catch {}
    return PIECES.map(p => p.id);
  });
  const [title, setTitle] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("pixietier_v1") || "null");
      if (saved?.title) return saved.title;
    } catch {}
    return "My Pixie Chess tier list";
  });

  const [focusPiece, setFocusPiece] = useState(null);
  const [matchupData, setMatchupData] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("pixietier_matchups_v1") || "null");
      if (saved && typeof saved === "object") return saved;
    } catch {}
    return {};
  });

  const [viewingSlug, setViewingSlug] = useState(null);
  const [viewingMeta, setViewingMeta] = useState(null);
  const [shareLinkLabel, setShareLinkLabel] = useState("Copy URL");
  const [showOverflow, setShowOverflow] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const ownListBackupRef = useRef(null);

  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);
  const showToast = useCallback((msg) => {
    setToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 2600);
  }, []);
  useEffect(() => () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); }, []);

  const [shareFormat, setShareFormat] = useState("landscape");
  const shareCardRef = useRef(null);
  useEffect(() => { setShareFormat(isMobile ? "square" : "landscape"); }, [isMobile]);

  const shareBlobRef = useRef(null);
  const shareBlobKeyRef = useRef("");
  const shareBlobInflightRef = useRef(null);

  const [consensusData, setConsensusData] = useState(null);
  const [loadingConsensus, setLoadingConsensus] = useState(false);
  const [consensusError, setConsensusError] = useState(null);

  // Load shared tier list from URL
  useEffect(() => {
    if (typeof window === "undefined") return;
    const match = window.location.pathname.match(/^\/t\/([a-z0-9]+)\/?$/i);
    if (!match) return;
    const slug = match[1];
    if (!isSupabaseConfigured()) { setLoadError("Sharing is not configured on this build."); return; }
    (async () => {
      try {
        const data = await loadTierList(slug);
        if (!data) { setLoadError("That tier list could not be found."); return; }
        ownListBackupRef.current = { tierPieces, unplaced, title };
        const loadedTiers = data.tiers || { S: [], A: [], B: [], C: [], D: [] };
        const normalized = { S: [], A: [], B: [], C: [], D: [] };
        for (const k of Object.keys(normalized)) {
          if (Array.isArray(loadedTiers[k])) normalized[k] = loadedTiers[k].filter(Boolean);
        }
        const placed = new Set(Object.values(normalized).flat());
        const newUnplaced = PIECES.map(p => p.id).filter(id => !placed.has(id));
        setTierPieces(normalized);
        setUnplaced(newUnplaced);
        setTitle(data.title || "Shared Pixie Tier List");
        setViewingSlug(slug);
        setViewingMeta({ creator_name: data.creator_name, created_at: data.created_at, view_count: data.view_count });
        setActiveTab("tierlist");
        incrementViewCount(slug);
      } catch (err) {
        console.error("Failed to load shared tier list:", err);
        setLoadError("Couldn't load that tier list. Try again later.");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeTab !== "community") return;
    if (!isSupabaseConfigured()) { setConsensusError("Community rankings are not available."); return; }
    setLoadingConsensus(true);
    getConsensus()
      .then(rows => { setConsensusData(rows); setConsensusError(null); })
      .catch(err => { console.error("Consensus fetch failed:", err); setConsensusError("Couldn't load community rankings."); })
      .finally(() => setLoadingConsensus(false));
  }, [activeTab]);

  useEffect(() => { setSelected(null); setDragging(null); setDragOver(null); }, [activeTab]);

  useEffect(() => {
    if (viewingSlug) return;
    try { localStorage.setItem("pixietier_v1", JSON.stringify({ tierPieces, unplaced, title })); } catch {}
  }, [tierPieces, unplaced, title, viewingSlug]);

  useEffect(() => {
    try { localStorage.setItem("pixietier_matchups_v1", JSON.stringify(matchupData)); } catch {}
  }, [matchupData]);

  // Handlers
  const handleDragStart = useCallback((e, pieceId) => {
    setDragging(pieceId);
    e.dataTransfer.effectAllowed = "move";
  }, []);
  const handleDragEnd = useCallback(() => { setDragging(null); setDragOver(null); }, []);

  const movePiece = useCallback((pieceId, targetTier) => {
    setTierPieces(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(k => { next[k] = next[k].filter(id => id !== pieceId); });
      if (targetTier !== "unplaced") next[targetTier] = [...next[targetTier], pieceId];
      return next;
    });
    setUnplaced(prev => {
      const without = prev.filter(id => id !== pieceId);
      return targetTier === "unplaced" ? [...without, pieceId] : without;
    });
  }, []);

  const handleDrop = useCallback((e, targetTier) => {
    e.preventDefault();
    if (!dragging) return;
    movePiece(dragging, targetTier);
    setDragging(null); setDragOver(null);
  }, [dragging, movePiece]);

  const handleDragOver = useCallback((e, tierId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(prev => prev === tierId ? prev : tierId);
  }, []);

  const handlePieceClick = useCallback((pieceId) => {
    setSelected(prev => prev === pieceId ? null : pieceId);
  }, []);

  const handleTierClick = useCallback((tierId) => {
    if (!selected) return;
    movePiece(selected, tierId);
    setSelected(null);
  }, [selected, movePiece]);

  const handleUnplacedClick = useCallback(() => {
    if (!selected) return;
    movePiece(selected, "unplaced");
    setSelected(null);
  }, [selected, movePiece]);

  const getMatchupForPiece = useCallback((pieceId) => {
    return matchupData[pieceId] || { strong: [], even: [], weak: [] };
  }, [matchupData]);

  const matchupUnranked = useMemo(() => {
    if (!focusPiece) return [];
    const data = getMatchupForPiece(focusPiece);
    return PIECES.filter(p => p.id !== focusPiece).map(p => p.id).filter(id =>
      !data.strong.includes(id) && !data.even.includes(id) && !data.weak.includes(id)
    );
  }, [focusPiece, getMatchupForPiece]);

  const moveMatchupPiece = useCallback((pieceId, targetCat) => {
    if (!focusPiece) return;
    setMatchupData(prev => {
      const current = prev[focusPiece] || { strong: [], even: [], weak: [] };
      const next = {
        strong: current.strong.filter(id => id !== pieceId),
        even:   current.even.filter(id => id !== pieceId),
        weak:   current.weak.filter(id => id !== pieceId),
      };
      if (targetCat !== "unranked") next[targetCat] = [...next[targetCat], pieceId];
      return { ...prev, [focusPiece]: next };
    });
  }, [focusPiece]);

  const handleMatchupDrop = useCallback((e, targetCat) => {
    e.preventDefault();
    if (!dragging) return;
    moveMatchupPiece(dragging, targetCat);
    setDragging(null); setDragOver(null);
  }, [dragging, moveMatchupPiece]);

  const handleMatchupTierClick = useCallback((catId) => {
    if (!selected) return;
    moveMatchupPiece(selected, catId);
    setSelected(null);
  }, [selected, moveMatchupPiece]);

  const handleMatchupUnrankedClick = useCallback(() => {
    if (!selected) return;
    moveMatchupPiece(selected, "unranked");
    setSelected(null);
  }, [selected, moveMatchupPiece]);

  const resetAll = () => {
    if (activeTab === "tierlist") {
      setTierPieces({ S: [], A: [], B: [], C: [], D: [] });
      setUnplaced(PIECES.map(p => p.id));
    } else if (focusPiece) {
      setMatchupData(prev => { const next = { ...prev }; delete next[focusPiece]; return next; });
    }
    setSelected(null);
  };

  const captureCanvas = async () => {
    if (!captureRef.current) return null;
    setCapturing(true);
    try {
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      const canvas = await html2canvas(captureRef.current, {
        backgroundColor: "#0a0810",
        scale: 2,
        useCORS: true,
      });
      setCapturing(false);
      return canvas;
    } catch (err) {
      setCapturing(false);
      throw err;
    }
  };

  const captureShareBlob = async () => {
    if (!shareCardRef.current) return null;
    return await captureShareCardBlob(shareCardRef.current);
  };

  const shareBlobKey = useMemo(
    () => JSON.stringify({
      title,
      tiers: tierPieces,
      format: shareFormat,
      slug: viewingSlug,
      creator: viewingMeta?.creator_name ?? null,
      views: viewingMeta?.view_count ?? null,
      updated: viewingMeta?.created_at ?? null,
    }),
    [title, tierPieces, shareFormat, viewingSlug, viewingMeta]
  );

  useEffect(() => {
    if (activeTab !== "tierlist") return;
    const id = setTimeout(async () => {
      if (shareBlobKeyRef.current === shareBlobKey && shareBlobRef.current) return;
      const node = shareCardRef.current;
      if (!node) return;
      const p = captureShareCardBlob(node).catch((err) => {
        console.warn("share card pre-capture failed:", err);
        return null;
      });
      shareBlobInflightRef.current = p;
      const blob = await p;
      if (shareBlobInflightRef.current === p) {
        shareBlobRef.current = blob || null;
        shareBlobKeyRef.current = shareBlobKey;
        shareBlobInflightRef.current = null;
      }
    }, 350);
    return () => clearTimeout(id);
  }, [shareBlobKey, activeTab]);

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const shareFilename = () => {
    const slug = viewingSlug || "draft";
    return `pixie-${slug}.png`;
  };

  const handleCopy = async () => {
    if (capturing) return;
    // Matchups tab still uses in-place editor capture.
    if (activeTab !== "tierlist") {
      try {
        setCopyLabel("Copying…");
        const canvas = await captureCanvas();
        if (!canvas) { setCopyLabel("Copy PNG"); return; }
        const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        setCopyLabel("Copied!");
        setTimeout(() => setCopyLabel("Copy PNG"), 2000);
      } catch (err) {
        console.error("Copy failed:", err);
        setCopyLabel("Copy PNG");
      }
      return;
    }

    const getBlob = () => {
      if (shareBlobRef.current && shareBlobKeyRef.current === shareBlobKey) {
        return Promise.resolve(shareBlobRef.current);
      }
      if (shareBlobInflightRef.current) return shareBlobInflightRef.current;
      return captureShareBlob();
    };

    const canClipboardImage =
      typeof ClipboardItem !== "undefined" &&
      navigator.clipboard?.write &&
      window.isSecureContext;

    silentlySaveCommunity();
    setCopyLabel("Copying…");

    if (canClipboardImage) {
      try {
        const pngPromise = getBlob().then(b => b || Promise.reject(new Error("no blob")));
        await navigator.clipboard.write([new ClipboardItem({ "image/png": pngPromise })]);
        showToast("Share card copied — paste into Twitter/Discord/Farcaster");
        setCopyLabel("Copied!");
        setTimeout(() => setCopyLabel("Copy PNG"), 2000);
        return;
      } catch (err) {
        console.warn("clipboard.write failed, falling back to download:", err);
      }
    }

    try {
      const blob = await getBlob();
      if (!blob) { setCopyLabel("Copy PNG"); return; }
      downloadBlob(blob, shareFilename());
      showToast("Share card downloaded");
      setCopyLabel("Downloaded!");
      setTimeout(() => setCopyLabel("Copy PNG"), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
      setCopyLabel("Copy PNG");
    }
  };

  // Hash tierPieces for dedup — only save to Supabase when list actually changed
  const tiersHash = () => JSON.stringify(
    Object.fromEntries(Object.entries(tierPieces).map(([k, v]) => [k, [...v].sort()]))
  );

  const silentlySaveCommunity = () => {
    if (!isSupabaseConfigured()) return;
    const hasPlaced = Object.values(tierPieces).some(arr => arr.length > 0);
    if (!hasPlaced) return;
    const hash = tiersHash();
    const stored = localStorage.getItem("pixietier_last_saved_hash");
    if (stored === hash) return; // already saved this exact list
    saveTierList({ title, tiers: tierPieces })
      .then(() => localStorage.setItem("pixietier_last_saved_hash", hash))
      .catch(() => {});
  };

  const handleShareLink = async () => {
    if (!isSupabaseConfigured()) { alert("Sharing is not configured on this build."); return; }
    try {
      setShareLinkLabel("Saving…");
      const slug = await saveTierList({ title, tiers: tierPieces });
      localStorage.setItem("pixietier_last_saved_hash", tiersHash());
      const url = `${SHARE_BASE}/t/${slug}`;
      try {
        await navigator.clipboard.writeText(url);
        setShareLinkLabel("URL Copied!");
      } catch {
        setShareLinkLabel("Saved! ✓");
      }
      setTimeout(() => setShareLinkLabel("Copy URL"), 2500);
    } catch (err) {
      console.error("Share link failed:", err);
      setShareLinkLabel("Copy URL");
      alert("Couldn't create link. Try again.");
    }
  };

  const handleRemix = () => {
    setViewingSlug(null); setViewingMeta(null); ownListBackupRef.current = null;
    if (typeof window !== "undefined") window.history.replaceState(null, "", "/");
  };

  const handleBackToMyList = () => {
    const backup = ownListBackupRef.current;
    if (backup) { setTierPieces(backup.tierPieces); setUnplaced(backup.unplaced); setTitle(backup.title); }
    setViewingSlug(null); setViewingMeta(null); ownListBackupRef.current = null;
    if (typeof window !== "undefined") window.history.replaceState(null, "", "/");
  };

  const getPiece = (id) => PIECE_MAP.get(id);
  const placedCount = PIECES.length - unplaced.length;

  const focusPieceObj = focusPiece ? getPiece(focusPiece) : null;
  const currentMatchup = focusPiece ? getMatchupForPiece(focusPiece) : null;
  const matchupPlacedCount = currentMatchup
    ? currentMatchup.strong.length + currentMatchup.even.length + currentMatchup.weak.length
    : 0;

  const TABS = [
    { id: "stats",     label: "Stats" },
    { id: "tierlist",  label: "Tier List" },
    { id: "matchups",  label: "Matchups" },
    { id: "pieces",    label: "Pieces" },
    { id: "community", label: "Community" },
  ];

  return (
    <>
      <div style={{ padding: isMobile ? "20px 16px 60px" : "28px 16px 80px" }}>
        <div style={{ maxWidth: activeTab === "stats" ? 1280 : activeTab === "pieces" ? 1200 : 900, margin: "0 auto" }}>

          {/* Logo + nav */}
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div className="logo-text">PIXIE</div>
          </div>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: isMobile ? 20 : 28 }}>
            <nav className="pill-nav">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  className={activeTab === tab.id ? "active" : ""}
                  onClick={() => setActiveTab(tab.id)}
                >{tab.label}</button>
              ))}
            </nav>
          </div>

          {/* ── TIER LIST TAB ── */}
          {activeTab === "tierlist" && (
            <>
              {loadError && <div className="error-banner">{loadError}</div>}

              {viewingSlug && (
                <div className="viewing-banner">
                  <div>
                    <div className="vb-text" style={{ fontWeight: 700 }}>You're viewing a shared tier list</div>
                    <div className="vb-sub">
                      {viewingMeta?.view_count != null ? `${viewingMeta.view_count + 1} views · ` : ""}
                      Edits won't save until you remix.
                    </div>
                  </div>
                  <div className="vb-actions">
                    <button className="btn primary" onClick={handleRemix}>Remix this list</button>
                    <button className="btn" onClick={handleBackToMyList}>Back to mine</button>
                  </div>
                </div>
              )}

              {/* Editor surface — no longer the capture source; ShareCard renders offscreen. */}
              <div style={{ background: "#0a0810", padding: "4px 0 8px" }}>
                {selected && (
                  <div style={{
                    textAlign: "center", padding: "6px 16px", marginBottom: 10,
                    fontSize: 12, color: "var(--purple)", fontWeight: 600,
                    background: "rgba(157,108,255,.08)", borderRadius: 8,
                    border: "1px solid rgba(157,108,255,.2)",
                    fontFamily: "var(--font-mono)", letterSpacing: "1px",
                  }}>
                    {getPiece(selected)?.name} selected — tap a tier to place
                  </div>
                )}

                {/* Tier rows */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 10 }}>
                  {TIERS.map(tier => (
                    <div
                      key={tier.id}
                      onDrop={(e) => handleDrop(e, tier.id)}
                      onDragOver={(e) => handleDragOver(e, tier.id)}
                      onDragLeave={() => setDragOver(null)}
                      onClick={() => handleTierClick(tier.id)}
                      className={`arena-tier ${tier.cssClass}${dragOver === tier.id ? " dropover" : ""}${selected ? " clickable" : ""}`}
                    >
                      <div className="tier-letter">{tier.id}</div>
                      <div className="tier-well">
                        {tierPieces[tier.id].length === 0 && (
                          <span className="hint">{selected ? "tap to place here" : "drop pieces here"}</span>
                        )}
                        {tierPieces[tier.id].map(id => {
                          const p = getPiece(id);
                          return p ? (
                            <PieceCard
                              key={id} piece={p}
                              isDragging={dragging === id} isSelected={selected === id}
                              onDragStart={handleDragStart} onDragEnd={handleDragEnd}
                              onClick={handlePieceClick} small isMobile={isMobile}
                            />
                          ) : null;
                        })}
                      </div>
                      <div className="tier-menu">
                        <button title="Move up">↑</button>
                        <button title="Options">⋮</button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="page-credit">
                  by <a href="https://x.com/gitanoeth" target="_blank" rel="noopener noreferrer">@gitanoeth</a>
                  {" · "}
                  <a href="https://pixiechess.xyz" target="_blank" rel="noopener noreferrer">pixiechess.xyz</a>
                </div>
              </div>

              {/* Controls bar */}
              <div style={{
                display: "flex", alignItems: "center", gap: 8, marginTop: 12, flexWrap: "wrap",
              }}>
                <input
                  className="title-input"
                  value={title}
                  onChange={(e) => setTitle(sanitizeTitle(e.target.value))}
                  maxLength={50}
                  placeholder="Name your tier list…"
                />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", whiteSpace: "nowrap" }}>
                  {placedCount}/{PIECES.length}
                </span>
                {isMobile ? (
                  <>
                    <button className="btn" onClick={handleCopy} disabled={capturing}>{copyLabel}</button>
                    <button className="btn primary" onClick={handleShareLink} disabled={shareLinkLabel === "Saving…"}>{shareLinkLabel}</button>
                    <div style={{ position: "relative" }}>
                      <button className="btn" onClick={() => setShowOverflow(v => !v)}>⋯</button>
                      {showOverflow && (
                        <div style={{
                          position: "absolute", bottom: "calc(100% + 6px)", right: 0,
                          background: "rgba(20,15,32,.97)", border: "1px solid var(--line-2)",
                          borderRadius: 12, padding: 8,
                          display: "flex", flexDirection: "column", gap: 6,
                          minWidth: 144, zIndex: 50,
                          boxShadow: "0 4px 24px rgba(0,0,0,.6)",
                        }}>
                          <button className="btn danger" style={{ width: "100%" }} onClick={() => { resetAll(); setShowOverflow(false); }}>Reset</button>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <button className="btn" onClick={handleCopy} disabled={capturing}>{copyLabel}</button>
                    <button className="btn primary" onClick={handleShareLink} disabled={shareLinkLabel === "Saving…"}>
                      {shareLinkLabel}
                    </button>
                    <button className="btn danger" onClick={resetAll}>Reset</button>
                  </>
                )}
              </div>

              {/* Bench */}
              <div
                className={`bench${dragOver === "unplaced" ? " dropover" : ""}`}
                onDrop={(e) => handleDrop(e, "unplaced")}
                onDragOver={(e) => handleDragOver(e, "unplaced")}
                onDragLeave={() => setDragOver(null)}
                onClick={handleUnplacedClick}
                style={{ cursor: selected ? "pointer" : "default" }}
              >
                <div className="bench-head">
                  <div className="bench-title">
                    <h3>BENCH</h3>
                    <span className="count">{unplaced.length} unranked</span>
                  </div>
                  <TypeLegend />
                </div>
                <div className="bench-grid">
                  {unplaced.map(id => {
                    const p = getPiece(id);
                    return p ? (
                      <PieceCard
                        key={id} piece={p}
                        isDragging={dragging === id} isSelected={selected === id}
                        onDragStart={handleDragStart} onDragEnd={handleDragEnd}
                        onClick={handlePieceClick} isMobile={isMobile}
                      />
                    ) : null;
                  })}
                  {unplaced.length === 0 && (
                    <div style={{ gridColumn: "1 / -1", padding: 16, textAlign: "center", color: "var(--green)", fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "1px" }}>
                      ALL PIECES RANKED ✓
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ── MATCHUPS TAB ── */}
          {activeTab === "matchups" && (
            <>
              <div className="matchup-selector">
                {["king", "queen", "rook", "bishop", "knight", "pawn"].map(type => {
                  const typePieces = PIECES.filter(p => p.type === type);
                  if (!typePieces.length) return null;
                  return (
                    <div key={type} style={{ marginBottom: 12 }}>
                      <div className="matchup-type-label">{type}{typePieces.length > 1 ? "s" : ""}</div>
                      <div className="matchup-piece-grid">
                        {typePieces.map(piece => (
                          <PieceCard
                            key={piece.id}
                            piece={piece}
                            isDragging={false}
                            isSelected={focusPiece === piece.id}
                            onDragStart={() => {}}
                            onDragEnd={() => {}}
                            onClick={(id) => setFocusPiece(focusPiece === id ? null : id)}
                            small
                            isMobile={true}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div>
                {focusPiece && focusPieceObj ? (
                  <>
                    <div ref={captureRef} style={{ background: "#0a0810", padding: "4px 0 8px" }}>
                      {capturing && (
                        <div style={{ textAlign: "center", marginBottom: 16 }}>
                          <div className="logo-text" style={{ fontSize: 28 }}>PIXIE</div>
                        </div>
                      )}

                      {/* Focus header */}
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, justifyContent: "center" }}>
                        <div style={{
                          width: 48, height: 48, background: "rgba(157,108,255,.1)",
                          borderRadius: 10, border: "1px solid rgba(157,108,255,.3)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          overflow: "hidden",
                        }}>
                          <img src={focusPieceObj.img} alt={focusPieceObj.name} style={{ width: "80%", height: "80%", objectFit: "contain" }} />
                        </div>
                        <div>
                          <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20, color: "var(--ink)" }}>
                            {focusPieceObj.name}
                          </div>
                          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "2px", textTransform: "uppercase", color: "var(--muted)" }}>
                            MATCHUP ANALYSIS
                          </div>
                        </div>
                      </div>

                      {selected && (
                        <div style={{
                          textAlign: "center", padding: "6px 16px", marginBottom: 10,
                          fontSize: 12, color: "var(--purple)", fontWeight: 600,
                          background: "rgba(157,108,255,.08)", borderRadius: 8,
                          border: "1px solid rgba(157,108,255,.2)",
                          fontFamily: "var(--font-mono)", letterSpacing: "1px",
                        }}>
                          {getPiece(selected)?.name} selected — tap a row to place
                        </div>
                      )}

                      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 10 }}>
                        {MATCHUP_CATS.map(cat => {
                          const pieces = currentMatchup[cat.id] || [];
                          return (
                            <div
                              key={cat.id}
                              onDrop={(e) => handleMatchupDrop(e, cat.id)}
                              onDragOver={(e) => handleDragOver(e, cat.id)}
                              onDragLeave={() => setDragOver(null)}
                              onClick={() => handleMatchupTierClick(cat.id)}
                              className={`arena-tier ${cat.cssClass}${dragOver === cat.id ? " dropover" : ""}${selected ? " clickable" : ""}`}
                            >
                              <div className="tier-letter" style={{ fontSize: isMobile ? 40 : 56 }}>{cat.letter}</div>
                              <div className="tier-well" style={{ minHeight: 80 }}>
                                {pieces.length === 0 && (
                                  <span className="hint">{selected ? "tap to place here" : cat.label}</span>
                                )}
                                {pieces.map(id => {
                                  const p = getPiece(id);
                                  return p ? (
                                    <PieceCard
                                      key={id} piece={p}
                                      isDragging={dragging === id} isSelected={selected === id}
                                      onDragStart={handleDragStart} onDragEnd={handleDragEnd}
                                      onClick={handlePieceClick} small isMobile={isMobile}
                                    />
                                  ) : null;
                                })}
                              </div>
                              <div className="tier-menu">
                                <button>⋮</button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="page-credit">
                        by <a href="https://x.com/gitanoeth" target="_blank" rel="noopener noreferrer">@gitanoeth</a>
                        {" · "}
                        <a href="https://pixiechess.xyz" target="_blank" rel="noopener noreferrer">pixiechess.xyz</a>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>
                        {matchupPlacedCount}/{PIECES.length - 1} sorted
                      </span>
                      <button className="btn" onClick={handleCopy} disabled={capturing}>{copyLabel}</button>
                      <button className="btn primary" onClick={handleShare}>Share ↗</button>
                      <button className="btn danger" onClick={resetAll}>Reset</button>
                    </div>

                    {/* Unranked pool */}
                    <div
                      className={`bench${dragOver === "unranked" ? " dropover" : ""}`}
                      style={{ marginTop: 14, cursor: selected ? "pointer" : "default" }}
                      onDrop={(e) => handleMatchupDrop(e, "unranked")}
                      onDragOver={(e) => handleDragOver(e, "unranked")}
                      onDragLeave={() => setDragOver(null)}
                      onClick={handleMatchupUnrankedClick}
                    >
                      <div className="bench-head">
                        <div className="bench-title">
                          <h3>UNSORTED</h3>
                          <span className="count">{matchupUnranked.length} remaining</span>
                        </div>
                      </div>
                      <div className="bench-grid">
                        {matchupUnranked.map(id => {
                          const p = getPiece(id);
                          return p ? (
                            <PieceCard
                              key={id} piece={p}
                              isDragging={dragging === id} isSelected={selected === id}
                              onDragStart={handleDragStart} onDragEnd={handleDragEnd}
                              onClick={handlePieceClick} isMobile={isMobile}
                            />
                          ) : null;
                        })}
                        {matchupUnranked.length === 0 && (
                          <div style={{ gridColumn: "1 / -1", padding: 16, textAlign: "center", color: "var(--green)", fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "1px" }}>
                            ALL MATCHUPS SORTED ✓
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: "center", padding: "40px 0", color: "var(--muted)", fontFamily: "var(--font-mono)", fontSize: 13, letterSpacing: "1px" }}>
                    SELECT A PIECE ABOVE TO ANALYZE MATCHUPS
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── STATS TAB ── */}
          {activeTab === "stats" && <StatsPage isMobile={isMobile} />}

          {/* ── PIECES TAB ── */}
          {activeTab === "pieces" && <PiecesGuide isMobile={isMobile} />}

          {/* ── COMMUNITY TAB ── */}
          {activeTab === "community" && (
            <CommunityView
              consensusData={consensusData}
              loading={loadingConsensus}
              error={consensusError}
              isMobile={isMobile}
              onBuildYours={() => setActiveTab("tierlist")}
            />
          )}

        </div>
      </div>

      {activeTab === "tierlist" && (
        <div className="pixie-share-stage" aria-hidden="true">
          <ShareCard
            ref={shareCardRef}
            title={title}
            tiers={tierPieces}
            piecesById={PIECE_MAP}
            format={shareFormat}
            creatorName={viewingMeta?.creator_name || null}
            viewCount={viewingMeta?.view_count != null ? viewingMeta.view_count : undefined}
            updatedAt={viewingMeta?.created_at || null}
            slug={viewingSlug}
            totalPieces={PIECES.length}
          />
        </div>
      )}

      {toast && <div className="pixie-toast">{toast}</div>}
    </>
  );
}

// ─── Community view ───────────────────────────────────────────────────────────
function CommunityView({ consensusData, loading, error, isMobile, onBuildYours }) {
  const buckets = useMemo(() => {
    const b = { S: [], A: [], B: [], C: [], D: [], unranked: [] };
    if (!consensusData) return b;
    const byId = new Map(consensusData.map(r => [r.piece_id, r]));
    for (const piece of PIECES) {
      const row = byId.get(piece.id);
      if (!row || !row.total) {
        b.unranked.push({ piece, row: null });
      } else {
        const avg = Number(row.avg_score);
        b[scoreToTier(avg)].push({ piece, row, avg });
      }
    }
    for (const k of ["S", "A", "B", "C", "D"]) {
      b[k].sort((a, b2) => b2.avg - a.avg);
    }
    return b;
  }, [consensusData]);

  const totalLists = useMemo(() => {
    if (!consensusData) return 0;
    return consensusData.reduce((max, r) => Math.max(max, r.total || 0), 0);
  }, [consensusData]);

  const COMMUNITY_TIERS = [
    { id: "S", ribbonClass: "ribbon-s" },
    { id: "A", ribbonClass: "ribbon-a" },
    { id: "B", ribbonClass: "ribbon-b" },
    { id: "C", ribbonClass: "ribbon-c" },
    { id: "D", ribbonClass: "ribbon-d" },
  ];

  return (
    <div style={{ maxWidth: 860, margin: "0 auto" }}>
      <div className="community-header">
        <h2>Community Consensus</h2>
        <div className="sub">
          {totalLists > 0
            ? `Aggregated from ${totalLists}+ shared lists · live`
            : "Share your tier list to seed the community ranking."}
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {loading && (
        <div style={{ textAlign: "center", color: "var(--muted)", padding: 40, fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "2px" }}>
          LOADING RANKINGS…
        </div>
      )}

      {!loading && !error && consensusData && (
        <>
          {COMMUNITY_TIERS.map(tier => {
            const entries = buckets[tier.id];
            return (
              <div
                key={tier.id}
                className={`arena-tier tier-${tier.id.toLowerCase()}`}
                style={{ marginBottom: 10 }}
              >
                <div className="tier-letter">{tier.id}</div>
                <div className="tier-well" style={{ minHeight: 80 }}>
                  {entries.length === 0 ? (
                    <span className="hint">no pieces at this tier yet</span>
                  ) : entries.map(({ piece, row, avg }) => (
                    <div
                      key={piece.id}
                      title={`${piece.name} · avg ${avg.toFixed(2)} · ${row.total} vote${row.total === 1 ? "" : "s"}`}
                      style={{ position: "relative" }}
                    >
                      <div className="piece sm" style={{ "--piece-color": pieceTypeColor(piece.type) }}>
                        <img className="art" src={piece.img} alt={piece.name} />
                        <div className="type-dot" />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="tier-menu" />
              </div>
            );
          })}

          {buckets.unranked.length > 0 && (
            <div className="bench" style={{ marginTop: 14 }}>
              <div className="bench-head">
                <div className="bench-title">
                  <h3>NOT YET RANKED</h3>
                  <span className="count">{buckets.unranked.length}</span>
                </div>
                <TypeLegend />
              </div>
              <div className="bench-grid">
                {buckets.unranked.map(({ piece }) => (
                  <div
                    key={piece.id}
                    className="piece"
                    style={{ "--piece-color": pieceTypeColor(piece.type) }}
                    title={piece.name}
                  >
                    <img className="art" src={piece.img} alt={piece.name} />
                    <div className="type-dot" />
                    <div className="label">{piece.name}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ textAlign: "center", marginTop: 28, paddingTop: 20, borderTop: "1px solid var(--line)" }}>
            <button className="btn primary" style={{ fontSize: 14, padding: "10px 24px" }} onClick={onBuildYours}>
              Build your own tier list →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
