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
  availability: "available" | "reserved" | "sold" | "rented";
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
  created_at: string;
};

export type PropertyInput = Omit<Property, "id" | "agent_id" | "created_at">;
