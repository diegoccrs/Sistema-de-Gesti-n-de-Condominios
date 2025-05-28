import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../../../../environments/environment';
import { UserProfileButtonComponent } from '../user-profile-button/user-profile-button.component';

const supabase: SupabaseClient = createClient(
  environment.supabaseUrl,
  environment.supabaseKey
);

@Component({
  selector: 'app-resident-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatListModule,
    MatIconModule,
    UserProfileButtonComponent
  ],
  templateUrl: './resident-dashboard.component.html',
  styleUrls: ['./resident-dashboard.component.css']
})
export class ResidentDashboardComponent implements OnInit {
  announcements: any[] = [];
  pendingPayments: any[] = [];
  isLoading = true;
  errorMessage: string | null = null;

  async ngOnInit() {
    try {
      await this.loadAnnouncements();
      await this.loadPendingPayments();
    } catch (error) {
      this.errorMessage = 'Error al cargar los datos. Intente recargar la página.';
    } finally {
      this.isLoading = false;
    }
  }

  private async loadAnnouncements() {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (!error) this.announcements = data || [];
  }

  private async loadPendingPayments() {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('status', 'pending')
      .order('due_date', { ascending: true });

    if (!error) this.pendingPayments = data || [];
  }

  openPaymentDetails(payment: any) {
    // Lógica para mostrar detalles de pago
    console.log('Detalles de pago:', payment);
  }

  reportIssue() {
    this.errorMessage = 'Funcionalidad en desarrollo. Próximamente disponible.';
  }
}