import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table'; 
import { SupabaseClient, createClient, User } from '@supabase/supabase-js';
import { environment } from '../../../../environments/environment';
import { UserProfileButtonComponent } from '../user-profile-button/user-profile-button.component';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { Payment } from '../../../core/domain/models/payment.model'; 
import { SupabaseService } from '../../../core/infrastructure/supabase/supabase.service'; 


// const supabase: SupabaseClient = createClient(
//   environment.supabaseUrl,
//   environment.supabaseKey
// );

@Component({
  selector: 'app-resident-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatListModule,
    MatIconModule,
    MatProgressSpinnerModule,
    UserProfileButtonComponent,
    DatePipe,
    CurrencyPipe,
    MatTableModule 
  ],
  templateUrl: './resident-dashboard.component.html',
  styleUrls: ['./resident-dashboard.component.css']
})
export class ResidentDashboardComponent implements OnInit {
  announcements: any[] = [];
  pendingPayments: any[] = [];
  paymentHistory: Payment[] = []; 
  
  isLoading = true; 
  isLoadingAnnouncements = true;
  isLoadingPayments = true;
  isLoadingHistory = true; 

  errorMessage: string | null = null;
  residentName: string = 'Residente';
  
  
  displayedPaymentHistoryColumns: string[] = ['concept', 'payment_date', 'amount', 'currency', 'status', 'proof_url'];


  // Inject SupabaseService instead of creating a local Supabase client
  constructor(
    private router: Router,
    private supabaseService: SupabaseService 
  ) { }

  async ngOnInit() {
    this.isLoading = true;
    this.errorMessage = null;

    try {
      await Promise.all([
        this.loadUserProfile(),
        this.loadAnnouncements(),
        this.loadPendingPayments(),
        this.loadPaymentHistory() 
      ]);
    } catch (error) {
      console.error('Error al cargar el dashboard:', error);
      this.errorMessage = 'Hubo un problema al cargar los datos. Por favor, intenta recargar la página.';
    } finally {
      this.isLoading = false;
    }
  }

  private async loadUserProfile() {
    const user = await this.supabaseService.getCurrentUser(); 
    if (!user?.id) {
      console.error('Error obteniendo sesión del usuario o ID de usuario no disponible.');
      this.residentName = 'Usuario';
      return;
    }
    const userId = user.id;

    try {
      const profile = await this.supabaseService.getProfile(userId); 
      if (profile && profile.first_name) {
        this.residentName = profile.first_name;
      } else {
        this.residentName = 'Residente';
      }
    } catch (profileError) {
      console.error('Error al cargar el perfil del usuario:', profileError);
      this.residentName = 'Usuario';
    }
  }

  private async loadAnnouncements() {
    this.isLoadingAnnouncements = true;
    try {
      const { data, error } = await this.supabaseService.supabase 
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      this.announcements = data || [];
    } catch (error: any) {
      console.error("Error en loadAnnouncements:", error);
      
    } finally {
      this.isLoadingAnnouncements = false;
    }
  }

  private async loadPendingPayments() {
  this.isLoadingPayments = true;
  const user = await this.supabaseService.getCurrentUser();
  if (!user?.id) {
    this.isLoadingPayments = false;
    return;
  }
  const userId = user.id;

  try {
    const { data, error } = await this.supabaseService.supabase
      .from('payments')
      .select('*') // Keep select('*') for now, address currency_type(code) next if still an issue
      .eq('resident_id', userId)
      .eq('status', 'pending')
      .order('reported_at', { ascending: true }); // CHANGED from due_date to reported_at

    if (error) throw error;
    this.pendingPayments = data?.map(p => ({
        ...p,
        // If 'currency' is a direct column in 'payments' table (e.g., "VES", "USD")
        // then p.currency_type will be undefined.
        // You should directly use p.currency.
        currency_code: p.currency 
    })) || [];
  } catch (error: any) {
    console.error("Error en loadPendingPayments:", error);
    // Potentially set a specific error message for this section
  } finally {
    this.isLoadingPayments = false;
  }
}

  
  private async loadPaymentHistory() {
    this.isLoadingHistory = true;
    const user = await this.supabaseService.getCurrentUser(); 
    if (!user?.id) {
      console.warn('Usuario no autenticado, no se puede cargar el historial de pagos.');
      this.isLoadingHistory = false;
      return;
    }
    try {
      
      this.paymentHistory = await this.supabaseService.getPaymentsByResident(user.id);
      
      this.paymentHistory.sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime());
    } catch (error: any) {
      console.error('Error al cargar el historial de pagos:', error);
      this.errorMessage = 'No se pudo cargar el historial de pagos.'; 
    } finally {
      this.isLoadingHistory = false;
    }
  }

  
  openAnnouncementDetails(announcement: any) {
    console.log('Ver detalles del anuncio:', announcement);
    this.errorMessage = 'Visualización de detalles de anuncio en desarrollo.';
  }

  openPaymentDetails(payment: any) {
    console.log('Ver detalles de pago:', payment);
    this.errorMessage = 'Visualización de detalles de pago en desarrollo.';
  }

  uploadPaymentProof() {
    console.log('Navegar a subir comprobante');
    this.router.navigate(['/resident/payments/upload']); 
  }

  reportIssue() {
    console.log('Navegar a reportar problema');
    // this.router.navigate(['/resident/issues/report']);
    this.errorMessage = 'Funcionalidad "Reportar Problema" en desarrollo. ¡Próximamente!';
  }

  goToDocuments() {
    console.log('Navegar a documentos comunes');
    // this.router.navigate(['/resident/documents']);
    this.errorMessage = 'Funcionalidad "Documentos Comunes" en desarrollo.';
  }

  contactAdmin() {
    console.log('Contactar administración');
    // this.router.navigate(['/resident/contact-admin']);
    this.errorMessage = 'Funcionalidad "Contactar Administración" en desarrollo.';
  }
}