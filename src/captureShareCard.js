import { toPng, toBlob } from "html-to-image";

async function waitForImages(node) {
  const imgs = Array.from(node.querySelectorAll("img"));
  await Promise.all(imgs.map(img => {
    if (img.complete && img.naturalWidth > 0) return img.decode().catch(() => {});
    return new Promise(resolve => {
      img.addEventListener("load", () => resolve(), { once: true });
      img.addEventListener("error", () => resolve(), { once: true });
    });
  }));
}

async function prepare(node) {
  if (document.fonts?.ready) {
    try { await document.fonts.ready; } catch {}
  }
  await waitForImages(node);
  // Double RAF to let React+layout settle after font/image load.
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
}

const OPTIONS = { pixelRatio: 2, cacheBust: true, skipFonts: false };

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

export async function captureShareCardBlob(node) {
  if (!node) return null;
  await prepare(node);
  return await withTimeout(toBlob(node, OPTIONS), 6000, "share-card capture");
}

export async function captureShareCardDataUrl(node) {
  if (!node) return null;
  await prepare(node);
  return await withTimeout(toPng(node, OPTIONS), 6000, "share-card capture");
}
