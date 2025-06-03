export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'resident' | 'admin';
  apartment?: string; 
}