import { Skeleton } from "@/components/ui/Skeleton";
import styles from "./LeadCaptureFlow.module.css";

/**
 * Loading placeholder shaped like the real LeadCaptureFlow so the overlay shows
 * structure (not a bare "Loading…") and the layout doesn't jump when questions
 * arrive. Reuses the flow's panel/step/option classes for pixel consistency.
 */
export function FlowSkeleton() {
  return (
    <div className={styles.panel} role="status" aria-busy="true" aria-label="Loading the form">
      <div className={styles.progressTrack}>
        <div className={styles.progressBar} style={{ width: "12%" }} />
      </div>
      <Skeleton width={150} height={11} />
      <div className={styles.stepBody}>
        <Skeleton width="78%" height={28} radius={6} />
        <div style={{ height: 22 }} />
        <div className={styles.options}>
          <Skeleton height={52} radius={6} />
          <Skeleton height={52} radius={6} />
          <Skeleton height={52} radius={6} />
        </div>
      </div>
      <div className={styles.nav}>
        <Skeleton width={64} height={18} />
        <Skeleton width={128} height={46} radius={6} />
      </div>
    </div>
  );
}
