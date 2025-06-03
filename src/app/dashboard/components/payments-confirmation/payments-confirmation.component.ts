import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card'; // Para mostrar cada pago como una tarjeta
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'; // Para notificaciones
import { MatTableModule } from '@angular/material/table'; // Si prefieres una tabla

import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../../../environments/environment'; 

// Interfaz para definir la estructura de un objeto de pago
// Esto es útil para la seguridad de tipos en TypeScript
interface Payment {
  id: string;
  resident_id: string;
  amount: number;
  currency: string;
  payment_date: string; // O Date, dependiendo de cómo lo manejes
  proof_url: string | null;
  status: 'pending' | 'confirmed' | 'rejected';
  reported_at: string; // O Date
  confirmed_by: string | null;
  confirmation_date: string | null;
  notes: string | null;
  // Opcional: Propiedades del residente para mostrar en la lista
  resident_first_name?: string;
  resident_last_name?: string;
  resident_email?: string;
}

@Component({
  selector: 'app-payments-confirmation',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatSnackBarModule, // Asegúrate de importar MatSnackBarModule
    MatTableModule // Si decides usar MatTable
  ],
  templateUrl: './payments-confirmation.component.html',
  styleUrls: ['./payments-confirmation.component.css']
})
export class PaymentsConfirmationComponent implements OnInit {
  private supabase: SupabaseClient;
  private snackBar = inject(MatSnackBar); // Inyectar MatSnackBar para notificaciones

  pendingPayments: Payment[] = [];
  isLoading = true;
  errorMessage: string | null = null;

  // Propiedades para MatTable si decides usarla
  displayedColumns: string[] = ['resident', 'amount', 'currency', 'paymentDate', 'reportedAt', 'proof', 'actions'];

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  ngOnInit(): void {
    this.loadPendingPayments();
  }

  /**
   * Carga los pagos con estado 'pending' desde Supabase.
   * Incluye los datos del residente para mostrar en la interfaz.
   */
  async loadPendingPayments(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = null;

    try {
      // Usamos el 'select' con el 'join' implícito de Supabase para obtener también datos del residente
      const { data, error } = await this.supabase
        .from('payments')
        .select(`
          *,
          profiles (
            first_name,
            last_name,
            email
          )
        `)
        .eq('status', 'pending'); // Filtra solo los pagos pendientes

      if (error) {
        throw error;
      }

      // Mapear los datos para aplanar la estructura del residente
      this.pendingPayments = data.map((payment: any) => ({
        ...payment,
        resident_first_name: payment.profiles?.first_name,
        resident_last_name: payment.profiles?.last_name,
        resident_email: payment.profiles?.email
      }));

      // Si no hay pagos pendientes, puedes mostrar un mensaje
      if (this.pendingPayments.length === 0) {
        this.snackBar.open('No hay pagos pendientes por el momento.', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
        });
      }

    } catch (error: any) {
      console.error('Error al cargar pagos pendientes:', error);
      this.errorMessage = `Error al cargar pagos: ${error.message}`;
      this.snackBar.open(this.errorMessage, 'Cerrar', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Confirma un pago específico.
   * @param paymentId El ID del pago a confirmar.
   */
  async confirmPayment(paymentId: string): Promise<void> {
    await this.updatePaymentStatus(paymentId, 'confirmed', 'Pago confirmado exitosamente.');
  }

  /**
   * Rechaza un pago específico.
   * @param paymentId El ID del pago a rechazar.
   */
  async rejectPayment(paymentId: string): Promise<void> {
    // Opcional: Podrías abrir un diálogo aquí para que el admin ingrese una nota de rechazo.
    await this.updatePaymentStatus(paymentId, 'rejected', 'Pago rechazado.');
  }

  /**
   * Actualiza el estado de un pago en Supabase.
   * @param paymentId El ID del pago.
   * @param newStatus El nuevo estado ('confirmed' o 'rejected').
   * @param successMessage Mensaje a mostrar en caso de éxito.
   */
  private async updatePaymentStatus(paymentId: string, newStatus: 'confirmed' | 'rejected', successMessage: string): Promise<void> {
    this.isLoading = true; // Activar spinner global (o podrías tener uno por fila)
    this.errorMessage = null; // Limpiar errores

    try {
      // Obtener el ID del administrador actual
      const { data: userData, error: userError } = await this.supabase.auth.getUser();
      if (userError || !userData.user) {
        throw new Error('Usuario no autenticado o no se pudo obtener el ID del usuario.');
      }
      const adminId = userData.user.id;

      // Realizar la actualización en Supabase
      const { error } = await this.supabase
        .from('payments')
        .update({
          status: newStatus,
          confirmed_by: adminId,
          confirmation_date: new Date().toISOString() // Captura la fecha y hora actual
        })
        .eq('id', paymentId); // Condición para actualizar el pago correcto

      if (error) {
        throw error;
      }

      // Notificación de éxito
      this.snackBar.open(successMessage, 'Cerrar', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['success-snackbar']
      });

      // Recargar la lista de pagos pendientes para reflejar el cambio
      this.loadPendingPayments();

    } catch (error: any) {
      console.error(`Error al ${newStatus} el pago ${paymentId}:`, error);
      this.errorMessage = `Error al procesar el pago: ${error.message}`;
      this.snackBar.open(this.errorMessage, 'Cerrar', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    } finally {
      this.isLoading = false; // Desactivar spinner
    }
  }

  /**
   * Abre la URL del comprobante en una nueva pestaña del navegador.
   * @param url La URL del comprobante.
   */
  openProof(url: string | null): void {
    if (url) {
      window.open(url, '_blank');
    } else {
      this.snackBar.open('No se encontró URL para el comprobante.', 'Cerrar', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['warn-snackbar']
      });
    }
  }
}