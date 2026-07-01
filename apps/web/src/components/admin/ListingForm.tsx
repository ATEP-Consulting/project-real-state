import { useRouter } from "next/router";
import { useState } from "react";
import type { Listing } from "@herrera/db";
import f from "./AdminForm.module.css";

const PROPERTY_TYPES = [
  "single_family",
  "condo",
  "townhouse",
  "multi_family",
  "villa",
  "co_op",
  "land",
  "mobile",
  "other",
] as const;
const VISIBILITY = [
  { v: "public", label: "Public — shown in search, sitemap, everywhere" },
  { v: "registered", label: "Registered-only — hidden from the public site" },
  { v: "private_link", label: "Private link — only reachable via the direct URL you share" },
] as const;
const STATUS = ["active", "pending", "sold", "off_market"] as const;

type FormState = {
  addressLine1: string;
  addressLine2: string;
  city: string;
  zip: string;
  state: string;
  price: string;
  propertyType: string;
  bedrooms: string;
  bathrooms: string;
  sqft: string;
  yearBuilt: string;
  description: string;
  descriptionEs: string;
  visibility: string;
  status: string;
  latitude: string;
  longitude: string;
  photos: string;
};

const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));

function fromListing(l: Listing | undefined): FormState {
  return {
    addressLine1: str(l?.addressLine1),
    addressLine2: str(l?.addressLine2),
    city: str(l?.city),
    zip: str(l?.zip),
    state: l?.state ?? "FL",
    price: str(l?.price),
    propertyType: l?.propertyType ?? "single_family",
    bedrooms: str(l?.bedrooms),
    bathrooms: str(l?.bathrooms),
    sqft: str(l?.sqft),
    yearBuilt: str(l?.yearBuilt),
    description: str(l?.description),
    descriptionEs: str(l?.descriptionEs),
    visibility: l?.visibility ?? "private_link",
    status: l?.status ?? "off_market",
    latitude: str(l?.latitude),
    longitude: str(l?.longitude),
    photos: (l?.photos ?? []).map((p) => p.url).join("\n"),
  };
}

const num = (s: string) => (s.trim() === "" ? undefined : Number(s));

