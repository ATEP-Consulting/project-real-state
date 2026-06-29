import styles from "./MapMockup.module.css";

/** Presentational teaser for the synced map-search screen (built for real in D2). */
export function MapMockup() {
  return (
    <div className={styles.card} aria-hidden="true">
      <div className={styles.bar}>
        <span className={styles.search}>Coral Gables, FL</span>
        <span className={styles.draw}>✎ Draw zone</span>
      </div>
      <div className={styles.map}>
        <div className={styles.zone} />
        <span className={`${styles.pin} ${styles.pinDark}`} style={{ top: "30%", left: "34%" }}>
          $2.4M
        </span>
        <span className={`${styles.pin} ${styles.pinBronze}`} style={{ top: "46%", left: "60%" }}>
          $1.6M
        </span>
        <span className={`${styles.pin} ${styles.pinDark}`} style={{ top: "64%", left: "40%" }}>
          $890K
        </span>
        <span className={styles.count}>37 properties in your zone</span>
      </div>
    </div>
  );
}
