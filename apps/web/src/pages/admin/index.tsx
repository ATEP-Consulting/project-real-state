import type { GetServerSideProps } from "next";
import Link from "next/link";
import { getDashboardData, type DashboardData } from "@herrera/db";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { STATUS_LABEL, STATUS_ORDER } from "@/components/admin/StatusBadge";
import { requireAdmin } from "@/server/auth/guards";
import { activeCount, barPct, donutSegments, winRate } from "@/lib/admin-dashboard";
import styles from "./Dashboard.module.css";

type Props = { data: DashboardData | null };

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const guard = await requireAdmin(ctx);
  if (guard) return guard;
  let data: DashboardData | null = null;
  try {
    data = await getDashboardData();
  } catch (e) {
    console.warn("[admin] dashboard data unavailable:", (e as Error).message);
  }
  return { props: { data } };
};

const SOURCE_COLORS = [
  "var(--color-forest)",
  "var(--color-bronze)",
  "var(--color-sage-alt)",
  "var(--color-olive)",
  "var(--color-stone)",
];
const DONUT_C = 264; // ≈ 2πr for r=42

function SourceDonut({ data }: { data: DashboardData }) {
  const segs = donutSegments(
    data.bySource.map((s) => s.count),
    DONUT_C,
  );
  return (
    <div className={styles.donutWrap}>
      <svg viewBox="0 0 100 100" className={styles.donut} role="img" aria-label="Leads por fuente">
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="var(--color-sand-200)"
          strokeWidth="14"
        />
        {data.bySource.map((s, i) => (
          <circle
            key={s.source}
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke={SOURCE_COLORS[i % SOURCE_COLORS.length]}
            strokeWidth="14"
            strokeDasharray={`${segs[i]!.len} ${DONUT_C - segs[i]!.len}`}
            strokeDashoffset={segs[i]!.offset}
            transform="rotate(-90 50 50)"
          />
        ))}
        <text x="50" y="47" textAnchor="middle" className={styles.donutNum}>
          {data.total}
        </text>
        <text x="50" y="60" textAnchor="middle" className={styles.donutSub}>
          leads
        </text>
      </svg>
      <ul className={styles.legend}>
        {data.bySource.map((s, i) => (
          <li key={s.source}>
            <span
              className={styles.swatch}
              style={{ background: SOURCE_COLORS[i % SOURCE_COLORS.length] }}
            />
            <span className={styles.legendLabel}>{s.source}</span>
            <span className={styles.legendVal}>
              {s.count} · {segs[i]!.pct}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AdminHome({ data }: Props) {
  if (!data) {
    return (
      <AdminLayout title="Dashboard">
        <h1 className={styles.h1}>Welcome, Nilyan</h1>
        <p className={styles.muted}>Dashboard data is unavailable right now.</p>
      </AdminLayout>
    );
  }

  const kpis = [
    { n: data.total, label: "Total leads" },
    { n: data.newThisWeek, label: "New this week" },
    { n: `${Math.round(winRate(data.counts) * 100)}%`, label: "Win rate" },
    { n: activeCount(data.counts), label: "Active" },
  ];
  const maxStage = Math.max(1, ...STATUS_ORDER.map((s) => data.counts[s]));

  return (
    <AdminLayout title="Dashboard">
      <header className={styles.head}>
        <h1 className={styles.h1}>Welcome, Nilyan</h1>
        <Link href="/admin/leads" className={styles.inboxLink}>
          Open lead inbox →
        </Link>
      </header>

      <div className={styles.kpis}>
        {kpis.map((k) => (
          <div key={k.label} className={styles.kpi}>
            <span className={styles.kpiN}>{k.n}</span>
            <span className={styles.kpiL}>{k.label}</span>
          </div>
        ))}
      </div>

      <div className={styles.grid}>
        <section className={styles.card}>
          <h2 className={styles.h2}>Pipeline conversion</h2>
          <div className={styles.funnel}>
            {STATUS_ORDER.map((s) => (
              <div key={s} className={styles.fRow}>
                <span className={styles.fLabel}>{STATUS_LABEL[s]}</span>
                <span className={styles.fTrack}>
                  <span
                    className={styles.fBar}
                    style={{ width: `${barPct(data.counts[s], maxStage)}%` }}
                  />
                </span>
                <span className={styles.fVal}>{data.counts[s]}</span>
              </div>
            ))}
            <p className={styles.lostNote}>
              Lost: <strong>{data.counts.lost}</strong>
            </p>
          </div>
        </section>

        <div className={styles.side}>
          <section className={styles.card}>
            <h2 className={styles.h2}>Leads by source</h2>
            {data.bySource.length === 0 ? (
              <p className={styles.muted}>No leads yet.</p>
            ) : (
              <SourceDonut data={data} />
            )}
          </section>

          <section className={styles.card}>
            <h2 className={styles.h2}>Most-viewed listings</h2>
            {data.mostViewed.length === 0 ? (
              <p className={styles.muted}>No viewing history yet.</p>
            ) : (
              <ol className={styles.viewed}>
                {data.mostViewed.map((m) => (
                  <li key={m.slug}>
                    <Link href={`/homes/${m.slug}`} className={styles.viewedName}>
                      {m.title}
                    </Link>
                    <span className={styles.viewedTrack} aria-hidden="true">
                      <span
                        className={styles.viewedBar}
                        style={{ width: `${barPct(m.count, data.mostViewed[0]!.count)}%` }}
                      />
                    </span>
                    <span className={styles.viewedVal}>{m.count}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </div>
    </AdminLayout>
  );
}
