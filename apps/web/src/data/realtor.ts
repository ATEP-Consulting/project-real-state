/** Sample profile for the demo. Figures/credentials are illustrative (not a real license record). */
export const REALTOR = {
  name: "Nilyan Herrera",
  title: "Licensed Florida Realtor®",
  monogram: "NH",
  email: "hola@nilyanherrera.com",
  phone: "+1 (305) 555 0148",
  office: "2000 Ponce de Leon Blvd, Coral Gables, FL",
  hours: "Mon–Sat 9–19h",
  license: "FL License #SL3492210",
  memberOf: "Member of Miami REALTORS®",
  reviews: 98,
  rating: 5,
  copyrightYear: 2026,
  // Sample portrait (free-license). Replace with Nilyan's real photo before launch.
  photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=900&q=70",
  stats: [
    { value: "12", label: "years" },
    { value: "240+", label: "deals closed" },
    { value: "$480M", label: "sold" },
  ],
  bioShort: "Premium real estate guidance in Florida — buy, sell and rent with confidence.",
  bioLong: [
    "Licensed Realtor® in Florida specializing in residential property across Miami-Dade, Broward, and the Gulf coast. I guide buyers and sellers with a close, honest approach and a local network that opens doors.",
    "Every client gets a clear read on the numbers that matter in Florida — insurance, flood exposure, HOA and CDD fees, and the real monthly cost of ownership, not just the list price.",
  ],
} as const;
