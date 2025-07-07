import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root',
})
export class LogicaService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      'https://rimuwztixsaxiaznzfdg.supabase.co',         // ← reemplaza con tu URL real
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpbXV3enRpeHNheGlhem56ZmRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3NjE5MjgsImV4cCI6MjA2MzMzNzkyOH0.JCFytgjghRds9zzSVYDFIelcZVPFc-elKgx1Ic5V4Rc'                     // ← y tu clave pública (anon)
    );
  }
async getUserId(): Promise<string | null> {
  const { data, error } = await this.supabase.auth.getUser();
  if (error) {
    console.error('Error al obtener el usuario:', error);
    return null;
  }
  return data?.user?.id ?? null;
}

  // 👉 Método para obtener pagos pendientes con vencimiento
  async getPagosPendientesConVencimiento(residenteId: string) {
    const { data, error } = await this.supabase
      .from('payments')
      .select('id, concept, amount, expiration_date')
      .eq('resident_id', residenteId)
      .eq('status', 'pending')
      .not('expiration_date', 'is', null);

    if (error) {
      console.error('Error al obtener pagos pendientes:', error);
      throw error;
    }

    return data;
  }

}
