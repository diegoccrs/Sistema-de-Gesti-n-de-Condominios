import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { createClient } from '@supabase/supabase-js';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';

const supabaseUrl = 'https://rimuwztixsaxiaznzfdg.supabase.co'; // <-- Tu URL de Supabase
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpbXV3enRpeHNheGlhem56ZmRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3NjE5MjgsImV4cCI6MjA2MzMzNzkyOH0.JCFytgjghRds9zzSVYDFIelcZVPFc-elKgx1Ic5V4Rc';         // <-- Tu PUBLIC ANON KEY
const supabase = createClient(supabaseUrl, supabaseKey);

@Component({
  selector: 'app-payments-confirmation',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule],
  templateUrl: './payments-confirmation.component.html'
})
export class PaymentsConfirmationComponent implements OnInit {
  pagosPendientes: any[] = [];
  displayedColumns: string[] = ['amount', 'currency', 'payment_date', 'status', 'acciones'];

  async ngOnInit() {
    await this.cargarPagos();
  }

  async cargarPagos() {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('status', 'pending');
    if (!error) {
      this.pagosPendientes = data ?? [];
    } else {
      alert('Error al cargar pagos pendientes: ' + error?.message);
      this.pagosPendientes = [];
      console.error(error);
    }
  }

  async aprobarPago(id: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('Usuario no autenticado.');
      return;
    }

    const { error } = await supabase
      .from('payments')
      .update({
        status: 'approved',
        confirmed_by: user.id,
        confirmation_date: new Date().toISOString()
      })
      .eq('id', id);

    if (!error) {
      this.pagosPendientes = this.pagosPendientes.filter(p => p.id !== id);
    } else {
      alert('Error al aprobar el pago');
    }
  }

  async rechazarPago(id: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('Usuario no autenticado.');
      return;
    }

    const { error } = await supabase
      .from('payments')
      .update({
        status: 'rejected',
        confirmed_by: user.id,
        confirmation_date: new Date().toISOString()
      })
      .eq('id', id);

    if (!error) {
      this.pagosPendientes = this.pagosPendientes.filter(p => p.id !== id);
    } else {
      alert('Error al rechazar el pago');
    }
  }
}
