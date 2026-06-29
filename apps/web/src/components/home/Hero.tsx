import { useState, type FormEvent } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import styles from "./Hero.module.css";

const HERO_IMAGE = "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1920&q=70";

export function Hero() {
  const router = useRouter();
  const [q, setQ] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    // D2 builds /search; we pass the query through now.
    void router.push(q.trim() ? `/search?q=${encodeURIComponent(q.trim())}` : "/search");
  }

  return (
    <section
      className={styles.hero}
      style={{
        backgroundImage: `linear-gradient(rgba(11,24,22,.45), rgba(11,24,22,.55)), url(${HERO_IMAGE})`,
      }}
    >
      <Container>
        <div className={styles.inner}>
          <p className={styles.eyebrow}>Florida · Licensed Realtor®</p>
          <h1 className={styles.title}>Find your place in Florida.</h1>
          <p className={styles.lede}>
            Curated properties across Miami, Coral Gables, Naples and the entire coast. Buy, sell or
            rent with confidence.
          </p>

          <form className={styles.search} onSubmit={onSubmit} role="search">
            <label className={styles.searchLabel} htmlFor="hero-search">
              Search by city, neighborhood, or ZIP
            </label>
            <div className={styles.searchRow}>
              <input
                id="hero-search"
                className={styles.input}
                type="search"
                placeholder="City, neighborhood, or ZIP"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <button type="submit" className={styles.searchBtn}>
                Search
              </button>
            </div>
          </form>

          <div className={styles.intents}>
            <span className={styles.intentsLabel}>I want to</span>
            <Link href="/buy" className={styles.intent}>
              Buy
            </Link>
            <Link href="/sell" className={styles.intent}>
              Sell
            </Link>
            <Link href="/rent" className={styles.intent}>
              Rent
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
