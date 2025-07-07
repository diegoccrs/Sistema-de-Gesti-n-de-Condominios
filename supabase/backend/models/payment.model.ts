import { Profile } from './profile.model'; // Asegúrate de importar Profile

export interface Payment {
  id: string;
  resident_id: string;
  amount: number;
  currency: 'USD' | 'VES' | 'EUR';
  status: 'pending' | 'confirmed' | 'rejected';
  proof_url: string | null;
  payment_date: string;
  created_at: string;
  confirmed_by: string | null;
  confirmation_date: string | null; // Este campo también es importante si lo usas
  concept: string;
  due_date?: string | null; // Si existe en tu tabla de pagos y lo usas para vencimientos

  // ***** ESTAS PROPIEDADES SON CLAVE PARA RESOLVER LOS ERRORES *****
  resident_profile?: Partial<Profile>;
  confirmed_by_profile?: Partial<Profile>;
}