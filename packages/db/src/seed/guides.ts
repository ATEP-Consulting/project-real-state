import type { NewContent } from "../schema/content";

// Factual, geography-neutral lead-magnet guides (work for Miami or anywhere in FL).
// Facts only — no steering. Cost/insurance figures are described as ESTIMATES that vary.
// Body is plain text; blank lines separate paragraphs (the page renders them as <p>).
const CTA = "\n\nHave questions about your situation? Get in touch — Nilyan replies personally.";
const CTA_ES =
  "\n\n¿Tienes preguntas sobre tu situación? Contáctanos — Nilyan responde personalmente.";

export const GUIDES: NewContent[] = [
  {
    type: "guide",
    status: "published",
    slug: "florida-flood-zones-and-insurance",
    title: "Florida flood zones & insurance, explained",
    titleEs: "Zonas de inundación en Florida y seguro contra inundaciones, explicados",
    excerpt:
      "What FEMA flood zones mean for a Florida home, and how flood insurance is priced — in plain English.",
    excerptEs:
      "Qué significan las zonas de inundación FEMA para una propiedad en Florida y cómo se calcula el seguro contra inundaciones — explicado con claridad.",
    heroImageUrl: "https://images.unsplash.com/photo-1547683905-f686c993aae5?w=1200&q=70",
    metaTitle: "Florida flood zones & flood insurance, explained — Herrera",
    metaTitleEs: "Zonas de inundación en Florida y seguro contra inundaciones — Herrera",
    metaDescription:
      "A plain-English guide to FEMA flood zones in Florida and how flood insurance is estimated, so you can budget before you buy.",
    metaDescriptionEs:
      "Una guía clara sobre las zonas de inundación FEMA en Florida y cómo se estima el seguro contra inundaciones, para que puedas presupuestar antes de comprar.",
    publishedAt: new Date("2026-05-10T12:00:00Z"),
    body:
      "Every property in Florida sits in a FEMA flood zone. The zone is a factual designation based on FEMA flood maps — it is not a judgement about a neighborhood, only about flood risk for that location.\n\n" +
      "Zones beginning with A or V are Special Flood Hazard Areas: if you have a federally backed mortgage there, flood insurance is generally required. Zones labelled X are outside the high-risk area, where flood insurance is optional but often still worth considering.\n\n" +
      "Flood insurance premiums are an ESTIMATE until a carrier quotes your specific property. They depend on the zone, the home's elevation, its construction, and coverage limits. Two homes on the same street can differ. Always treat any number you see online — including ours — as a starting estimate, not a quote.\n\n" +
      "Before you make an offer, it's worth knowing the zone, asking for an elevation certificate if one exists, and getting a real quote. That way the monthly cost of ownership holds no surprises." +
      CTA,
    bodyEs:
      "Toda propiedad en Florida se encuentra dentro de una zona de inundación FEMA. La zona es una designación factual basada en los mapas de inundación de FEMA — no es un juicio sobre ninguna área, sino únicamente sobre el riesgo de inundación de esa ubicación específica.\n\n" +
      "Las zonas que comienzan con A o V son Áreas de Riesgo Especial de Inundación: si tienes una hipoteca respaldada por el gobierno federal, el seguro contra inundaciones generalmente es obligatorio. Las zonas etiquetadas con X están fuera del área de alto riesgo, donde el seguro es opcional, aunque a menudo sigue siendo recomendable.\n\n" +
      "Las primas del seguro contra inundaciones son un ESTIMADO hasta que una aseguradora cotice tu propiedad específica. Dependen de la zona, la elevación de la vivienda, su construcción y los límites de cobertura. Dos casas en la misma calle pueden tener costos muy distintos. Trata siempre cualquier cifra que veas en línea — incluyendo la nuestra — como un estimado inicial, no como una cotización.\n\n" +
      "Antes de hacer una oferta, vale la pena conocer la zona, solicitar un certificado de elevación si existe uno, y obtener una cotización real. Así, el costo mensual de la propiedad no tendrá sorpresas." +
      CTA_ES,
  },
  {
    type: "guide",
    status: "published",
    slug: "hoa-vs-cdd-in-florida",
    title: "HOA vs CDD fees in Florida",
    titleEs: "Cuotas HOA vs CDD en Florida",
    excerpt:
      "Two very different line items on a Florida home's monthly cost — what each one pays for, and why it matters.",
    excerptEs:
      "Dos cargos muy distintos en el costo mensual de una vivienda en Florida — qué cubre cada uno y por qué importa.",
    heroImageUrl: "https://images.unsplash.com/photo-1448630360428-65456885c650?w=1200&q=70",
    metaTitle: "HOA vs CDD fees in Florida — what's the difference? — Herrera",
    metaTitleEs: "Cuotas HOA vs CDD en Florida — ¿cuál es la diferencia? — Herrera",
    metaDescription:
      "HOA and CDD fees both add to a Florida home's monthly cost but work very differently. Here's what each pays for.",
    metaDescriptionEs:
      "Las cuotas HOA y CDD ambas aumentan el costo mensual de una vivienda en Florida, pero funcionan de manera muy diferente. Aquí explicamos qué cubre cada una.",
    publishedAt: new Date("2026-05-20T12:00:00Z"),
    body:
      "Many Florida communities carry an HOA fee, a CDD assessment, or both. They sound similar but are not the same thing.\n\n" +
      "An HOA (Homeowners Association) fee is paid to a private association that maintains shared amenities and common areas — think landscaping, a pool, or a clubhouse — and enforces community rules. It's ongoing for as long as you own the home.\n\n" +
      "A CDD (Community Development District) assessment repays the bonds that funded a community's core infrastructure — roads, water, and drainage — usually collected on your annual property tax bill. CDD debt is typically for a fixed term and can eventually be paid off, after which only a smaller operations-and-maintenance portion remains.\n\n" +
      "When you compare two homes, compare the FULL monthly picture: mortgage, taxes, insurance, HOA, and any CDD. A lower sticker price with high HOA + CDD can cost more month to month than a higher price with neither. The figures on a listing are estimates — confirm current amounts with the association and county before you commit." +
      CTA,
    bodyEs:
      "Muchas comunidades en Florida tienen una cuota HOA, una evaluación CDD, o ambas. Suenan similares, pero no son lo mismo.\n\n" +
      "Una cuota HOA (Asociación de Propietarios) se paga a una asociación privada que mantiene las amenidades compartidas y las áreas comunes — jardines, piscina, club comunitario — y hace cumplir las normas de la comunidad. Esta cuota es continua durante todo el tiempo que seas propietario.\n\n" +
      "Una evaluación CDD (Distrito de Desarrollo Comunitario) reembolsa los bonos que financiaron la infraestructura básica de la comunidad — calles, agua y drenaje — y generalmente se cobra en tu factura anual de impuestos sobre la propiedad. La deuda CDD suele ser por un plazo fijo y eventualmente puede liquidarse; tras eso, solo queda una parte menor de operaciones y mantenimiento.\n\n" +
      "Al comparar dos viviendas, compara el panorama mensual COMPLETO: hipoteca, impuestos, seguro, HOA y cualquier CDD. Un precio de lista más bajo con HOA + CDD altos puede costar más mensualmente que un precio más alto sin ninguno de los dos. Las cifras en un listado son estimados — confirma los montos actuales con la asociación y el condado antes de comprometerte." +
      CTA_ES,
  },
  {
    type: "guide",
    status: "published",
    slug: "first-time-buyer-guide-florida",
    title: "A first-time buyer's guide to Florida",
    titleEs: "Guía para compradores de vivienda por primera vez en Florida",
    excerpt:
      "The steps from 'thinking about it' to keys in hand, and what to budget for beyond the purchase price.",
    excerptEs:
      "Los pasos desde 'estoy pensándolo' hasta tener las llaves en mano, y qué presupuestar más allá del precio de compra.",
    heroImageUrl: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=70",
    metaTitle: "A first-time buyer's guide to Florida — Herrera",
    metaTitleEs: "Guía para compradores de vivienda por primera vez en Florida — Herrera",
    metaDescription:
      "A clear, step-by-step guide for first-time buyers in Florida: getting pre-approved, making an offer, and the real cost of ownership.",
    metaDescriptionEs:
      "Una guía clara paso a paso para compradores de vivienda por primera vez en Florida: preaprobación, hacer una oferta y el costo real de ser propietario.",
    publishedAt: new Date("2026-06-01T12:00:00Z"),
    body:
      "Buying your first home is mostly about removing surprises. Here's the shape of the process in Florida.\n\n" +
      "Start with financing. A mortgage pre-approval tells you a realistic budget and makes your offer stronger. It's worth doing before you fall for a home.\n\n" +
      "Then search with the full cost in mind. In Florida the purchase price is only part of the monthly picture: property taxes, home insurance, possible flood insurance, and any HOA or CDD all add up. A home that fits the price but not the monthly budget isn't a fit. Every such figure is an estimate until quoted.\n\n" +
      "When you find the one, you'll make an offer, agree on terms, and move into inspections and the appraisal. An inspection protects you from expensive unknowns; an appraisal protects the lender. Once those clear and financing is final, you close and get the keys.\n\n" +
      "A good agent's job is to keep each step calm and on schedule, and to make sure the numbers — including the ongoing cost of ownership — are clear before you sign." +
      CTA,
    bodyEs:
      "Comprar tu primera vivienda es, en gran parte, eliminar sorpresas. Así es el proceso en Florida.\n\n" +
      "Empieza con el financiamiento. Una preaprobación hipotecaria te indica un presupuesto realista y hace tu oferta más sólida. Vale la pena obtenerla antes de enamorarte de una propiedad.\n\n" +
      "Luego busca con el costo total en mente. En Florida, el precio de compra es solo una parte del panorama mensual: los impuestos sobre la propiedad, el seguro de hogar, el posible seguro contra inundaciones y cualquier HOA o CDD se suman. Una vivienda que cabe en el precio pero no en el presupuesto mensual no es la adecuada. Cada cifra es un estimado hasta que sea cotizada.\n\n" +
      "Cuando encuentres la indicada, harás una oferta, acordarás términos y pasarás a las inspecciones y la tasación. Una inspección te protege de costosas sorpresas; una tasación protege al prestamista. Una vez que todo eso quede claro y el financiamiento sea definitivo, cierras y recibes las llaves.\n\n" +
      "El trabajo de un buen agente es mantener cada paso tranquilo y a tiempo, y asegurarse de que los números — incluyendo el costo continuo de ser propietario — estén claros antes de que firmes." +
      CTA_ES,
  },
];
