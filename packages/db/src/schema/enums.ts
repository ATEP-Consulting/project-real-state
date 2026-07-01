import { pgEnum } from "drizzle-orm/pg-core";

// ADR-005 — provenance + visibility + status
export const listingSource = pgEnum("listing_source", ["mls", "manual", "mock"]);
export const listingVisibility = pgEnum("listing_visibility", [
  "public",
  "registered",
  "private_link",
]);
export const listingStatus = pgEnum("listing_status", ["active", "pending", "sold", "off_market"]);
export const propertyType = pgEnum("property_type", [
  "single_family",
  "condo",
  "townhouse",
  "multi_family",
  "villa",
  "co_op",
  "land",
  "mobile",
  "other",
]);

// ADR-007/008 — leads + pipeline
export const leadIntent = pgEnum("lead_intent", ["buy", "sell", "rent"]);
export const leadStatus = pgEnum("lead_status", [
  "new",
  "contacted",
  "qualified",
  "appointment",
  "offer",
  "closed",
  "lost",
]);

// ADR-011 — per-channel consent + suppression share one channel enum
export const contactChannel = pgEnum("contact_channel", ["email", "phone", "sms", "whatsapp"]);

// ADR-011/020 — consent purpose: transactional (reply to this enquiry, required) vs
// marketing (optional opt-in gating Phase 2 campaigns). Existing rows are transactional.
export const consentPurpose = pgEnum("consent_purpose", ["transactional", "marketing"]);

// ADR-008 — CRM activities
export const activityType = pgEnum("activity_type", [
  "call",
  "note",
  "status_change",
  "reminder",
  "email",
  "meeting",
]);

// ADR-007 — configurable questions
export const questionType = pgEnum("question_type", [
  "single_select",
  "multi_select",
  "text",
  "number",
  "boolean",
  "range",
]);

// ADR-007/012 (D3) — control type for an admin-configurable search filter
export const searchFilterControl = pgEnum("search_filter_control", [
  "range", // numeric min/max (price)
  "min_select", // "Any / 1+ / 2+ …" (beds, baths)
  "enum_select", // pick from options, multi (property type)
  "boolean", // toggle (waterfront, pool, 55+, no-HOA)
]);

// ADR-008/015 — editable content
export const contentType = pgEnum("content_type", ["area", "neighborhood", "guide", "page"]);
export const contentStatus = pgEnum("content_status", ["draft", "published"]);
