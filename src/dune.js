const API_KEY = import.meta.env.VITE_DUNE_API_KEY;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Serial queue to avoid 429 rate limiting — one request every 300ms
let requestQueue = Promise.resolve();
const RATE_DELAY_MS = 300;

export async function fetchDuneQuery(queryId) {
  const cacheKey = `dune_cache_${queryId}`;
  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey) || "null");
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
      return cached.data;
    }
  } catch (_) {}

  return (requestQueue = requestQueue.then(async () => {
    await new Promise(r => setTimeout(r, RATE_DELAY_MS));
    const res = await fetch(
      `https://api.dune.com/api/v1/query/${queryId}/results?max_age_hours=1`,
      { headers: { "X-DUNE-API-KEY": API_KEY } }
    );
    if (!res.ok) throw new Error(`Dune API error ${res.status} for query ${queryId}`);
    const json = await res.json();
    const data = {
      rows: json.result?.rows ?? [],
      execution_time: json.execution?.execution_ended_at ?? null,
    };
    try {
      localStorage.setItem(cacheKey, JSON.stringify({ fetchedAt: Date.now(), data }));
    } catch (_) {}
    return data;
  }));
}

export function normalizeAddress(addr) {
  if (!addr) return "";
  return "0x" + addr.replace(/^0x/i, "").slice(-40).toLowerCase();
}

export function formatTimeAgo(isoString) {
  if (!isoString) return null;
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffH = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffH < 1) return "less than 1 hour ago";
  if (diffH === 1) return "1 hour ago";
  if (diffH < 24) return `${diffH} hours ago`;
  const diffD = Math.floor(diffH / 24);
  return diffD === 1 ? "1 day ago" : `${diffD} days ago`;
}

export function formatDate(isoString) {
  if (!isoString) return "—";
  const d = new Date(isoString);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
