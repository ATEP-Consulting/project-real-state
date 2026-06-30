export * as schema from "./schema/index";
export { getDb, countListings, getFeaturedListings, type DB } from "./client";
export { searchListings, type SearchListing, type SearchListingParams } from "./search";
export { getListingBySlug, getSimilarListings, getPublishedListingSlugs } from "./listings-detail";
export { getSearchFilters, type SearchFilterConfig } from "./search-filters";
export { listingInquirySchema, createListingInquiry, type ListingInquiry } from "./inquiries";
export {
  qualificationLeadSchema,
  createQualificationLead,
  getQualificationQuestions,
  type QualificationLead,
  type QualificationQuestionConfig,
} from "./qualification";
export { createLeadWithConsent, type CreateLeadInput, type LeadIntent } from "./leads-create";
export {
  listLeads,
  getPipelineCounts,
  getLeadSources,
  getLeadDetail,
  type LeadStatus,
  type LeadFilters,
  type LeadListItem,
  type LeadActivity,
  type LeadConsent,
  type ViewedListing,
  type LeadDetail,
  updateLeadStatus,
  addActivity,
  completeReminder,
  leadStatusUpdateSchema,
  activityCreateSchema,
  type ActivityCreate,
  getUncontactedLeads,
  getDueReminders,
  getSpeedToFirstContactHours,
  getNewLeadsBetween,
  getMostViewedListings,
  getDashboardData,
  type ReminderItem,
  type MostViewedListing,
  type DashboardData,
} from "./admin-leads";
export { getPublishedGuides, getGuideBySlug, type GuideSummary, type GuideDetail } from "./content";
export { contactLeadSchema, createContactLead, type ContactLead } from "./contact";
export type { Listing } from "./schema/listings";
export type { SearchFilter } from "./schema/search-filters";
