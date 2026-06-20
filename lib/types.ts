export type Property = {
  id: string;
  agent_id: string;
  title: string;
  price: number;
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
  availability: "available" | "booked" | "reserved" | "sold" | "rented";
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
  role: "admin" | "agent";
};

export type PropertyInput = Omit<Property, "id" | "agent_id" | "created_at">;
