import { useState } from "react";
import type { GalleryImage } from "@/lib/listing-detail";
import styles from "./PhotoGallery.module.css";

type View = { kind: "photo"; i: number } | { kind: "video" } | { kind: "tour" };

export function PhotoGallery({
  gallery,
  video,
  virtualTourUrl,
}: {
  gallery: GalleryImage[];
  video: string | null;
  virtualTourUrl: string | null;
}) {
  const [view, setView] = useState<View>({ kind: "photo", i: 0 });
  if (gallery.length === 0 && !video && !virtualTourUrl) {
    return <div className={styles.empty} aria-hidden />;
  }
  const active = view.kind === "photo" ? gallery[view.i] : undefined;
  return (
    <div className={styles.wrap}>
      <div className={styles.stage}>
        {view.kind === "photo" && active && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={active.url} alt={active.alt} className={styles.stageImg} />
        )}
        {view.kind === "video" && video && (
          <iframe
            className={styles.frame}
            src={video}
            title="Property video"
            allowFullScreen
            loading="lazy"
          />
        )}
        {view.kind === "tour" && virtualTourUrl && (
          <iframe
            className={styles.frame}
            src={virtualTourUrl}
            title="Virtual tour"
            allowFullScreen
            loading="lazy"
          />
        )}
        <div className={styles.modes}>
          {gallery.length > 0 && (
            <button
              type="button"
              className={styles.mode}
              aria-pressed={view.kind === "photo"}
              onClick={() => setView({ kind: "photo", i: 0 })}
            >
              Photos
            </button>
          )}
          {video && (
            <button
              type="button"
              className={styles.mode}
              aria-pressed={view.kind === "video"}
              onClick={() => setView({ kind: "video" })}
            >
              ▶ Video
            </button>
          )}
          {virtualTourUrl && (
            <button
              type="button"
              className={styles.mode}
              aria-pressed={view.kind === "tour"}
              onClick={() => setView({ kind: "tour" })}
            >
              3D tour
            </button>
          )}
        </div>
      </div>
      {gallery.length > 1 && (
        <div className={styles.rail} role="listbox" aria-label="Photos">
          {gallery.map((g, i) => (
            <button
              type="button"
              key={g.url}
              role="option"
              aria-selected={view.kind === "photo" && view.i === i}
              className={`${styles.thumb} ${view.kind === "photo" && view.i === i ? styles.thumbOn : ""}`}
              onClick={() => setView({ kind: "photo", i })}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={g.url} alt={g.alt} loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
