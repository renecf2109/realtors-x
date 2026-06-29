export type Property = {
  id: string;
  agent_id: string;
  title: string;
  price: number | null;
  price_status: string | null;
  location: string;
  bedrooms: number;
  bathrooms: number;
  size: number;
  type: string;
  description: string;
  features: string[];
  images: string[];
  project_name: string | null;
  investment_opportunity: boolean;
  expected_roi: number | null;
  completion_date: string | null;
  developer_name: string | null;
  show_developer_to_public: boolean;
  availability: "available" | "booked" | "reserved" | "sold" | "rented" | "draft" | "inactive" | "pending" | "under_construction";
  created_at: string;
};

export type Lead = {
  id: string;
  name: string;
  phone: string;
  budget: number;
  preferred_area: string;
  move_in_date: string | null;
  requested_property_type: string;
  property_ids: string[];
  inquiry: string | null;
  assigned_agent_id: string | null;
  created_at: string;
};

export type AgentProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  whatsapp_phone: string | null;
  role: "admin" | "agent" | "lead";
};

export type PropertyInput = Omit<Property, "id" | "agent_id" | "created_at">;

export type FeaturedMediaType = "image" | "video";
export type FeaturedMediaPlacement = "homepage_hero" | "homepage_strip" | "gallery" | "dashboard" | "listing_featured";

export type FeaturedMedia = {
  id: string;
  title: string;
  description: string;
  media_type: FeaturedMediaType;
  media_url: string;
  thumbnail_url: string | null;
  placement: FeaturedMediaPlacement;
  link_url: string | null;
  sort_order: number;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type FeaturedMediaInput = Omit<FeaturedMedia, "id" | "created_by" | "created_at" | "updated_at">;

export type WorkbenchCategory = "property_search_lead" | "contact_request" | "showing_request" | "listing_submission" | "bulk_listing_import" | "listing_update" | "featured_media_request" | "media_upload" | "admin_task" | "agent_support" | "general_question" | "unknown_needs_followup";
export type ImportRowStatus = "imported" | "optional_skipped" | "needs_review" | "required_missing" | "duplicate_skipped";

export type ListingImportSummary = {
  id: string;
  file_name: string;
  file_type: "csv" | "xlsx" | "xls";
  total_rows: number;
  imported_rows: number;
  optional_skipped_rows: number;
  review_rows: number;
  failed_rows: number;
  duplicate_rows: number;
  status: "processing" | "completed" | "completed_with_review" | "failed";
  created_at: string;
  completed_at: string | null;
  created_by: string;
};

export type AIInquiry = {
  id: string;
  lead_user_id: string | null;
  assigned_agent_id: string | null;
  category: WorkbenchCategory;
  subject: string;
  details: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  listing_ids: string[];
  status: "new" | "assigned" | "in_progress" | "resolved" | "closed";
  created_at: string;
};
