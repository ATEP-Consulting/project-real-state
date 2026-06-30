import type { GetServerSideProps } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  getLeadDetail,
  getQualificationQuestions,
  type LeadDetail,
  type QualificationQuestionConfig,
} from "@herrera/db";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { StatusBadge, STATUS_LABEL } from "@/components/admin/StatusBadge";
import { StageControl } from "@/components/admin/StageControl";
import { ActivityComposer } from "@/components/admin/ActivityComposer";
import { requireAdmin } from "@/server/auth/guards";
import { formatAnswers, formatDate, isOverdue } from "@/lib/admin-leads";
import styles from "./LeadDetail.module.css";

type Props = { lead: LeadDetail; questions: QualificationQuestionConfig[] };

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const guard = await requireAdmin(ctx);
  if (guard) return guard;
  const id = String(ctx.params?.id ?? "");
  const lead = await getLeadDetail(id);
  if (!lead) return { notFound: true };
  const questions = await getQualificationQuestions(lead.intent);
  return { props: { lead, questions } };
};

function ts(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function LeadDetailPage({ lead, questions }: Props) {
  const router = useRouter();
  const answers = formatAnswers(lead.answers, questions);
  const now = new Date();
  async function complete(activityId: string) {
    const res = await fetch(`/api/admin/activities/${activityId}/complete`, { method: "POST" });
    if (res.ok) await router.replace(router.asPath, undefined, { scroll: false });
  }
  return (
    <AdminLayout title={lead.name ?? "Lead"}>
      <Link href="/admin/leads" className={styles.back}>
        ← All leads
      </Link>
      <header className={styles.head}>
        <h1 className={styles.h1}>{lead.name ?? "Unnamed lead"}</h1>
        <div className={styles.badges}>
          <StatusBadge kind="intent" value={lead.intent} />
          <StatusBadge kind="status" value={lead.status} />
        </div>
        <p className={styles.meta}>
          Captured {formatDate(lead.createdAt)} · source {lead.source ?? "—"}
        </p>
      </header>

      <div className={styles.grid}>
        <div className={styles.col}>
          <section className={styles.card}>
            <h2 className={styles.h2}>Contact</h2>
            <dl className={styles.dl}>
              <dt>Email</dt>
              <dd>{lead.email ? <a href={`mailto:${lead.email}`}>{lead.email}</a> : "—"}</dd>
              <dt>Phone</dt>
              <dd>{lead.phone ? <a href={`tel:${lead.phone}`}>{lead.phone}</a> : "—"}</dd>
              <dt>Intent</dt>
              <dd>{lead.intent}</dd>
            </dl>
          </section>

          <section className={styles.card}>
            <h2 className={styles.h2}>Qualification</h2>
            {answers.length === 0 ? (
              <p className={styles.muted}>No answers captured.</p>
            ) : (
              <dl className={styles.dl}>
                {answers.map((a) => (
                  <FragmentRow key={a.key} label={a.label} value={a.value} />
                ))}
              </dl>
            )}
          </section>

          <section className={styles.card}>
            <h2 className={styles.h2}>Viewed listings ({lead.viewedListings.length})</h2>
            {lead.viewedListings.length === 0 ? (
              <p className={styles.muted}>None recorded.</p>
            ) : (
              <ul className={styles.viewed}>
                {lead.viewedListings.map((v) => (
                  <li key={v.slug}>
                    <Link href={`/homes/${v.slug}`}>{v.title}</Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={styles.card}>
            <h2 className={styles.h2}>Consent</h2>
            {lead.consents.length === 0 ? (
              <p className={styles.muted}>No consent records.</p>
            ) : (
              <ul className={styles.consents}>
                {lead.consents.map((c) => (
                  <li key={c.id}>
                    <strong>{c.channel}</strong> · {c.granted ? "granted" : "withdrawn"} ·{" "}
                    {formatDate(c.createdAt)}
                    <span className={styles.wording}>{c.wording}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className={styles.col}>
          <section className={styles.card}>
            <h2 className={styles.h2}>Pipeline</h2>
            <StageControl leadId={lead.id} status={lead.status} />
          </section>

          <section className={styles.card}>
            <h2 className={styles.h2}>Activity</h2>
            <ActivityComposer leadId={lead.id} />
            <ul className={styles.timeline}>
              {lead.activities.map((a) => (
                <li key={a.id} className={styles.event}>
                  <span className={styles.evType}>
                    {a.type === "status_change"
                      ? `Stage → ${STATUS_LABEL[String((a.meta as { to?: string }).to)] ?? (a.meta as { to?: string }).to}`
                      : a.type}
                  </span>
                  {a.body && <span className={styles.evBody}>{a.body}</span>}
                  {a.type === "reminder" && a.dueAt && (
                    <span
                      className={`${styles.evDue} ${isOverdue(a.dueAt, a.completedAt, now) ? styles.overdue : ""}`}
                    >
                      Due {ts(a.dueAt)}
                      {a.completedAt
                        ? " · done"
                        : isOverdue(a.dueAt, a.completedAt, now)
                          ? " · overdue"
                          : ""}
                      {!a.completedAt && (
                        <button
                          type="button"
                          className={styles.doneBtn}
                          onClick={() => void complete(a.id)}
                        >
                          Mark done
                        </button>
                      )}
                    </span>
                  )}
                  <span className={styles.evWhen}>{ts(a.createdAt)}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </AdminLayout>
  );
}

function FragmentRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt>{label}</dt>
      <dd>{value || "—"}</dd>
    </>
  );
}
