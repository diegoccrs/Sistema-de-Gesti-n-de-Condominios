// src/app/features/resident/resident-dashboard/resident-dashboard.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { UserProfileButtonComponent } from '../user-profile-button/user-profile-button.component';



import { Router } from '@angular/router';
import { Payment } from '../../../core/domain/models/payment.model';
import { SupabaseService } from '../../../core/infrastructure/supabase/supabase.service';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

// Imports for Payment Register Dialog
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { PaymentRegisterComponent } from '../payment-register/payment-register.component';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

// 🚨 ¡IMPORTA AQUI EL NEIGHBOR DIRECTORY COMPONENT!
import { NeighborDirectoryComponent } from './neighbor-directory/neighbor-directory.component';
import { PaymentMethodDialogComponent } from './payment-method-dialog/payment-method-dialog.component';


//importa conexion con Telegram
 import { ConectarTelegramComponent } from '../conectar-telegram/conectar-telegram.component';


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
    FormsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatSnackBarModule,
    NeighborDirectoryComponent,
    ConectarTelegramComponent,
    PaymentMethodDialogComponent
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
      width: '500px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.success) {
        this.snackBar.open('Pago reportado exitosamente.', 'Cerrar', {
          duration: 3000,
          panelClass: ['snackbar-success']
        });

        this.loadPendingPayments();
        this.loadPaymentHistory(this.dateFilterForm.value.startDate, this.dateFilterForm.value.endDate);
      } else if (result && result.error) {
        this.snackBar.open(`Error al reportar pago: ${result.error}`, 'Cerrar', {
          duration: 5000,
          panelClass: ['snackbar-error']
        });
      }

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
    const dialogRef = this.dialog.open(PaymentMethodDialogComponent, {
      width: '400px',
      data: payment
    });

    dialogRef.afterClosed().subscribe(method => {
      if (method) {
        this.snackBar.open(`Seleccionaste ${method} como método de pago.`, 'Cerrar', {
          duration: 3000,
          panelClass: ['snackbar-success']
        });

        // 👉 Aquí puedes manejar redirección o integración con pasarelas reales:
        console.log(`Iniciar flujo de pago con: ${method}`, payment);

        // Ejemplo futuro:
        // if (method === 'paypal') {
        //   this.redirectToPayPal(payment);
        // }
      }
    });
  }


  async uploadPaymentProof() {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.pdf,.jpg,.jpeg,.png';

      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;

        const user = await this.supabaseService.getCurrentUser();
        if (!user || !user.id) {
          this.snackBar.open('No se pudo identificar al usuario.', 'Cerrar', { duration: 3000 });
          return;
        }

        if (!this.pendingPayments || this.pendingPayments.length === 0) {
          this.snackBar.open('No hay pagos pendientes para adjuntar comprobante.', 'Cerrar', { duration: 3000 });
          return;
        }

        const payment = this.pendingPayments[0]; // Tomar el primer pago pendiente
        const fileExt = file.name.split('.').pop();
        const filePath = `proofs/${user.id}_${payment.id}.${fileExt}`;

        // Subir el archivo al bucket 'pagos-adjuntos'
        const { error: uploadError } = await this.supabaseService.supabase.storage
          .from('pagos-adjuntos')
          .upload(filePath, file, { upsert: true });

        if (uploadError) {
          console.error('Error al subir archivo:', uploadError);
          this.snackBar.open('Error al subir el archivo.', 'Cerrar', { duration: 3000 });
          return;
        }

        // Obtener la URL pública del archivo
        const { data: publicUrlData } = this.supabaseService.supabase
          .storage
          .from('pagos-adjuntos')
          .getPublicUrl(filePath);

        const publicUrl = publicUrlData.publicUrl;

        // Actualizar la fila en la tabla payments con el URL del comprobante
        const { error: updateError } = await this.supabaseService.supabase
          .from('payments')
          .update({ proof_url: publicUrl })
          .eq('id', payment.id);

        if (updateError) {
          console.error('Error al actualizar la base de datos:', updateError);
          this.snackBar.open('Comprobante subido, pero no se pudo registrar el enlace.', 'Cerrar', { duration: 3000 });
          return;
        }

        this.snackBar.open('¡Comprobante subido exitosamente!', 'Cerrar', { duration: 3000 });

        // Recargar pagos pendientes e historial
        this.loadPendingPayments();
        this.loadPaymentHistory(this.dateFilterForm.value.startDate, this.dateFilterForm.value.endDate);
      };

      input.click();
    } catch (error) {
      console.error('Error general en uploadPaymentProof:', error);
      this.snackBar.open('Ocurrió un error inesperado al subir el comprobante.', 'Cerrar', { duration: 3000 });
    }
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

  openPaymentMethods(payment: any): void {
    const dialogRef = this.dialog.open(PaymentMethodDialogComponent, {
      width: '400px',
      data: payment
    });

    dialogRef.afterClosed().subscribe(method => {
      if (method) {
        this.snackBar.open(`Seleccionaste ${method} para el pago: ${payment.concept}`, 'Cerrar', {
          duration: 3000
        });
        // Aquí puedes luego agregar la lógica de redirección o integración con la pasarela
      }
    });
  }

}


