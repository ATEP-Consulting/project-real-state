// Curated, free-license house photos (Unsplash License). Each ID was verified to return
// HTTP 200 at seed-authoring time (2026-06-29). One swap point if we change sources.
const HOUSE_PHOTOS = [
  "1568605114967-8130f3a36994",
  "1570129477492-45c003edd2be",
  "1576941089067-2de3c901e126",
  "1605276374104-dee2a0ed3cd6",
  "1512917774080-9991f1c4c750",
  "1564013799919-ab600027ffc6",
  "1600596542815-ffad4c1539a9",
  "1600585154340-be6161a56a0c",
  "1600607687939-ce8a6c25118c",
  "1600566753086-00f18fb6b3ea",
  "1583608205776-bfd35f0d9f83",
  "1580587771525-78b9dba3b914",
  "1605146769289-440113cc3d00",
  "1512915922686-57c11dde9b6b",
  "1600210492486-724fe5c67fb0",
  "1605146768851-eda79da39897",
  "1593696140826-c58b021acf8b",
  "1598228723793-52759bba239c",
] as const;

function hash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
  return h >>> 0;
}

/** Deterministic rotating window of curated house photos for a listing. */
export function photoUrls(slug: string, count: number): { url: string }[] {
  const start = hash(slug) % HOUSE_PHOTOS.length;
  return Array.from({ length: count }, (_, i) => {
    const id = HOUSE_PHOTOS[(start + i) % HOUSE_PHOTOS.length]!;
    return { url: `https://images.unsplash.com/photo-${id}?w=1200&q=80&auto=format&fit=crop` };
  });
}
