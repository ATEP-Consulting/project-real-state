import type { GetServerSideProps } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { getDashboardData, type DashboardData, type ReminderItem } from "@herrera/db";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { StatusBadge, STATUS_LABEL, STATUS_ORDER } from "@/components/admin/StatusBadge";
import { requireAdmin } from "@/server/auth/guards";
import { barPct, biggestDropoff, median, winRate } from "@/lib/admin-dashboard";
import { isOverdue, relativeAge } from "@/lib/admin-leads";
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

const HOT_VIEWS = 3;

function formatSpeed(hours: number | null): string {
  if (hours === null) return "—";
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  return `${hours.toFixed(1)}h`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export default function AdminHome({ data }: Props) {
  const router = useRouter();

  async function markDone(activityId: string) {
    const res = await fetch(`/api/admin/activities/${activityId}/complete`, { method: "POST" });
    if (res.ok) await router.replace(router.asPath, undefined, { scroll: false });
  }

  if (!data) {
    return (
      <AdminLayout title="Dashboard">
        <h1 className={styles.h1}>Welcome, Nilyan</h1>
        <p className={styles.muted}>Dashboard data is unavailable right now.</p>
      </AdminLayout>
    );
  }

  const now = new Date();
  const speed = median(data.speedHours);
  const trend = data.newThisWeek - data.newPrevWeek;
  const overdue = data.reminders.filter((r) => isOverdue(r.dueAt, null, now));
  const today = data.reminders.filter((r) => !isOverdue(r.dueAt, null, now));
  const maxStage = Math.max(1, ...STATUS_ORDER.map((s) => data.counts[s]));
  const gap = biggestDropoff(data.counts, STATUS_ORDER);

  const kpis = [
    {
      n: data.newThisWeek,
      label: "New this week",
      trend: trend === 0 ? "= same as last week" : trend > 0 ? `▲ +${trend}` : `▼ ${trend}`,
      tone: trend > 0 ? styles.kpiGood : trend < 0 ? styles.kpiWarn : undefined,
    },
    {
      n: data.counts.new,
      label: "Uncontacted",
      tone: data.counts.new > 0 ? styles.kpiDanger : styles.kpiGood,
    },
    {
      n: formatSpeed(speed),
      label: "Speed to first contact",
      tone:
        speed === null
          ? undefined
          : speed < 1
            ? styles.kpiGood
            : speed > 24
              ? styles.kpiWarn
              : undefined,
    },
    { n: `${Math.round(winRate(data.counts) * 100)}%`, label: "Win rate" },
  ];

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
            <span className={`${styles.kpiN} ${k.tone ?? ""}`}>{k.n}</span>
            <span className={styles.kpiL}>{k.label}</span>
            {k.trend && <span className={styles.kpiTrend}>{k.trend}</span>}
          </div>
        ))}
      </div>

      <section className={`${styles.card} ${styles.today}`}>
        <h2 className={styles.h2}>Needs your attention</h2>
        <div className={styles.todayGrid}>
          {/* Uncontacted — call these first */}
          <div className={styles.todayCol}>
            <p className={styles.todayHead}>
              <span className={`${styles.dot} ${styles.dotRed}`} aria-hidden="true" />
              Uncontacted
              <span className={styles.todayCount}>{data.counts.new}</span>
            </p>
            {data.uncontacted.length === 0 ? (
              <p className={styles.emptyMini}>All caught up 🎉</p>
            ) : (
              <ul className={styles.actionList}>
                {data.uncontacted.map((l) => (
                  <li key={l.id} className={styles.actionRow}>
                    <div className={styles.actionTop}>
                      <Link href={`/admin/leads/${l.id}`} className={styles.actionName}>
                        {l.name ?? "Unnamed lead"}
                      </Link>
                      {l.viewedCount >= HOT_VIEWS && (
                        <span className={styles.hot} title={`Viewed ${l.viewedCount} homes`}>
                          🔥 {l.viewedCount}
                        </span>
                      )}
                    </div>
                    <div className={styles.actionMeta}>
                      <StatusBadge kind="intent" value={l.intent} />
                      <span className={styles.actionAge}>{relativeAge(l.createdAt, now)}</span>
                    </div>
                    <div className={styles.quickRow}>
                      {l.phone && (
                        <a href={`tel:${l.phone}`} className={styles.quick}>
                          Call
                        </a>
                      )}
                      {l.email && (
                        <a href={`mailto:${l.email}`} className={styles.quick}>
                          Email
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Overdue follow-ups */}
          <div className={styles.todayCol}>
            <p className={styles.todayHead}>
              <span className={`${styles.dot} ${styles.dotAmber}`} aria-hidden="true" />
              Overdue
              <span className={styles.todayCount}>{overdue.length}</span>
            </p>
            {overdue.length === 0 ? (
              <p className={styles.emptyMini}>Nothing overdue</p>
            ) : (
              <ul className={styles.actionList}>
                {overdue.map((r) => (
                  <ReminderRow key={r.activityId} r={r} now={now} overdue onDone={markDone} />
                ))}
              </ul>
            )}
          </div>

          {/* Due today */}
          <div className={styles.todayCol}>
            <p className={styles.todayHead}>
              <span className={`${styles.dot} ${styles.dotGold}`} aria-hidden="true" />
              Due today
              <span className={styles.todayCount}>{today.length}</span>
            </p>
            {today.length === 0 ? (
              <p className={styles.emptyMini}>Nothing due today</p>
            ) : (
              <ul className={styles.actionList}>
                {today.map((r) => (
                  <ReminderRow key={r.activityId} r={r} now={now} onDone={markDone} />
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <div className={styles.grid}>
        <section className={styles.card}>
          <h2 className={styles.h2}>Pipeline</h2>
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
            {gap && (
              <p className={styles.gapNote}>
                Biggest gap: {STATUS_LABEL[gap.from]} → {STATUS_LABEL[gap.to]}
              </p>
            )}
          </div>
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
    </AdminLayout>
  );
}

function ReminderRow({
  r,
  now,
  overdue,
  onDone,
}: {
  r: ReminderItem;
  now: Date;
  overdue?: boolean;
  onDone: (id: string) => void;
}) {
  return (
    <li className={styles.actionRow}>
      <Link href={`/admin/leads/${r.leadId}`} className={styles.actionName}>
        {r.leadName ?? "Unnamed lead"}
      </Link>
      <p className={styles.reminderBody}>{r.body ?? "Follow up"}</p>
      <div className={styles.actionMeta}>
        <span className={overdue ? styles.overdue : styles.actionAge}>
          {overdue ? relativeAge(r.dueAt, now) : formatTime(r.dueAt)}
        </span>
        <button type="button" className={styles.markDone} onClick={() => onDone(r.activityId)}>
          Mark done
        </button>
      </div>
    </li>
  );
}
