import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { environment } from '../../../../environments/environment';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; // <-- IMPORT THIS

const supabase: SupabaseClient = createClient(environment.supabaseUrl, environment.supabaseKey);

@Component({
  selector: 'app-payments-confirmation',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatProgressSpinnerModule // <-- ADD IT HERE
  ],
  templateUrl: './payments-confirmation.component.html',
  styleUrls: ['./payments-confirmation.component.css']
})
export class PaymentsConfirmationComponent implements OnInit {
  pagosPendientes: any[] = [];
  // Ensure your displayedColumns match what you intend to show
  displayedColumns: string[] = ['resident_name', 'amount', 'currency', 'payment_date', 'status', 'proof_url', 'actions'];
  isLoading = true;
  errorMessage: string | null = null;

  constructor(private router: Router) {}

  async ngOnInit() {
    await this.cargarPagos();
  }

  async cargarPagos() {
    this.isLoading = true;
    this.errorMessage = null;
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*, resident_id(email, first_name, last_name)') 
        .eq('status', 'pending_confirmation') 
        .order('reported_at', { ascending: true });

      if (error) {
        throw error;
      }
      this.pagosPendientes = data?.map(p => ({
        ...p,
        resident_name: p.resident_id ? `${(p.resident_id as any).first_name || ''} ${(p.resident_id as any).last_name || ''}`.trim() || (p.resident_id as any).email : 'N/A',
      })) || [];

    } catch (error: any) {
      console.error('Error al cargar pagos pendientes de confirmación:', error);
      this.errorMessage = 'Error al cargar pagos pendientes: ' + error?.message;
      this.pagosPendientes = [];
    } finally {
      this.isLoading = false;
    }
  }

  async aprobarPago(id: string) {
    this.isLoading = true;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      this.errorMessage = 'Usuario no autenticado.';
      this.isLoading = false;
      return;
    }

    try {
      const { error } = await supabase
        .from('payments')
        .update({
          status: 'confirmed', 
          confirmed_by: user.id,
          confirmation_date: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      await this.cargarPagos(); 
    } catch (error: any) {
      this.errorMessage = 'Error al aprobar el pago: ' + error?.message;
    } finally {
      this.isLoading = false;
    }
  }

  async rechazarPago(id: string) {
    this.isLoading = true;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      this.errorMessage = 'Usuario no autenticado.';
      this.isLoading = false;
      return;
    }
    
    try {
      const { error } = await supabase
        .from('payments')
        .update({
          status: 'rejected',
          confirmed_by: user.id,
          confirmation_date: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      await this.cargarPagos();
    } catch (error: any) {
       this.errorMessage = 'Error al rechazar el pago: ' + error?.message;
    } finally {
      this.isLoading = false;
    }
  }

  goBackToAdminDashboard(): void {
    this.router.navigate(['/dashboard/admin-home']);
  }

  openProof(proofUrl: string | null): void {
    if (proofUrl) {
      window.open(proofUrl, '_blank');
    } else {
      console.warn('No proof URL available for this payment.');
    }
  }
}