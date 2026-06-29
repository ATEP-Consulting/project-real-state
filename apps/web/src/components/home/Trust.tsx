import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/motion/Reveal";
import { REALTOR } from "@/data/realtor";
import { TESTIMONIALS } from "@/data/testimonials";
import styles from "./Trust.module.css";

export function Trust() {
  return (
    <section className={styles.section}>
      <Container>
        <Reveal>
          <div className={styles.bio}>
            <div className={styles.avatar} aria-hidden="true">
              {REALTOR.monogram}
            </div>
            <div>
              <Eyebrow>{REALTOR.title}</Eyebrow>
              <h2 className={styles.name}>{REALTOR.name}</h2>
              {REALTOR.bioLong.map((p) => (
                <p key={p.slice(0, 24)} className={styles.bioText}>
                  {p}
                </p>
              ))}
              <Link href="/about">
                <Button variant="ghost">More about Nilyan</Button>
              </Link>
            </div>
          </div>

          <ul className={styles.testimonials}>
            {TESTIMONIALS.map((t) => (
              <li key={t.author} className={styles.quote}>
                <p className={styles.quoteText}>“{t.quote}”</p>
                <p className={styles.quoteAuthor}>
                  {t.author} · <span className={styles.quoteContext}>{t.context}</span>
                </p>
              </li>
            ))}
          </ul>
        </Reveal>
      </Container>
    </section>
  );
}
