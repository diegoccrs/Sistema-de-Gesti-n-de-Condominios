export interface Payment {
  id: string;
  resident_id: string;
  amount: number;
  due_date: string;
  concept: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled' | 'pending_review';
  created_at: string;
  payment_date?: string;
  receipt_url?: string;
  verified_by?: string;
}