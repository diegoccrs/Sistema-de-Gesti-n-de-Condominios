export interface Announcement {
  id: string; // uuid
  title: string; // text
  content: string | null; // text (nullable)
  author_id: string; // uuid (references auth.users.id)
  is_published: boolean; // boolean
  created_at: string; // timestampz (ISO string)
  updated_at: string; // timestampz (ISO string)
  expiration_date: string | null; // timestampz (ISO string, nullable)
  priority: number; // int2
  attachment_url: string | null; // text (nullable, URL of the attachment)
}