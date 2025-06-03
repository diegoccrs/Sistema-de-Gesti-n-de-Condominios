import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { UserProfileButtonComponent } from '../user-profile-button/user-profile-button.component';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { Payment } from '../../../core/domain/models/payment.model';
import { SupabaseService } from '../../../core/infrastructure/supabase/supabase.service';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

// Imports for Payment Register Dialog
import { MatDialog, MatDialogModule } from '@angular/material/dialog'; 
import { PaymentRegisterComponent } from '../payment-register/payment-register.component'; 
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'; 


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
    MatTableModule,
    ReactiveFormsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatSnackBarModule 
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
  dateFilterForm: FormGroup;

  constructor(
    private router: Router,
    private supabaseService: SupabaseService,
    private fb: FormBuilder,
    private dialog: MatDialog, 
    private snackBar: MatSnackBar 
  ) {
    this.dateFilterForm = this.fb.group({
      startDate: [null],
      endDate: [null]
    });
  }

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
  


  openPaymentRegisterDialog(): void {
    const dialogRef = this.dialog.open(PaymentRegisterComponent, {
      width: '500px', // Or your preferred width
      disableClose: true 
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.success) {
        this.snackBar.open('Pago reportado exitosamente.', 'Cerrar', {
          duration: 3000,
          panelClass: ['snackbar-success'] 
        });
        // Refresh payment lists
        this.loadPendingPayments();
        this.loadPaymentHistory(this.dateFilterForm.value.startDate, this.dateFilterForm.value.endDate);
      } else if (result && result.error) {
         this.snackBar.open(`Error al reportar pago: ${result.error}`, 'Cerrar', {
          duration: 5000,
          panelClass: ['snackbar-error']
        });
      }
      // If result is undefined (dialog closed without action), do nothing
    });
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
        .select('*') 
        .eq('resident_id', userId)
        .eq('status', 'pending')
        .order('reported_at', { ascending: true }); 

      if (error) throw error;
      this.pendingPayments = data?.map(p => ({
          ...p,
          currency_code: p.currency 
      })) || [];
    } catch (error: any) {
      console.error("Error en loadPendingPayments:", error);
    } finally {
      this.isLoadingPayments = false;
    }
  }
   private async loadPaymentHistory(startDate?: Date, endDate?: Date) {
    this.isLoadingHistory = true;
    this.errorMessage = null; 
    const user = await this.supabaseService.getCurrentUser();
    if (!user?.id) {
      console.warn('Usuario no autenticado, no se puede cargar el historial de pagos.');
      this.paymentHistory = [];
      this.isLoadingHistory = false;
      return;
    }
    try {
      let finalStartDate: string | undefined;
      let finalEndDate: string | undefined;

      if (startDate) {
        finalStartDate = startDate.toISOString().split('T')[0]; 
      }
      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        finalEndDate = endOfDay.toISOString();
      }
      
      this.paymentHistory = await this.supabaseService.getPaymentsByResident(user.id, finalStartDate, finalEndDate);
      this.paymentHistory.sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime());
    } catch (error: any) {
      console.error('Error al cargar el historial de pagos:', error);
      this.errorMessage = 'No se pudo cargar el historial de pagos.';
      this.paymentHistory = []; 
    } finally {
      this.isLoadingHistory = false;
    }
  }

  applyDateFilter() {
    const { startDate, endDate } = this.dateFilterForm.value;
    if (startDate && endDate && endDate < startDate) {
        this.errorMessage = 'La fecha "Hasta" no puede ser anterior a la fecha "Desde".';
        return;
    }
    this.loadPaymentHistory(startDate, endDate);
  }

  clearDateFilter() {
    this.dateFilterForm.reset();
    this.loadPaymentHistory(); 
    this.errorMessage = null; 
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
    this.errorMessage = 'Funcionalidad "Subir Comprobante" en desarrollo.';
  }

  reportIssue() {
    console.log('Navegar a reportar problema');
    this.errorMessage = 'Funcionalidad "Reportar Problema" en desarrollo. ¡Próximamente!';
  }

  goToDocuments() {
    console.log('Navegar a documentos comunes');
    this.errorMessage = 'Funcionalidad "Documentos Comunes" en desarrollo.';
  }

  contactAdmin() {
    console.log('Contactar administración');
    this.errorMessage = 'Funcionalidad "Contactar Administración" en desarrollo.';
  }
}