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
export type { QualificationQuestion } from "./schema/qualification-questions";
export {
  getAdminQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  setQuestionActive,
  reorderQuestions,
  questionUpsertSchema,
  nextSortOrder,
  type QuestionUpsert,
} from "./admin-questions";
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
export type { Content } from "./schema/content";
export {
  listAdminGuides,
  getAdminGuide,
  createGuide,
  updateGuide,
  setGuidePublished,
  deleteGuide,
  guideUpsertSchema,
  type GuideUpsert,
  type AdminGuideRow,
} from "./admin-content";
export { contactLeadSchema, createContactLead, type ContactLead } from "./contact";
export {
  listManualListings,
  getManualListing,
  createManualListing,
  updateManualListing,
  deleteManualListing,
  manualListingSchema,
  type ManualListing,
  type AdminListingRow,
} from "./admin-listings";
export type { Listing } from "./schema/listings";
export type { SearchFilter } from "./schema/search-filters";
