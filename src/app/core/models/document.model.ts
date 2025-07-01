export interface Document {
  id: string;
  title: string;
  description?: string;
  category: string;
  file_path: string;
  file_name: string;
  file_type?: string;
  file_size?: number;
  user_id: string;
  created_at: string; // ISO 8601 date string
}

// We can also define the categories here for consistency
export const DOCUMENT_CATEGORIES = [
  'Financiero',
  'Administrativo',
  'Actas de Reunión',
  'Legal',
  'Normas y Reglamentos',
  'Otros'
];