export function ListingForm({ initial, listingId }: { initial?: Listing; listingId?: string }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => fromListing(initial));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof FormState) => (e: { target: { value: string } }) =>
    setForm((s) => ({ ...s, [k]: e.target.value }));

  async function submit() {
    setBusy(true);
    setError(null);
    const payload = {
      propertyType: form.propertyType,
      price: num(form.price),
      addressLine1: form.addressLine1.trim(),
      addressLine2: form.addressLine2.trim() || null,
      city: form.city.trim(),
      state: form.state.trim() || "FL",
      zip: form.zip.trim(),
      bedrooms: num(form.bedrooms),
      bathrooms: num(form.bathrooms),
      sqft: num(form.sqft),
      yearBuilt: num(form.yearBuilt),
      description: form.description.trim() || null,
      descriptionEs: form.descriptionEs.trim() || null,
      visibility: form.visibility,
      status: form.status,
      latitude: num(form.latitude),
      longitude: num(form.longitude),
      photos: form.photos
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
    };
    try {
      const res = await fetch(
        listingId ? `/api/admin/listings/${listingId}` : "/api/admin/listings",
        {
          method: listingId ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!res.ok) {
        setError("Could not save — check address, city, ZIP and a positive price.");
        setBusy(false);
        return;
      }
      await router.push("/admin/listings");
    } catch {
      setError("Network error — please try again.");
      setBusy(false);
    }
  }

  return (
    <section className={f.panel}>
      <div className={`${f.grid} ${f.grid2}`}>
        <label className={f.field}>
          <span className={f.label}>Address</span>
          <input className={f.input} value={form.addressLine1} onChange={set("addressLine1")} />
        </label>
        <label className={f.field}>
          <span className={f.label}>
            Address line 2 <span className={f.hint}>optional</span>
          </span>
          <input className={f.input} value={form.addressLine2} onChange={set("addressLine2")} />
        </label>
        <label className={f.field}>
          <span className={f.label}>City</span>
          <input className={f.input} value={form.city} onChange={set("city")} />
        </label>
        <label className={f.field}>
          <span className={f.label}>ZIP</span>
          <input className={f.input} value={form.zip} onChange={set("zip")} />
        </label>
        <label className={f.field}>
          <span className={f.label}>State</span>
          <input className={f.input} value={form.state} onChange={set("state")} />
        </label>
        <label className={f.field}>
          <span className={f.label}>Price (USD)</span>
          <input className={f.input} type="number" value={form.price} onChange={set("price")} />
        </label>
        <label className={f.field}>
          <span className={f.label}>Property type</span>
          <select className={f.select} value={form.propertyType} onChange={set("propertyType")}>
            {PROPERTY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className={f.field}>
          <span className={f.label}>Beds</span>
          <input
            className={f.input}
            type="number"
            value={form.bedrooms}
            onChange={set("bedrooms")}
          />
        </label>
        <label className={f.field}>
          <span className={f.label}>Baths</span>
          <input
            className={f.input}
            type="number"
            step="0.5"
            value={form.bathrooms}
            onChange={set("bathrooms")}
          />
        </label>
        <label className={f.field}>
          <span className={f.label}>Sqft</span>
          <input className={f.input} type="number" value={form.sqft} onChange={set("sqft")} />
        </label>
        <label className={f.field}>
          <span className={f.label}>Year built</span>
          <input
            className={f.input}
            type="number"
            value={form.yearBuilt}
            onChange={set("yearBuilt")}
          />
        </label>
      </div>

      <label className={f.field} style={{ marginTop: 14 }}>
        <span className={f.label}>Description</span>
        <textarea className={f.textarea} value={form.description} onChange={set("description")} />
      </label>

      <label className={f.field} style={{ marginTop: 14 }}>
        <span className={f.label}>
          Description (Spanish) <span className={f.hint}>optional — shown to Spanish-language visitors</span>
        </span>
        <textarea
          className={f.textarea}
          value={form.descriptionEs}
          onChange={set("descriptionEs")}
          lang="es"
        />
      </label>

      <div className={`${f.grid} ${f.grid2}`} style={{ marginTop: 14 }}>
        <label className={f.field}>
          <span className={f.label}>Visibility</span>
          <select className={f.select} value={form.visibility} onChange={set("visibility")}>
            {VISIBILITY.map((o) => (
              <option key={o.v} value={o.v}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className={f.field}>
          <span className={f.label}>Status</span>
          <select className={f.select} value={form.status} onChange={set("status")}>
            {STATUS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className={f.field}>
          <span className={f.label}>
            Latitude <span className={f.hint}>optional — needed to show on the map</span>
          </span>
          <input
            className={f.input}
            type="number"
            step="0.000001"
            value={form.latitude}
            onChange={set("latitude")}
          />
        </label>
        <label className={f.field}>
          <span className={f.label}>
            Longitude <span className={f.hint}>optional</span>
          </span>
          <input
            className={f.input}
            type="number"
            step="0.000001"
            value={form.longitude}
            onChange={set("longitude")}
          />
        </label>
      </div>

      <label className={f.field} style={{ marginTop: 14 }}>
        <span className={f.label}>
          Photos <span className={f.hint}>one image URL per line</span>
        </span>
        <textarea className={f.textarea} value={form.photos} onChange={set("photos")} />
      </label>

      {error && <p className={f.error}>{error}</p>}
      <div className={f.formActions}>
        <button
          type="button"
          className={`${f.btn} ${f.btnPrimary}`}
          disabled={busy}
          onClick={() => void submit()}
        >
          {busy ? "Saving…" : listingId ? "Save changes" : "Create listing"}
        </button>
        <button type="button" className={f.btn} onClick={() => void router.push("/admin/listings")}>
          Cancel
        </button>
      </div>
    </section>
  );
}
