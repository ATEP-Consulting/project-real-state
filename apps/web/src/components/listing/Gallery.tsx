import { useCallback, useEffect, useState } from "react";
import type { GalleryImage } from "@/lib/listing-detail";
import styles from "./Gallery.module.css";

type Slide =
  | { kind: "photo"; src: string; alt: string; caption: string | null }
  | { kind: "video"; src: string }
  | { kind: "tour"; src: string };

/**
 * A Redfin/Idealista-style photo mosaic (one large tile + a 2×2 grid) that opens a full-screen
 * lightbox on click — navigate photo→photo at full size with arrows / keyboard, no tiny thumbnails.
 * Video + virtual tour, when present, are extra slides reachable from chips on the hero tile.
 */
export function Gallery({
  gallery,
  video,
  virtualTourUrl,
}: {
  gallery: GalleryImage[];
  video: string | null;
  virtualTourUrl: string | null;
}) {
  const slides: Slide[] = [
    ...gallery.map((g): Slide => ({ kind: "photo", src: g.url, alt: g.alt, caption: g.caption })),
    ...(video ? [{ kind: "video" as const, src: video }] : []),
    ...(virtualTourUrl ? [{ kind: "tour" as const, src: virtualTourUrl }] : []),
  ];

  const [open, setOpen] = useState<number | null>(null);
  const close = useCallback(() => setOpen(null), []);
  const go = useCallback(
    (d: number) => setOpen((i) => (i == null ? i : (i + d + slides.length) % slides.length)),
    [slides.length],
  );

  useEffect(() => {
    if (open == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, close, go]);

  if (slides.length === 0) return <div className={styles.empty} aria-hidden />;

  const tiles = gallery.slice(0, 5); // 1 hero + up to 4 in the 2×2
  const photoCount = gallery.length;
  const videoIdx = slides.findIndex((s) => s.kind === "video");
  const tourIdx = slides.findIndex((s) => s.kind === "tour");
  const cur = open == null ? null : (slides[open] ?? null);

  return (
    <>
      <div className={styles.mosaic} data-count={tiles.length}>
        {tiles.map((g, i) => (
          <button
            key={g.url}
            type="button"
            className={i === 0 ? styles.hero : styles.tile}
            onClick={() => setOpen(i)}
            aria-label={`Open photo ${i + 1} of ${photoCount}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={g.url} alt={g.alt} loading={i === 0 ? "eager" : "lazy"} />
            {i === tiles.length - 1 && photoCount > tiles.length && (
              <span className={styles.more}>▦ View {photoCount} photos</span>
            )}
            {i === 0 && photoCount > 1 && (
              <span className={styles.heroCount}>▦ {photoCount} photos</span>
            )}
          </button>
        ))}
        {(video || virtualTourUrl) && (
          <div className={styles.chips}>
            {video && (
              <button type="button" className={styles.chip} onClick={() => setOpen(videoIdx)}>
                ▶ Video
              </button>
            )}
            {virtualTourUrl && (
              <button type="button" className={styles.chip} onClick={() => setOpen(tourIdx)}>
                3D tour
              </button>
            )}
          </div>
        )}
      </div>

      {cur && (
        <div className={styles.lightbox} role="dialog" aria-modal="true" aria-label="Photo gallery">
          <button type="button" className={styles.close} onClick={close} aria-label="Close gallery">
            ×
          </button>
          <span className={styles.counter}>
            {open! + 1} / {slides.length}
          </span>
          {slides.length > 1 && (
            <button
              type="button"
              className={`${styles.nav} ${styles.prev}`}
              onClick={() => go(-1)}
              aria-label="Previous"
            >
              ‹
            </button>
          )}
          <div className={styles.stage} onClick={close}>
            <div className={styles.stageInner} onClick={(e) => e.stopPropagation()}>
              {cur.kind === "photo" ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={cur.src} alt={cur.alt} className={styles.lbImg} />
                  {cur.caption && <p className={styles.caption}>{cur.caption}</p>}
                </>
              ) : (
                <iframe
                  className={styles.lbFrame}
                  src={cur.src}
                  title={cur.kind === "video" ? "Property video" : "Virtual tour"}
                  allowFullScreen
                />
              )}
            </div>
          </div>
          {slides.length > 1 && (
            <button
              type="button"
              className={`${styles.nav} ${styles.next}`}
              onClick={() => go(1)}
              aria-label="Next"
            >
              ›
            </button>
          )}
        </div>
      )}
    </>
  );
}
