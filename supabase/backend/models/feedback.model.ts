export interface Feedback {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  location?: string;
  contact_info?: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  image_urls?: string[];
  created_at: string;
  updated_at?: string;
  admin_notes?: string;
  assigned_to?: string;
  resolution_date?: string;
}

export interface CreateFeedbackRequest {
  title: string;
  description: string;
  category: string;
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  location?: string;
  contact_info?: string;
  image_files?: File[];
}

export interface FeedbackFilters {
  status?: string;
  category?: string;
  urgency?: string;
  user_id?: string;
  date_from?: string;
  date_to?: string;
}
